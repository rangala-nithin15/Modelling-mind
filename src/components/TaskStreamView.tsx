import React from "react";
import { TaskItem, NodeState } from "../types";
import { Clock } from "lucide-react";

interface TaskStreamViewProps {
  tasks: TaskItem[];
  agentStates: NodeState[];
  currentStep: number;
}

export const TaskStreamView: React.FC<TaskStreamViewProps> = ({
  tasks,
  agentStates,
  currentStep,
}) => {
  const pendingTasks = tasks.filter((t) => t.node === null);
  const inFlightTasks = tasks.filter((t) => t.node !== null);

  return (
    <div
      id="task-stream-view"
      className="rounded-2xl border p-4 shadow-sm flex flex-col h-full transition-colors duration-200 bg-black/5 dark:bg-white/5 border-current/15"
    >
      <div className="flex items-center justify-between pb-3 border-b border-current/10 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Task Queue
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-current/10 opacity-75">
            {tasks.length} total
          </span>
        </div>
        <div className="text-xs font-mono opacity-75">
          <span className="text-cyan-500 font-bold">{pendingTasks.length}</span> Queued ·{" "}
          <span className="text-emerald-500 font-bold">{inFlightTasks.length}</span> In-Flight
        </div>
      </div>

      {/* Task Stream List */}
      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1.5 pr-1 font-mono text-xs">
        {tasks.length === 0 ? (
          <div className="text-center py-8 opacity-40 italic font-sans text-xs">
            Task queue is empty.
          </div>
        ) : (
          tasks.slice(0, 25).map((t) => {
            const timeLeft = t.deadline - currentStep;
            const isAssigned = t.node !== null;
            const isAtRisk = timeLeft <= t.remaining_duration + 1;
            const isRerouted = (t.reroute_count || 0) > 0;

            return (
              <div
                key={t.task_id}
                className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[11px] transition ${
                  isAtRisk
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300"
                    : isRerouted
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300"
                    : "bg-black/5 dark:bg-white/5 border-current/10"
                }`}
              >
                {/* Left: Task ID & Node */}
                <div className="flex items-center gap-2">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-cyan-500">
                    T{t.task_id}
                  </span>
                  {isAssigned ? (
                    <span className="opacity-80">
                      ➔ Node {t.node}
                    </span>
                  ) : (
                    <span className="text-amber-500 text-[10px] font-semibold">
                      Waiting
                    </span>
                  )}
                </div>

                {/* Right: Duration & Slack */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="opacity-70">
                    {t.remaining_duration.toFixed(0)}s left
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                      timeLeft <= 2
                        ? "bg-rose-500 text-white"
                        : "bg-black/10 dark:bg-white/10 opacity-80"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {timeLeft}s
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
