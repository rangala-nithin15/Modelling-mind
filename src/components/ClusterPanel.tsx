import React from "react";
import { NodeTelemetry, NodeState, TaskItem } from "../types";
import { Wifi, WifiOff } from "lucide-react";

interface ClusterPanelProps {
  telemetry: NodeTelemetry[];
  agentStates: NodeState[];
  agentConfidences: number[];
  trueStates: NodeState[];
  tasks: TaskItem[];
  nodeCapacity: number;
  onInjectState: (nodeId: number, state: NodeState) => void;
}

export const ClusterPanel: React.FC<ClusterPanelProps> = ({
  telemetry,
  agentStates,
  agentConfidences,
  trueStates,
  tasks,
  nodeCapacity,
  onInjectState,
}) => {
  const getStateBadge = (state: NodeState) => {
    switch (state) {
      case "HEALTHY":
        return {
          label: "HEALTHY",
          badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          dotClass: "bg-emerald-500",
        };
      case "SUSPICIOUS":
        return {
          label: "SUSPICIOUS",
          badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          dotClass: "bg-amber-500 animate-pulse",
        };
      case "DEGRADED":
        return {
          label: "DEGRADED",
          badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
          dotClass: "bg-orange-500 animate-pulse",
        };
      case "DOWN":
        return {
          label: "DOWN",
          badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
          dotClass: "bg-rose-500",
        };
      case "RECOVERING":
        return {
          label: "RECOVERING",
          badgeClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
          dotClass: "bg-cyan-500 animate-ping",
        };
      default:
        return {
          label: "UNKNOWN",
          badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
          dotClass: "bg-slate-400",
        };
    }
  };

  return (
    <div
      id="cluster-panel"
      className="rounded-2xl border p-4 shadow-sm transition-colors duration-200 bg-black/5 dark:bg-white/5 border-current/15"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-current/10 mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Cluster Nodes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono border border-current/10 bg-black/5 dark:bg-white/5 opacity-75">
            {telemetry.length} Workers · Max {nodeCapacity}/node
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs opacity-75 hidden sm:flex">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Degraded
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Down
          </span>
        </div>
      </div>

      {/* Grid of Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {telemetry.map((n) => {
          const nid = n.node_id;
          const agentState = agentStates[nid] || "HEALTHY";
          const trueState = trueStates[nid] || "HEALTHY";
          const conf = agentConfidences[nid] ?? 1.0;
          const badge = getStateBadge(agentState);

          const assignedTasks = tasks.filter((t) => t.node === nid);
          const queueRatio = n.queue_len / nodeCapacity;

          return (
            <div
              key={nid}
              id={`node-card-${nid}`}
              className={`rounded-xl border p-3 transition-all relative ${
                agentState === "DOWN"
                  ? "bg-rose-500/5 border-rose-500/30"
                  : agentState === "DEGRADED"
                  ? "bg-orange-500/5 border-orange-500/30"
                  : "bg-black/5 dark:bg-white/5 border-current/10 hover:border-current/25"
              }`}
            >
              {/* Card Header: Node ID, Status Pill, Fault Controls */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10">
                    Node {nid}
                  </span>
                  {/* Subtle true state indicator if discrepancy */}
                  {agentState !== trueState && (
                    <span className="text-[10px] text-amber-500 font-mono" title={`Actual: ${trueState}`}>
                      (Actual: {trueState})
                    </span>
                  )}
                </div>

                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${badge.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                  <span>{badge.label}</span>
                  <span className="opacity-70 font-mono text-[9px]">{Math.round(conf * 100)}%</span>
                </div>
              </div>

              {/* Live Telemetry Grid (3 columns, very clean) */}
              <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-current/10 mb-2 text-center font-mono">
                <div className="p-1 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] opacity-60">Latency</div>
                  <div
                    className={`text-xs font-bold ${
                      n.latency_ms < 70
                        ? "text-emerald-500"
                        : n.latency_ms < 180
                        ? "text-amber-500"
                        : "text-rose-500"
                    }`}
                  >
                    {Math.round(n.latency_ms)}ms
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] opacity-60">Error</div>
                  <div
                    className={`text-xs font-bold ${
                      n.error_rate < 0.05
                        ? "text-emerald-500"
                        : n.error_rate < 0.2
                        ? "text-amber-500"
                        : "text-rose-500"
                    }`}
                  >
                    {(n.error_rate * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="p-1 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="text-[10px] opacity-60">Queue</div>
                  <div className="text-xs font-bold">
                    {n.queue_len}/{nodeCapacity}
                  </div>
                </div>
              </div>

              {/* Queue Load Bar */}
              <div className="w-full bg-current/10 h-1.5 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    queueRatio >= 1
                      ? "bg-rose-500"
                      : queueRatio >= 0.75
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.min(100, queueRatio * 100)}%` }}
                />
              </div>

              {/* Tasks Assigned */}
              <div className="min-h-[28px] mb-2.5 flex items-center">
                {assignedTasks.length === 0 ? (
                  <span className="text-[11px] opacity-40 italic">Node is idle</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {assignedTasks.map((t) => (
                      <span
                        key={t.task_id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-current/15 bg-black/5 dark:bg-white/5 flex items-center gap-1"
                      >
                        <span className="font-bold text-cyan-500">T{t.task_id}</span>
                        <span className="opacity-60">{t.remaining_duration.toFixed(0)}s</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Fault Injection Micro-Buttons */}
              <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                <span className="text-[10px] opacity-50 uppercase font-medium">Fault Test</span>
                <div className="flex items-center gap-1 font-sans">
                  <button
                    id={`btn-degrade-n${nid}`}
                    onClick={() => onInjectState(nid, "DEGRADED")}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition"
                  >
                    Degrade
                  </button>
                  <button
                    id={`btn-kill-n${nid}`}
                    onClick={() => onInjectState(nid, "DOWN")}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    Kill
                  </button>
                  <button
                    id={`btn-recover-n${nid}`}
                    onClick={() => onInjectState(nid, "HEALTHY")}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
