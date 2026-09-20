import React from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { SimulationMetrics } from "../types";

interface SimulationControlsProps {
  metrics: SimulationMetrics;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
  selectedScenario: string;
  onSelectScenario: (s: string) => void;
  episodeLength: number;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  metrics,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  selectedScenario,
  onSelectScenario,
  episodeLength,
}) => {
  const scenarios = [
    { id: "default", label: "Default Cluster (Dynamic Failures)" },
    { id: "degraded", label: "Silent Degradation (High Latency)" },
    { id: "crash", label: "Catastrophic Node Crash" },
    { id: "recovery", label: "Node Flapping & Recovery" },
    { id: "highload", label: "High Arrival Load" },
  ];

  const progress = Math.min(100, (metrics.step / episodeLength) * 100);

  return (
    <div
      id="simulation-controls-bar"
      className="rounded-2xl border p-4 shadow-sm mb-4 transition-colors duration-200 bg-black/5 dark:bg-white/5 border-current/15"
    >
      {/* Top row: Clean, High-Contrast Metrics (No text dumping) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3.5 font-sans">
        {/* Step Progress */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Step</div>
          <div className="text-lg font-extrabold tracking-tight font-mono">
            {metrics.step} <span className="text-xs opacity-50 font-normal">/ {episodeLength}</span>
          </div>
          <div className="w-full bg-current/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Success Rate</div>
          <div className="text-lg font-extrabold tracking-tight font-mono text-cyan-500">
            {metrics.completion_rate.toFixed(1)}%
          </div>
          <div className="text-[10px] opacity-60 mt-0.5">SLA Target &gt;90%</div>
        </div>

        {/* Completed */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Completed</div>
          <div className="text-lg font-extrabold tracking-tight font-mono text-emerald-500">
            {metrics.completed_count}
          </div>
          <div className="text-[10px] opacity-60 mt-0.5">On-time tasks</div>
        </div>

        {/* Failed */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Failed</div>
          <div className="text-lg font-extrabold tracking-tight font-mono text-rose-500">
            {metrics.failed_count}
          </div>
          <div className="text-[10px] opacity-60 mt-0.5">Missed deadlines</div>
        </div>

        {/* Reroutes */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Reroutes</div>
          <div className="text-lg font-extrabold tracking-tight font-mono text-purple-500">
            {metrics.reroute_count}
          </div>
          <div className="text-[10px] opacity-60 mt-0.5">Migrations</div>
        </div>

        {/* Reward */}
        <div className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 border-current/10">
          <div className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Cluster Reward</div>
          <div
            className={`text-lg font-extrabold tracking-tight font-mono ${
              metrics.total_reward >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {metrics.total_reward > 0
              ? `+${metrics.total_reward.toFixed(1)}`
              : metrics.total_reward.toFixed(1)}
          </div>
          <div className="text-[10px] opacity-60 mt-0.5">Performance Score</div>
        </div>
      </div>

      {/* Bottom row: Clean Controls and Scenario Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-current/10">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-play-pause"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-cyan-600 hover:bg-cyan-500 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? "Pause" : "Play Simulation"}</span>
          </button>

          <button
            id="btn-step"
            onClick={onStep}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-current/15 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>

          <button
            id="btn-reset"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-current/15 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 ml-1">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                  speed === s
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Preset Scenario Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60 font-medium">Scenario:</span>
          <select
            id="select-scenario"
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent border border-current/20 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
