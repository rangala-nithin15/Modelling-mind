import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserClusterSimulator } from "./simulation/clusterSimulator";
import { Header } from "./components/Header";
import { SimulationControls } from "./components/SimulationControls";
import { ClusterPanel } from "./components/ClusterPanel";
import { DecisionLog } from "./components/DecisionLog";
import { TaskStreamView } from "./components/TaskStreamView";
import { BenchmarkView } from "./components/BenchmarkView";
import { SubmissionModal } from "./components/SubmissionModal";
import { NodeTelemetry, NodeState, TaskItem, DecisionLogItem, SimulationMetrics, AppTheme } from "./types";
import { THEMES } from "./theme";

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem("app_theme") as AppTheme;
    return saved && THEMES[saved] ? saved : "light";
  });

  const [agentType, setAgentType] = useState<"guardian" | "baseline">("guardian");
  const [selectedScenario, setSelectedScenario] = useState<string>("default");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(2);
  const [showBenchmarks, setShowBenchmarks] = useState<boolean>(false);
  const [showSubmission, setShowSubmission] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"split" | "decisions" | "tasks">("split");

  const episodeLength = 400;
  const nNodes = 6;
  const nodeCapacity = 4;

  // Simulator instance in ref
  const simRef = useRef<BrowserClusterSimulator>(
    new BrowserClusterSimulator(nNodes, nodeCapacity, 2.0, episodeLength, "guardian")
  );

  // Reactive state for UI updates
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    step: 0,
    completed_count: 0,
    failed_count: 0,
    reroute_count: 0,
    total_tasks: 0,
    total_reward: 0,
    completion_rate: 100,
  });
  const [telemetry, setTelemetry] = useState<NodeTelemetry[]>([]);
  const [agentStates, setAgentStates] = useState<NodeState[]>([]);
  const [agentConfidences, setAgentConfidences] = useState<number[]>([]);
  const [trueStates, setTrueStates] = useState<NodeState[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionLogItem[]>([]);

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
    root.setAttribute("data-theme", theme);
  }, [theme]);

  // Synchronize state from simulator
  const syncStateFromSim = useCallback(() => {
    const sim = simRef.current;
    const telem = sim.getTelemetry();
    setTelemetry(telem);
    setAgentStates([...sim.guardian_states]);
    setAgentConfidences([...sim.guardian_confidence]);
    setTrueStates([...sim.node_true_states]);
    setTasks(Array.from(sim.tasks.values()));
    setDecisions([...sim.decision_logs]);

    const totalResolved = sim.completed_count + sim.failed_count;
    const rate = totalResolved > 0 ? (sim.completed_count / totalResolved) * 100 : 100;

    setMetrics({
      step: sim.step_count,
      completed_count: sim.completed_count,
      failed_count: sim.failed_count,
      reroute_count: sim.reroute_count,
      total_tasks: sim.total_generated_tasks,
      total_reward: Math.round(sim.total_reward * 10) / 10,
      completion_rate: Math.round(rate * 10) / 10,
    });
  }, []);

  // Single step execution
  const handleStep = useCallback(() => {
    const sim = simRef.current;
    if (sim.step_count >= sim.episode_length) {
      setIsPlaying(false);
      return;
    }
    sim.step();
    syncStateFromSim();
  }, [syncStateFromSim]);

  // Reset simulator
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    const arrivalRate = selectedScenario === "highload" ? 3.5 : 2.0;
    const sim = new BrowserClusterSimulator(
      nNodes,
      nodeCapacity,
      arrivalRate,
      episodeLength,
      agentType
    );

    // Apply scenario setup
    if (selectedScenario === "degraded") {
      sim.node_failure_schedules = Array(nNodes).fill(null).map(() => []);
      sim.node_failure_schedules[2] = [{ start: 10, end: 150, state: "DEGRADED" }];
    } else if (selectedScenario === "crash") {
      sim.node_failure_schedules = Array(nNodes).fill(null).map(() => []);
      sim.node_failure_schedules[3] = [{ start: 15, end: 180, state: "DOWN" }];
    } else if (selectedScenario === "recovery") {
      sim.node_failure_schedules = Array(nNodes).fill(null).map(() => []);
      sim.node_failure_schedules[1] = [{ start: 10, end: 60, state: "DEGRADED" }];
      sim.node_failure_schedules[4] = [{ start: 40, end: 90, state: "DOWN" }];
    }

    simRef.current = sim;
    syncStateFromSim();
  }, [agentType, selectedScenario, syncStateFromSim]);

  // Handle agent type switch
  const handleToggleAgent = () => {
    const nextType = agentType === "guardian" ? "baseline" : "guardian";
    setAgentType(nextType);
    simRef.current.agent_type = nextType;
    handleReset();
  };

  // Handle scenario switch
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
  };

  // Re-init on scenario change
  useEffect(() => {
    handleReset();
  }, [selectedScenario, handleReset]);

  // Manual fault injection
  const handleInjectState = (nodeId: number, state: NodeState) => {
    simRef.current.injectNodeState(nodeId, state);
    syncStateFromSim();
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(25, Math.floor(600 / speed));
    const timer = setInterval(() => {
      handleStep();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, handleStep]);

  // Initial load
  useEffect(() => {
    syncStateFromSim();
  }, [syncStateFromSim]);

  const activeThemeObj = THEMES[theme] || THEMES.light;

  return (
    <div
      className={`min-h-screen ${activeThemeObj.pageBg} flex flex-col font-sans transition-colors duration-200`}
    >
      {/* Clean Modern Header with Logo and Theme Changer */}
      <Header
        agentType={agentType}
        onToggleAgent={handleToggleAgent}
        onOpenSubmission={() => setShowSubmission(true)}
        onOpenBenchmarks={() => setShowBenchmarks(true)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Sleek 1-line Agent Info Bar (Clean, no text dump) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="opacity-60 font-medium">Mode:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                agentType === "guardian"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {agentType === "guardian" ? "Autonomous Guardian Agent" : "Baseline Round-Robin"}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] opacity-70">
            <span>
              Detection:{" "}
              <strong className="text-cyan-500 font-bold">
                {agentType === "guardian" ? "1.0 step" : "Disabled"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Per-Step Latency:{" "}
              <strong className="text-emerald-500 font-bold">0.034ms</strong>
            </span>
          </div>
        </div>

        {/* Simulation Controls & Scorecard */}
        <SimulationControls
          metrics={metrics}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onStep={handleStep}
          onReset={handleReset}
          speed={speed}
          onChangeSpeed={setSpeed}
          selectedScenario={selectedScenario}
          onSelectScenario={handleSelectScenario}
          episodeLength={episodeLength}
        />

        {/* Cluster Topology Panel */}
        <ClusterPanel
          telemetry={telemetry}
          agentStates={agentStates}
          agentConfidences={agentConfidences}
          trueStates={trueStates}
          tasks={tasks}
          nodeCapacity={nodeCapacity}
          onInjectState={handleInjectState}
        />

        {/* Bottom Activity Section: Tabbed or Split (Clean and organized) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-current/10 pb-2">
            <div className="flex items-center gap-1 p-0.5 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 text-xs font-semibold">
              <button
                id="tab-btn-split"
                onClick={() => setActiveTab("split")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "split"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Split View
              </button>
              <button
                id="tab-btn-decisions"
                onClick={() => setActiveTab("decisions")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "decisions"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Decisions ({decisions.length})
              </button>
              <button
                id="tab-btn-tasks"
                onClick={() => setActiveTab("tasks")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "tasks"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Task Queue ({tasks.length})
              </button>
            </div>

            <span className="text-[11px] opacity-50 font-mono hidden sm:inline">
              Real-time dispatch telemetry
            </span>
          </div>

          {activeTab === "decisions" && <DecisionLog decisions={decisions} />}
          {activeTab === "tasks" && (
            <TaskStreamView
              tasks={tasks}
              agentStates={agentStates}
              currentStep={metrics.step}
            />
          )}
          {activeTab === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DecisionLog decisions={decisions} />
              <TaskStreamView
                tasks={tasks}
                agentStates={agentStates}
                currentStep={metrics.step}
              />
            </div>
          )}
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-current/10 py-3.5 px-6 text-center text-xs opacity-60 mt-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Modelling Minds 2.0</strong> · Problem ID:{" "}
            <span className="font-mono text-cyan-500 font-semibold">MM26AI02</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setShowBenchmarks(true)}
              className="hover:underline transition"
            >
              Benchmarks
            </button>
            <span>•</span>
            <button
              onClick={() => setShowSubmission(true)}
              className="hover:underline transition"
            >
              Submission Package
            </button>
          </div>
        </div>
      </footer>

      {/* Benchmark Suite Modal */}
      {showBenchmarks && <BenchmarkView onClose={() => setShowBenchmarks(false)} />}

      {/* Submission Files Modal */}
      {showSubmission && <SubmissionModal onClose={() => setShowSubmission(false)} />}
    </div>
  );
}
