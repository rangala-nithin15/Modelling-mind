"""
env/cluster_env.py - High-fidelity distributed cluster simulation environment
"""

import math
import random
from typing import Dict, List, Optional, Tuple, Any


class ClusterEnv:
    def __init__(
        self,
        n_nodes: int = 6,
        node_capacity: int = 4,
        arrival_rate: float = 2.0,
        duration_range: Tuple[int, int] = (3, 8),
        slack_range: Tuple[int, int] = (4, 10),
        episode_length: int = 400,
        seed: Optional[int] = None,
        expose_health: bool = False,
    ):
        self.n_nodes = n_nodes
        self.node_capacity = node_capacity
        self.arrival_rate = arrival_rate
        self.duration_range = duration_range
        self.slack_range = slack_range
        self.episode_length = episode_length
        self.expose_health = expose_health

        if seed is not None:
            self.rng = random.Random(seed)
        else:
            self.rng = random.Random()

        # State tracking
        self.current_step = 0
        self.next_task_id = 1
        self.tasks: Dict[int, Dict[str, Any]] = {}
        self.node_true_states: Dict[int, str] = {}  # "HEALTHY", "DEGRADED", "DOWN"
        self.node_state_duration: Dict[int, int] = {}
        self.node_failure_schedule: Dict[int, List[Tuple[int, int, str]]] = {}

        # Episode metrics
        self.completed_count = 0
        self.failed_count = 0
        self.reroute_count = 0
        self.total_generated_tasks = 0
        self.total_reward = 0.0

        # Failure detection tracking for metrics
        self.node_first_failure_step: Dict[int, Optional[int]] = {}
        self.node_first_detection_step: Dict[int, Optional[int]] = {}
        self.detection_latencies: List[int] = []

    def reset(self) -> Dict[str, Any]:
        self.current_step = 0
        self.next_task_id = 1
        self.tasks = {}
        self.completed_count = 0
        self.failed_count = 0
        self.reroute_count = 0
        self.total_generated_tasks = 0
        self.total_reward = 0.0
        self.detection_latencies = []

        # All nodes start healthy
        self.node_true_states = {i: "HEALTHY" for i in range(self.n_nodes)}
        self.node_state_duration = {i: 0 for i in range(self.n_nodes)}
        self.node_first_failure_step = {i: None for i in range(self.n_nodes)}
        self.node_first_detection_step = {i: None for i in range(self.n_nodes)}

        # Pre-schedule independent failure events per node across the episode
        # Staggered failures with varied durations and recoveries
        self._schedule_failures()

        # Initial task burst
        self._generate_new_tasks()

        return self._get_obs()

    def _schedule_failures(self) -> None:
        self.node_failure_schedule = {i: [] for i in range(self.n_nodes)}
        # Ensure distinct realistic failure episodes across nodes
        # Node 1 fails mid-episode, Node 3 degrades early, etc.
        for node_id in range(self.n_nodes):
            # Probability that this node has failure events
            if self.rng.random() < 0.75:
                # 1 to 3 failure episodes per node
                num_events = self.rng.randint(1, 2)
                t_cursor = self.rng.randint(30, 80)
                for _ in range(num_events):
                    if t_cursor >= self.episode_length - 40:
                        break
                    duration = self.rng.randint(25, 70)
                    failure_type = self.rng.choice(["DEGRADED", "DOWN"])
                    self.node_failure_schedule[node_id].append((t_cursor, t_cursor + duration, failure_type))
                    t_cursor += duration + self.rng.randint(50, 120)

    def _generate_new_tasks(self) -> None:
        # Poisson-like arrival using arrival_rate
        # Knuth's algorithm for Poisson random number
        L = math.exp(-self.arrival_rate)
        k = 0
        p = 1.0
        while True:
            k += 1
            p *= self.rng.random()
            if p <= L:
                break
        count = k - 1

        for _ in range(count):
            tid = self.next_task_id
            self.next_task_id += 1
            duration = self.rng.randint(*self.duration_range)
            slack = self.rng.randint(*self.slack_range)
            deadline = self.current_step + duration + slack

            self.tasks[tid] = {
                "task_id": tid,
                "node": None,
                "remaining_duration": float(duration),
                "total_duration": duration,
                "deadline": deadline,
                "created_step": self.current_step,
                "last_node": None,
                "reroute_count": 0,
            }
            self.total_generated_tasks += 1

    def step(self, actions: Dict[int, int]) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
        self.current_step += 1
        step_reward = 0.0
        failed_this_step = []

        # 1. Update node true health states based on schedule
        for node_id in range(self.n_nodes):
            old_state = self.node_true_states[node_id]
            current_scheduled_state = "HEALTHY"
            for start_t, end_t, f_type in self.node_failure_schedule[node_id]:
                if start_t <= self.current_step < end_t:
                    current_scheduled_state = f_type
                    break
            
            if current_scheduled_state != old_state:
                self.node_true_states[node_id] = current_scheduled_state
                self.node_state_duration[node_id] = 0
                if current_scheduled_state in ("DEGRADED", "DOWN"):
                    failed_this_step.append(node_id)
                    if self.node_first_failure_step[node_id] is None:
                        self.node_first_failure_step[node_id] = self.current_step
            else:
                self.node_state_duration[node_id] += 1

        # 2. Process agent actions {task_id: node_id}
        # Count currently assigned tasks per node
        current_node_counts = {i: 0 for i in range(self.n_nodes)}
        for task in self.tasks.values():
            if task["node"] is not None:
                current_node_counts[task["node"]] += 1

        if actions:
            for task_id, target_node in actions.items():
                if task_id not in self.tasks:
                    continue
                if not (0 <= target_node < self.n_nodes):
                    continue

                task = self.tasks[task_id]
                old_node = task["node"]

                if old_node == target_node:
                    # No change
                    continue

                # Check target node capacity
                # If task was already on another node, its departure frees 1 slot there
                if current_node_counts[target_node] < self.node_capacity:
                    if old_node is not None:
                        current_node_counts[old_node] -= 1
                        # Cold restart penalty!
                        task["remaining_duration"] = float(task["total_duration"])
                        task["reroute_count"] += 1
                        self.reroute_count += 1
                        step_reward -= 0.05  # small churn penalty

                    current_node_counts[target_node] += 1
                    task["node"] = target_node
                    task["last_node"] = old_node

        # 3. Simulate task execution progress
        finished_tasks = []
        for task_id, task in list(self.tasks.items()):
            node_id = task["node"]

            # Progress execution if assigned
            if node_id is not None:
                state = self.node_true_states[node_id]
                if state == "HEALTHY":
                    task["remaining_duration"] -= 1.0
                elif state == "DEGRADED":
                    # Degraded node progresses slowly (e.g. 40% speed or partial progress)
                    if self.rng.random() < 0.4:
                        task["remaining_duration"] -= 1.0
                    else:
                        task["remaining_duration"] -= 0.1
                elif state == "DOWN":
                    # Down node makes zero progress
                    pass

            # Check completion
            if task["remaining_duration"] <= 0.0:
                self.completed_count += 1
                step_reward += 1.0  # Priority 1: reward for completion
                finished_tasks.append(task_id)
                continue

            # Check deadline failure
            if self.current_step >= task["deadline"]:
                self.failed_count += 1
                step_reward -= 1.0  # Penalty for missing deadline
                finished_tasks.append(task_id)
                continue

        # Remove finished/failed tasks from active dict
        for tid in finished_tasks:
            del self.tasks[tid]

        # 4. Generate new tasks for next step
        if self.current_step < self.episode_length:
            self._generate_new_tasks()

        done = (self.current_step >= self.episode_length)
        self.total_reward += step_reward

        obs = self._get_obs()

        info = {
            "failed_this_step": failed_this_step,
            "step": self.current_step,
            "completed_count": self.completed_count,
            "failed_count": self.failed_count,
            "reroute_count": self.reroute_count,
            "total_reward": self.total_reward,
        }

        if self.expose_health:
            info["node_true_states"] = dict(self.node_true_states)

        return obs, step_reward, done, info

    def _get_obs(self) -> Dict[str, Any]:
        """Construct noisy telemetry for nodes and active tasks list."""
        node_counts = {i: 0 for i in range(self.n_nodes)}
        for task in self.tasks.values():
            if task["node"] is not None:
                node_counts[task["node"]] += 1

        nodes_telemetry = []
        for i in range(self.n_nodes):
            state = self.node_true_states[i]
            q_len = node_counts[i]

            # Generate noisy telemetry based on actual hidden state
            if state == "HEALTHY":
                # Heartbeat 98% ok
                heartbeat_ok = self.rng.random() < 0.98
                # Latency: base 25ms + queue delay (8ms per task) + noise
                latency_ms = max(5.0, self.rng.gauss(25.0 + q_len * 6.0, 5.0))
                # Error rate: base 0.01 + noise
                error_rate = max(0.0, min(1.0, self.rng.gauss(0.01, 0.01)))

            elif state == "DEGRADED":
                # Heartbeat drops occasionally ~70% ok
                heartbeat_ok = self.rng.random() < 0.70
                # Latency elevated: 180-350ms with jitter
                latency_ms = max(50.0, self.rng.gauss(240.0 + q_len * 20.0, 45.0))
                # Error rate elevated: 0.20 - 0.45
                error_rate = max(0.05, min(1.0, self.rng.gauss(0.28, 0.08)))

            else:  # "DOWN"
                # Heartbeat fails almost completely
                heartbeat_ok = self.rng.random() < 0.06
                # Latency timeout: 800 - 1400ms
                latency_ms = max(500.0, self.rng.gauss(950.0, 150.0))
                # Error rate severe: 0.85 - 1.00
                error_rate = max(0.70, min(1.0, self.rng.gauss(0.92, 0.05)))

            nodes_telemetry.append({
                "node_id": i,
                "heartbeat_ok": bool(heartbeat_ok),
                "latency_ms": round(float(latency_ms), 2),
                "error_rate": round(float(error_rate), 4),
                "queue_len": int(q_len),
                "capacity": int(self.node_capacity),
            })

        tasks_list = []
        for task in self.tasks.values():
            tasks_list.append({
                "task_id": task["task_id"],
                "node": task["node"],
                "remaining_duration": round(float(task["remaining_duration"]), 1),
                "deadline": int(task["deadline"]),
                "total_duration": int(task["total_duration"]),
                "time_to_deadline": int(task["deadline"] - self.current_step),
            })

        return {
            "step": self.current_step,
            "nodes": nodes_telemetry,
            "tasks": tasks_list,
        }

    def get_episode_log(self) -> Dict[str, Any]:
        return {
            "completed_count": self.completed_count,
            "failed_count": self.failed_count,
            "reroute_count": self.reroute_count,
            "total_tasks": self.total_generated_tasks,
            "total_reward": round(self.total_reward, 2),
            "completion_rate": (
                round(self.completed_count / max(1, self.completed_count + self.failed_count) * 100, 1)
            ),
        }
