import React, { useState } from "react";
import { DecisionLogItem } from "../types";
import { ArrowRight, RefreshCw } from "lucide-react";

interface DecisionLogProps {
  decisions: DecisionLogItem[];
}

export const DecisionLog: React.FC<DecisionLogProps> = ({ decisions }) => {
  const [filter, setFilter] = useState<"ALL" | "REROUTE" | "ASSIGN">("ALL");

  const filtered = decisions.filter((d) => {
    if (filter === "ALL") return true;
    return d.action === filter;
  });

  const latestReroute = decisions.find((d) => d.action === "REROUTE");

  return (
    <div
      id="decision-log-panel"
      className="rounded-2xl border p-4 shadow-sm flex flex-col h-full transition-colors duration-200 bg-black/5 dark:bg-white/5 border-current/15"
    >
      <div className="flex items-center justify-between pb-3 border-b border-current/10 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Decisions &amp; Reroutes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-current/10 opacity-75">
            {decisions.length} logs
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-current/10 text-[10px] font-medium">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2 py-0.5 rounded ${
              filter === "ALL" ? "bg-cyan-600 text-white font-bold" : "opacity-60 hover:opacity-100"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("REROUTE")}
            className={`px-2 py-0.5 rounded ${
              filter === "REROUTE" ? "bg-purple-600 text-white font-bold" : "opacity-60 hover:opacity-100"
            }`}
          >
            Reroutes
          </button>
          <button
            onClick={() => setFilter("ASSIGN")}
            className={`px-2 py-0.5 rounded ${
              filter === "ASSIGN" ? "bg-blue-600 text-white font-bold" : "opacity-60 hover:opacity-100"
            }`}
          >
            Assigns
          </button>
        </div>
      </div>

      {/* Latest Reroute Alert */}
      {latestReroute && (
        <div className="mb-2.5 p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="font-semibold text-purple-600 dark:text-purple-300">
              Rerouted T{latestReroute.task_id}: N{latestReroute.from_node} ➔ N{latestReroute.to_node}
            </span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">Step {latestReroute.step}</span>
        </div>
      )}

      {/* Stream List */}
      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1.5 pr-1 font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="text-center py-8 opacity-40 italic font-sans text-xs">
            No decisions logged yet. Run the simulation to view agent actions.
          </div>
        ) : (
          filtered.slice(0, 30).map((d, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl border text-[11px] transition-all flex items-center justify-between gap-2 ${
                d.action === "REROUTE"
                  ? "bg-purple-500/5 border-purple-500/30 text-purple-600 dark:text-purple-300"
                  : "bg-black/5 dark:bg-white/5 border-current/10"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    d.action === "REROUTE"
                      ? "bg-purple-500 text-white"
                      : "bg-cyan-600 text-white"
                  }`}
                >
                  {d.action}
                </span>
                <span className="font-bold">T{d.task_id}</span>
                {d.action === "REROUTE" ? (
                  <span className="flex items-center gap-1 opacity-90 truncate">
                    <span>N{d.from_node}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                    <span>N{d.to_node}</span>
                    <span className="opacity-60 text-[10px] hidden sm:inline">({d.reason})</span>
                  </span>
                ) : (
                  <span className="opacity-70 text-[10px] truncate">{d.reason}</span>
                )}
              </div>

              <span className="opacity-40 text-[10px] shrink-0">s:{d.step}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
