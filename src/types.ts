export type NodeState = "HEALTHY" | "SUSPICIOUS" | "DEGRADED" | "DOWN" | "RECOVERING";

export type AppTheme = "light" | "dark" | "cyber" | "nordic";

export interface NodeTelemetry {
  node_id: number;
  heartbeat_ok: boolean;
  latency_ms: number;
  error_rate: number;
  queue_len: number;
  capacity: number;
}

export interface TaskItem {
  task_id: number;
  node: number | null;
  remaining_duration: number;
  total_duration: number;
  deadline: number;
  time_to_deadline?: number;
  created_step?: number;
  reroute_count?: number;
}

export interface DecisionLogItem {
  step: number;
  action: "ASSIGN" | "REROUTE" | "KEEP";
  task_id: number;
  from_node?: number;
  to_node?: number;
  node_state?: NodeState;
  target_state?: NodeState;
  confidence?: number;
  reason: string;
}

export interface SimulationMetrics {
  step: number;
  completed_count: number;
  failed_count: number;
  reroute_count: number;
  total_tasks: number;
  total_reward: number;
  completion_rate: number;
  detection_latencies?: number[];
  avg_step_ms?: number;
}

export interface BenchmarkResult {
  config: string;
  baseline: {
    agent_name: string;
    completed_count: number;
    failed_count: number;
    reroute_count: number;
    total_tasks: number;
    total_reward: number;
    completion_rate: number;
    avg_step_ms: number;
    total_wall_sec: number;
  };
  agent: {
    agent_name: string;
    completed_count: number;
    failed_count: number;
    reroute_count: number;
    total_tasks: number;
    total_reward: number;
    completion_rate: number;
    avg_step_ms: number;
    total_wall_sec: number;
  };
}
