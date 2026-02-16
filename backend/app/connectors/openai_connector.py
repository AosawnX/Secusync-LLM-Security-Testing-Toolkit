from app.connectors.base import BaseConnector
from openai import AsyncOpenAI
import os

class OpenAIConnector(BaseConnector):
    def __init__(self, api_key: str, base_url: str = None, model: str = "gpt-3.5-turbo"):
        if not api_key:
            raise ValueError("API Key is required for OpenAI Connector")
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url if base_url else "https://api.openai.com/v1"
        )
        self.model = model

    async def send_prompt(self, prompt: str) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=256
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling LLM: {str(e)}"
