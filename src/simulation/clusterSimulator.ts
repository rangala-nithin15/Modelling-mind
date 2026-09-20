import { NodeState, NodeTelemetry, TaskItem, DecisionLogItem, SimulationMetrics } from "../types";

export class BrowserClusterSimulator {
  n_nodes: number;
  node_capacity: number;
  arrival_rate: number;
  duration_range: [number, number];
  slack_range: [number, number];
  episode_length: number;

  step_count: number = 0;
  next_task_id: number = 1;
  tasks: Map<number, TaskItem> = new Map();

  // Ground-truth node state (hidden from agent)
  node_true_states: NodeState[];
  node_failure_schedules: Array<Array<{ start: number; end: number; state: NodeState }>>;

  // Metrics
  completed_count: number = 0;
  failed_count: number = 0;
  reroute_count: number = 0;
  total_generated_tasks: number = 0;
  total_reward: number = 0;

  // Agent State (Guardian)
  agent_type: "guardian" | "baseline";
  guardian_states: NodeState[];
  guardian_confidence: number[];
  guardian_ewma_latency: number[];
  guardian_ewma_error: number[];
  guardian_missed_hb: number[];
  guardian_healthy_streak: number[];
  guardian_unhealthy_streak: number[];
  guardian_rr_cursor: number = 0;

  // Baseline state
  baseline_rr_cursor: number = 0;

  // Logs
  decision_logs: DecisionLogItem[] = [];

  constructor(
    n_nodes: number = 6,
    node_capacity: number = 4,
    arrival_rate: number = 2.0,
    episode_length: number = 400,
    agent_type: "guardian" | "baseline" = "guardian"
  ) {
    this.n_nodes = n_nodes;
    this.node_capacity = node_capacity;
    this.arrival_rate = arrival_rate;
    this.duration_range = [3, 8];
    this.slack_range = [4, 10];
    this.episode_length = episode_length;
    this.agent_type = agent_type;

    this.node_true_states = Array(n_nodes).fill("HEALTHY");
    this.node_failure_schedules = Array(n_nodes).fill(null).map(() => []);

    this.guardian_states = Array(n_nodes).fill("HEALTHY");
    this.guardian_confidence = Array(n_nodes).fill(1.0);
    this.guardian_ewma_latency = Array(n_nodes).fill(30.0);
    this.guardian_ewma_error = Array(n_nodes).fill(0.01);
    this.guardian_missed_hb = Array(n_nodes).fill(0);
    this.guardian_healthy_streak = Array(n_nodes).fill(10);
    this.guardian_unhealthy_streak = Array(n_nodes).fill(0);

    this.reset();
  }

  reset() {
    this.step_count = 0;
    this.next_task_id = 1;
    this.tasks.clear();
    this.completed_count = 0;
    this.failed_count = 0;
    this.reroute_count = 0;
    this.total_generated_tasks = 0;
    this.total_reward = 0;
    this.decision_logs = [];

    this.node_true_states = Array(this.n_nodes).fill("HEALTHY");
    this.guardian_states = Array(this.n_nodes).fill("HEALTHY");
    this.guardian_confidence = Array(this.n_nodes).fill(1.0);
    this.guardian_ewma_latency = Array(this.n_nodes).fill(30.0);
    this.guardian_ewma_error = Array(this.n_nodes).fill(0.01);
    this.guardian_missed_hb = Array(this.n_nodes).fill(0);
    this.guardian_healthy_streak = Array(this.n_nodes).fill(10);
    this.guardian_unhealthy_streak = Array(this.n_nodes).fill(0);
    this.guardian_rr_cursor = 0;
    this.baseline_rr_cursor = 0;

    // Default scheduled failures (e.g. Node 2 degrades at step 20, Node 5 goes down at step 35)
    this.node_failure_schedules = Array(this.n_nodes).fill(null).map(() => []);
    if (this.n_nodes >= 6) {
      this.node_failure_schedules[2] = [{ start: 25, end: 70, state: "DEGRADED" }];
      this.node_failure_schedules[5] = [{ start: 40, end: 95, state: "DOWN" }];
      this.node_failure_schedules[1] = [{ start: 120, end: 170, state: "DEGRADED" }];
      this.node_failure_schedules[4] = [{ start: 150, end: 200, state: "DOWN" }];
    }

    this._generateTasks();
  }

  // Allow manual fault injection from UI
  injectNodeState(node_id: number, state: NodeState) {
    if (node_id >= 0 && node_id < this.n_nodes) {
      this.node_true_states[node_id] = state;
    }
  }

  private _generateTasks() {
    // Poisson arrival
    const lambda = this.arrival_rate;
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    const count = k - 1;

    for (let i = 0; i < count; i++) {
      const tid = this.next_task_id++;
      const dur = Math.floor(Math.random() * (this.duration_range[1] - this.duration_range[0] + 1)) + this.duration_range[0];
      const slack = Math.floor(Math.random() * (this.slack_range[1] - this.slack_range[0] + 1)) + this.slack_range[0];
      const deadline = this.step_count + dur + slack;

      this.tasks.set(tid, {
        task_id: tid,
        node: null,
        remaining_duration: dur,
        total_duration: dur,
        deadline: deadline,
        time_to_deadline: deadline - this.step_count,
        created_step: this.step_count,
        reroute_count: 0,
      });
      this.total_generated_tasks++;
    }
  }

  getTelemetry(): NodeTelemetry[] {
    const counts = Array(this.n_nodes).fill(0);
    for (const t of this.tasks.values()) {
      if (t.node !== null) counts[t.node]++;
    }

    return Array(this.n_nodes).fill(0).map((_, i) => {
      const state = this.node_true_states[i];
      const qLen = counts[i];

      let heartbeat_ok = true;
      let latency_ms = 30.0;
      let error_rate = 0.01;

      if (state === "HEALTHY") {
        heartbeat_ok = Math.random() < 0.98;
        latency_ms = Math.max(10, 25 + qLen * 6 + (Math.random() - 0.5) * 10);
        error_rate = Math.max(0, 0.01 + (Math.random() - 0.5) * 0.01);
      } else if (state === "DEGRADED") {
        heartbeat_ok = Math.random() < 0.70;
        latency_ms = Math.max(50, 240 + qLen * 18 + (Math.random() - 0.5) * 60);
        error_rate = Math.max(0.08, 0.28 + (Math.random() - 0.5) * 0.12);
      } else {
        // DOWN
        heartbeat_ok = Math.random() < 0.05;
        latency_ms = Math.max(500, 950 + (Math.random() - 0.5) * 200);
        error_rate = Math.max(0.75, 0.92 + (Math.random() - 0.5) * 0.1);
      }

      return {
        node_id: i,
        heartbeat_ok,
        latency_ms: Math.round(latency_ms * 10) / 10,
        error_rate: Math.round(error_rate * 1000) / 1000,
        queue_len: qLen,
        capacity: this.node_capacity,
      };
    });
  }

  step(): {
    telemetry: NodeTelemetry[];
    metrics: SimulationMetrics;
    decisions: DecisionLogItem[];
  } {
    this.step_count++;

    // 1. Update true state from schedule if not overridden manually
    for (let i = 0; i < this.n_nodes; i++) {
      for (const sched of this.node_failure_schedules[i]) {
        if (this.step_count >= sched.start && this.step_count < sched.end) {
          this.node_true_states[i] = sched.state;
          break;
        } else if (this.step_count === sched.end) {
          this.node_true_states[i] = "HEALTHY";
        }
      }
    }

    // 2. Generate observation
    const telemetry = this.getTelemetry();
    const tasksList = Array.from(this.tasks.values()).map((t) => ({
      ...t,
      time_to_deadline: t.deadline - this.step_count,
    }));

    // 3. Run Agent
    const stepDecisions: DecisionLogItem[] = [];
    const actions = this.agent_type === "guardian"
      ? this._runGuardianAgent(telemetry, tasksList, stepDecisions)
      : this._runBaselineAgent(tasksList);

    // 4. Apply Actions
    const currentCounts = Array(this.n_nodes).fill(0);
    for (const t of this.tasks.values()) {
      if (t.node !== null) currentCounts[t.node]++;
    }

    for (const [tid, targetNode] of Object.entries(actions)) {
      const task = this.tasks.get(Number(tid));
      if (!task || targetNode < 0 || targetNode >= this.n_nodes) continue;

      const oldNode = task.node;
      if (oldNode === targetNode) continue;

      if (currentCounts[targetNode] < this.node_capacity) {
        if (oldNode !== null) {
          currentCounts[oldNode]--;
          // Cold restart cost!
          task.remaining_duration = task.total_duration;
          task.reroute_count = (task.reroute_count || 0) + 1;
          this.reroute_count++;
          this.total_reward -= 0.05;
        }
        currentCounts[targetNode]++;
        task.node = targetNode;
      }
    }

    // 5. Progress execution
    const finished: number[] = [];
    for (const [tid, task] of this.tasks.entries()) {
      if (task.node !== null) {
        const state = this.node_true_states[task.node];
        if (state === "HEALTHY") {
          task.remaining_duration -= 1.0;
        } else if (state === "DEGRADED") {
          task.remaining_duration -= (Math.random() < 0.4 ? 1.0 : 0.1);
        }
        // DOWN does 0 progress
      }

      if (task.remaining_duration <= 0.0) {
        this.completed_count++;
        this.total_reward += 1.0;
        finished.push(tid);
      } else if (this.step_count >= task.deadline) {
        this.failed_count++;
        this.total_reward -= 1.0;
        finished.push(tid);
      }
    }

    for (const tid of finished) {
      this.tasks.delete(tid);
    }

    // 6. Generate new tasks
    if (this.step_count < this.episode_length) {
      this._generateTasks();
    }

    this.decision_logs.unshift(...stepDecisions);
    if (this.decision_logs.length > 100) {
      this.decision_logs = this.decision_logs.slice(0, 100);
    }

    const totalResolved = this.completed_count + this.failed_count;
    const completionRate = totalResolved > 0 ? (this.completed_count / totalResolved) * 100 : 100;

    return {
      telemetry,
      metrics: {
        step: this.step_count,
        completed_count: this.completed_count,
        failed_count: this.failed_count,
        reroute_count: this.reroute_count,
        total_tasks: this.total_generated_tasks,
        total_reward: Math.round(this.total_reward * 10) / 10,
        completion_rate: Math.round(completionRate * 10) / 10,
      },
      decisions: stepDecisions,
    };
  }

  private _runBaselineAgent(tasks: TaskItem[]): Record<number, number> {
    const actions: Record<number, number> = {};
    for (const t of tasks) {
      if (t.node === null) {
        actions[t.task_id] = this.baseline_rr_cursor;
        this.baseline_rr_cursor = (this.baseline_rr_cursor + 1) % this.n_nodes;
      }
    }
    return actions;
  }

  private _runGuardianAgent(
    telemetry: NodeTelemetry[],
    tasks: TaskItem[],
    stepDecisions: DecisionLogItem[]
  ): Record<number, number> {
    const alpha = 0.35;

    // Update beliefs
    for (const n of telemetry) {
      const nid = n.node_id;
      this.guardian_ewma_latency[nid] = alpha * n.latency_ms + (1 - alpha) * this.guardian_ewma_latency[nid];
      this.guardian_ewma_error[nid] = alpha * n.error_rate + (1 - alpha) * this.guardian_ewma_error[nid];

      if (!n.heartbeat_ok) {
        this.guardian_missed_hb[nid]++;
      } else {
        this.guardian_missed_hb[nid] = Math.max(0, this.guardian_missed_hb[nid] - 1);
      }

      const isDown =
        (!n.heartbeat_ok && (n.latency_ms > 400 || n.error_rate > 0.5)) ||
        (this.guardian_missed_hb[nid] >= 2 && n.latency_ms > 350) ||
        n.error_rate > 0.7 ||
        n.latency_ms > 750;

      const queueDelay = n.queue_len * 6.0;
      const baseLat = Math.max(10, n.latency_ms - queueDelay);
      const isDegraded =
        baseLat > 140 ||
        this.guardian_ewma_latency[nid] > 160 ||
        n.error_rate > 0.14 ||
        this.guardian_ewma_error[nid] > 0.12 ||
        (!n.heartbeat_ok && n.latency_ms > 100);

      const oldState = this.guardian_states[nid];

      if (isDown) {
        this.guardian_states[nid] = "DOWN";
        this.guardian_confidence[nid] = 0.98;
        this.guardian_healthy_streak[nid] = 0;
        this.guardian_unhealthy_streak[nid]++;
      } else if (isDegraded) {
        this.guardian_healthy_streak[nid] = 0;
        this.guardian_unhealthy_streak[nid]++;
        if (this.guardian_unhealthy_streak[nid] >= 2 || n.latency_ms > 200 || n.error_rate > 0.2) {
          this.guardian_states[nid] = "DEGRADED";
          this.guardian_confidence[nid] = 0.88;
        } else {
          this.guardian_states[nid] = "SUSPICIOUS";
          this.guardian_confidence[nid] = 0.65;
        }
      } else {
        this.guardian_unhealthy_streak[nid] = 0;
        this.guardian_healthy_streak[nid]++;

        if (["DOWN", "DEGRADED", "SUSPICIOUS"].includes(oldState)) {
          if (this.guardian_healthy_streak[nid] >= 2) {
            this.guardian_states[nid] = "RECOVERING";
            this.guardian_confidence[nid] = 0.75;
          } else {
            this.guardian_states[nid] = oldState;
            this.guardian_confidence[nid] = 0.60;
          }
        } else if (oldState === "RECOVERING") {
          if (this.guardian_healthy_streak[nid] >= 4) {
            this.guardian_states[nid] = "HEALTHY";
            this.guardian_confidence[nid] = 0.96;
          } else {
            this.guardian_states[nid] = "RECOVERING";
            this.guardian_confidence[nid] = 0.85;
          }
        } else {
          this.guardian_states[nid] = "HEALTHY";
          this.guardian_confidence[nid] = 0.99;
        }
      }
    }

    const occupiedSlots: Record<number, number> = {};
    for (const n of telemetry) occupiedSlots[n.node_id] = n.queue_len;

    const getFreeSlots = (nid: number) => Math.max(0, this.node_capacity - (occupiedSlots[nid] || 0));

    const pickBestNode = (eligibleStates: NodeState[]): number | null => {
      let bestNid: number | null = null;
      let minLoad = Infinity;

      for (let offset = 0; offset < this.n_nodes; offset++) {
        const nid = (this.guardian_rr_cursor + offset) % this.n_nodes;
        if (eligibleStates.includes(this.guardian_states[nid]) && getFreeSlots(nid) > 0) {
          const load = occupiedSlots[nid] || 0;
          if (load < minLoad) {
            minLoad = load;
            bestNid = nid;
          }
        }
      }
      if (bestNid !== null) {
        this.guardian_rr_cursor = (bestNid + 1) % this.n_nodes;
      }
      return bestNid;
    };

    const actions: Record<number, number> = {};

    // 1. Reroute assessment
    const inFlight = tasks.filter((t) => t.node !== null);
    inFlight.sort((a, b) => (this.guardian_states[a.node!] === "DOWN" ? -1 : 1));

    let healthyHeadroom = 0;
    for (let i = 0; i < this.n_nodes; i++) {
      if (["HEALTHY", "RECOVERING"].includes(this.guardian_states[i])) {
        healthyHeadroom += getFreeSlots(i);
      }
    }

    for (const t of inFlight) {
      const curr = t.node!;
      const state = this.guardian_states[curr];
      if (state === "HEALTHY") continue;

      const timeLeft = t.deadline - this.step_count;
      let shouldReroute = false;
      let reason = "";

      if (state === "DOWN") {
        if (t.total_duration <= timeLeft && healthyHeadroom > 0) {
          shouldReroute = true;
          reason = `Node ${curr} DOWN; cold restart (${t.total_duration}s) <= ${timeLeft}s deadline slack`;
        } else if (timeLeft >= t.total_duration + 1) {
          shouldReroute = true;
          reason = `Node ${curr} DOWN; salvage reroute to active node`;
        }
      } else if (state === "DEGRADED") {
        if (t.remaining_duration <= 1.5) {
          shouldReroute = false;
        } else if (healthyHeadroom >= 2) {
          const estDeg = t.remaining_duration * 2.5;
          if (estDeg > timeLeft && t.total_duration <= timeLeft) {
            shouldReroute = true;
            reason = `Node ${curr} DEGRADED (${estDeg.toFixed(1)}s > ${timeLeft}s); cold restart saves deadline`;
          }
        }
      }

      if (shouldReroute) {
        const dest = pickBestNode(["HEALTHY", "RECOVERING"]);
        if (dest !== null && dest !== curr) {
          actions[t.task_id] = dest;
          occupiedSlots[curr] = Math.max(0, (occupiedSlots[curr] || 0) - 1);
          occupiedSlots[dest] = (occupiedSlots[dest] || 0) + 1;
          healthyHeadroom = Math.max(0, healthyHeadroom - 1);
          stepDecisions.push({
            step: this.step_count,
            action: "REROUTE",
            task_id: t.task_id,
            from_node: curr,
            to_node: dest,
            node_state: state,
            confidence: this.guardian_confidence[curr],
            reason,
          });
        }
      }
    }

    // 2. Pending task assignments
    const pending = tasks.filter((t) => t.node === null);
    pending.sort((a, b) => a.deadline - b.deadline);

    for (const t of pending) {
      const timeLeft = t.deadline - this.step_count;

      let dest = pickBestNode(["HEALTHY"]);
      if (dest === null) dest = pickBestNode(["RECOVERING"]);
      if (dest === null) dest = pickBestNode(["SUSPICIOUS"]);
      if (dest === null && t.total_duration * 2.5 <= timeLeft) {
        dest = pickBestNode(["DEGRADED"]);
      }
      if (dest === null) dest = pickBestNode(["DEGRADED"]);

      if (dest !== null) {
        actions[t.task_id] = dest;
        occupiedSlots[dest] = (occupiedSlots[dest] || 0) + 1;
        stepDecisions.push({
          step: this.step_count,
          action: "ASSIGN",
          task_id: t.task_id,
          to_node: dest,
          target_state: this.guardian_states[dest],
          reason: `Routed to ${this.guardian_states[dest]} node ${dest} (load ${occupiedSlots[dest]}/${this.node_capacity})`,
        });
      }
    }

    return actions;
  }
}
