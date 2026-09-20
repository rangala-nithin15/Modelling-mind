import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { createServer as createViteServer } from "vite";

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Benchmark results
app.get("/api/benchmark", (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "evaluation", "benchmark_results.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: "Benchmark results not found" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Re-run benchmark suite live
app.post("/api/benchmark/rerun", async (req, res) => {
  try {
    const { stdout, stderr } = await execAsync("python3 eval_harness.py", { cwd: process.cwd(), timeout: 60000 });
    const filePath = path.join(process.cwd(), "evaluation", "benchmark_results.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return res.json({ success: true, results: JSON.parse(data), log: stdout });
    }
    return res.json({ success: true, log: stdout });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, stderr: err.stderr });
  }
});

// Submission files reader
app.get("/api/submission-files", (req, res) => {
  try {
    const files = [
      { name: "agent.py", path: "submission/agent.py", desc: "Production Autonomous Agent" },
      { name: "README.md", path: "submission/README.md", desc: "Official Submission README (Approach & Results)" },
      { name: "agent_interface.py", path: "agent_interface.py", desc: "Official BaseAgent Contract" },
      { name: "baseline_agent.py", path: "baseline_agent.py", desc: "RoundRobin Reference Baseline" },
      { name: "sandbox_env.py", path: "sandbox_env.py", desc: "Practice Sandbox Environment" },
      { name: "cluster_env.py", path: "env/cluster_env.py", desc: "Simulation Engine" },
    ];

    const fileData = files.map((f) => {
      const abs = path.join(process.cwd(), f.path);
      const content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : "";
      return { ...f, content };
    });

    res.json(fileData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run episode test via Python
app.post("/api/simulate-episode", async (req, res) => {
  const { seed = 42, agentType = "guardian", nNodes = 6, capacity = 4, arrivalRate = 2.0, length = 100 } = req.body;
  try {
    const pythonScript = `
import json, sys
sys.path.append('.')
from env.cluster_env import ClusterEnv
from baseline_agent import RoundRobinNoHealthCheck
from agent import ClusterGuardianAgent

env = ClusterEnv(n_nodes=${nNodes}, node_capacity=${capacity}, arrival_rate=${arrivalRate}, episode_length=${length}, seed=${seed}, expose_health=True)
agent_cls = ClusterGuardianAgent if "${agentType}" == "guardian" else RoundRobinNoHealthCheck
agent = agent_cls(n_nodes=env.n_nodes, node_capacity=env.node_capacity)

obs = env.reset()
agent.reset()
steps_data = []

for t in range(env.episode_length):
    actions = agent.act(obs)
    latest_dec = getattr(agent, 'latest_decisions', [])
    node_beliefs = getattr(agent, 'node_states', {})
    node_conf = getattr(agent, 'node_confidence', {})

    obs, reward, done, info = env.step(actions)
    agent.update(obs, reward, done, info)

    # capture snapshot every 5 steps or on failure event or reroute
    if t < 50 or (t % 5 == 0) or info["failed_this_step"] or len(latest_dec) > 0 or done:
        steps_data.append({
            "step": t,
            "nodes": obs["nodes"],
            "tasks": obs["tasks"][:15],
            "total_tasks": len(obs["tasks"]),
            "true_states": info.get("node_true_states", {}),
            "agent_beliefs": dict(node_beliefs) if isinstance(node_beliefs, dict) else {},
            "confidences": dict(node_conf) if isinstance(node_conf, dict) else {},
            "actions": actions,
            "decisions": list(latest_dec),
            "completed": env.completed_count,
            "failed": env.failed_count,
            "reroutes": env.reroute_count,
            "reward": round(env.total_reward, 1)
        })
    if done:
        break

print(json.dumps({
    "metrics": env.get_episode_log(),
    "steps": steps_data
}))
`;
    const tempFile = path.join(process.cwd(), "tests", `run_temp_${Date.now()}.py`);
    fs.writeFileSync(tempFile, pythonScript);

    const { stdout } = await execAsync(`python3 ${tempFile}`, { timeout: 30000 });
    fs.unlinkSync(tempFile);

    const parsed = JSON.parse(stdout.trim());
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
