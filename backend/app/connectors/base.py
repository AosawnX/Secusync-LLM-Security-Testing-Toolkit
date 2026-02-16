from abc import ABC, abstractmethod

class BaseConnector(ABC):
    @abstractmethod
    async def send_prompt(self, prompt: str) -> str:
        """Sends a prompt to the target and returns the response."""
        pass
