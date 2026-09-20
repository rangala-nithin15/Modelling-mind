import sys
sys.path.append('.')
from sandbox_env import make_sandbox_env
from agent import ClusterGuardianAgent

env = make_sandbox_env(seed=42, debug=True)
agent = ClusterGuardianAgent(n_nodes=env.n_nodes, node_capacity=env.node_capacity)
obs = env.reset()
agent.reset()

for t in range(env.episode_length):
    for tid, task in list(env.tasks.items()):
        if task["deadline"] == t + 1 and task["remaining_duration"] > 0:
            nid = task["node"]
            ts = env.node_true_states.get(nid, "UNASSIGNED") if nid is not None else "UNASSIGNED"
            as_ = agent.node_states.get(nid, "N/A") if nid is not None else "N/A"
            rem = task["remaining_duration"]
            tot = task["total_duration"]
            print(f"Task {tid} failing at t={t}: node={nid}, rem={rem}/{tot}, true_state={ts}, agent_state={as_}")
    actions = agent.act(obs)
    obs, reward, done, info = env.step(actions)
    agent.update(obs, reward, done, info)
