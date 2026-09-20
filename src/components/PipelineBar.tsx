import React from "react";
import { Activity, Search, BrainCircuit, ArrowLeftRight, RefreshCw } from "lucide-react";

export const PipelineBar: React.FC = () => {
  const steps = [
    {
      title: "OBSERVE",
      icon: Activity,
      desc: "Heartbeat · Net Latency · Error · Queue",
      color: "text-blue-400 border-blue-500/40 bg-blue-950/30",
    },
    {
      title: "DETECT",
      icon: Search,
      desc: "EWMA Drift · Hysteresis · Anomaly Fusion",
      color: "text-amber-400 border-amber-500/40 bg-amber-950/30",
    },
    {
      title: "DECIDE",
      icon: BrainCircuit,
      desc: "Cold Restart vs Slack · Feasibility Check",
      color: "text-purple-400 border-purple-500/40 bg-purple-950/30",
    },
    {
      title: "REROUTE",
      icon: ArrowLeftRight,
      desc: "Cluster Headroom · Slot Guard · Zero Rejection",
      color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
    },
    {
      title: "RECOVER",
      icon: RefreshCw,
      desc: "Anti-Flap Hysteresis · Canary Ramp",
      color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
    },
  ];

  return (
    <div id="pipeline-bar" className="w-full bg-slate-900/70 border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto text-xs py-1">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.title}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-shrink-0 ${step.color}`}
              >
                <Icon className="w-4 h-4" />
                <div>
                  <div className="font-bold tracking-wide">{step.title}</div>
                  <div className="text-[10px] text-slate-400 hidden md:block">{step.desc}</div>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="text-slate-600 font-bold hidden sm:block">➔</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
