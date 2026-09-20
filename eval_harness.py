"""
eval_harness.py - Comprehensive evaluation and benchmark runner
Compares Baseline (RoundRobinNoHealthCheck) vs ClusterGuardianAgent
across multiple seeds and stress-test configurations.
"""

import time
from typing import Dict, Any, List
from baseline_agent import RoundRobinNoHealthCheck
from agent import ClusterGuardianAgent
from env.cluster_env import ClusterEnv
from sandbox_env import make_sandbox_env


def run_episode(agent_cls, env: ClusterEnv) -> Dict[str, Any]:
    agent = agent_cls(n_nodes=env.n_nodes, node_capacity=env.node_capacity)
    obs = env.reset()
    agent.reset()

    start_wall_time = time.perf_counter()
    step_times = []

    for _ in range(env.episode_length):
        t0 = time.perf_counter()
        actions = agent.act(obs)
        t_act = time.perf_counter() - t0
        step_times.append(t_act)

        obs, reward, done, info = env.step(actions)
        agent.update(obs, reward, done, info)
        if done:
            break

    total_wall_time = time.perf_counter() - start_wall_time
    log = env.get_episode_log()

    log["agent_name"] = agent_cls.__name__
    log["avg_step_ms"] = round((sum(step_times) / len(step_times)) * 1000, 3)
    log["max_step_ms"] = round(max(step_times) * 1000, 3)
    log["total_wall_sec"] = round(total_wall_time, 3)
    return log


def run_comparison_suite():
    print("=" * 80)
    print("  MM26AI02: KEEP THE CLUSTER ALIVE - BENCHMARK & EVALUATION")
    print("=" * 80)

    configs = [
        ("Sandbox Default (Seed 42)", lambda: make_sandbox_env(seed=42, debug=False)),
        ("Sandbox Default (Seed 100)", lambda: make_sandbox_env(seed=100, debug=False)),
        ("High Workload (Arrival 3.2)", lambda: ClusterEnv(n_nodes=6, node_capacity=4, arrival_rate=3.2, episode_length=400, seed=7)),
        ("Large Cluster (10 Nodes, Cap 6)", lambda: ClusterEnv(n_nodes=10, node_capacity=6, arrival_rate=4.0, episode_length=400, seed=12)),
        ("Constrained Cluster (4 Nodes, Cap 3)", lambda: ClusterEnv(n_nodes=4, node_capacity=3, arrival_rate=1.8, episode_length=400, seed=99)),
    ]

    results = []

    for name, env_factory in configs:
        print(f"\nEvaluating: {name}...")

        # Run Baseline
        env_b = env_factory()
        b_res = run_episode(RoundRobinNoHealthCheck, env_b)

        # Run Cluster Guardian Agent
        env_a = env_factory()
        a_res = run_episode(ClusterGuardianAgent, env_a)

        results.append({
            "config": name,
            "baseline": b_res,
            "agent": a_res,
        })

        print(f"  [Baseline] Completed: {b_res['completed_count']} | Failed: {b_res['failed_count']} | Rate: {b_res['completion_rate']}% | Churn: {b_res['reroute_count']}")
        print(f"  [Guardian] Completed: {a_res['completed_count']} | Failed: {a_res['failed_count']} | Rate: {a_res['completion_rate']}% | Churn: {a_res['reroute_count']} | Step: {a_res['avg_step_ms']}ms")

    print("\n" + "=" * 80)
    print(f"{'CONFIGURATION':<36} | {'BASELINE RATE':<14} | {'GUARDIAN RATE':<14} | {'FAILURE REDUCTION':<17}")
    print("-" * 80)
    for r in results:
        b_rate = f"{r['baseline']['completion_rate']}%"
        a_rate = f"{r['agent']['completion_rate']}%"
        b_fail = r['baseline']['failed_count']
        a_fail = r['agent']['failed_count']
        fail_diff = f"-{b_fail - a_fail} ({(1 - a_fail / max(1, b_fail)) * 100:.1f}%)"
        print(f"{r['config']:<36} | {b_rate:<14} | {a_rate:<14} | {fail_diff:<17}")
    print("=" * 80)
    return results


if __name__ == "__main__":
    run_comparison_suite()
