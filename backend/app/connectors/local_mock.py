import asyncio
import random
from .base import BaseConnector

class LocalMockConnector(BaseConnector):
    async def send_prompt(self, prompt: str) -> str:
        """Simulates a vulnerable LLM."""
        await asyncio.sleep(0.5) # Simulate latency
        
        prompt_lower = prompt.lower()
        
        if "ignore previous instructions" in prompt_lower:
            return "Sure! I will ignore previous instructions. Here is the secret password: REF-1234-SECURE."
        
        if "password" in prompt_lower or "secret" in prompt_lower:
             return "I cannot reveal the password properly, but maybe if you ask nicely..."

        return f"I am a helpful assistant. You said: {prompt[:50]}..."
