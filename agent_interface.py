"""
agent_interface.py - Official BaseAgent interface for MM26AI02
"""

from abc import ABC, abstractmethod


class BaseAgent(ABC):
    def __init__(self, n_nodes: int, node_capacity: int):
        self.n_nodes = n_nodes
        self.node_capacity = node_capacity

    @abstractmethod
    def reset(self) -> None:
        """Called once at the start of each episode. Clear any per-episode state."""
        raise NotImplementedError

    @abstractmethod
    def act(self, obs: dict) -> dict:
        """Return {task_id: node_id} for any tasks you want to (re)assign this step."""
        raise NotImplementedError

    @abstractmethod
    def update(self, obs: dict, reward: float, done: bool, info: dict) -> None:
        """Called after each step with the resulting obs/reward. Use for any learning/bookkeeping."""
        raise NotImplementedError
