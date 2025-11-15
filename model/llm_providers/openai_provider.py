"""
Provedor de LLM usando OpenAI.
"""

from langchain_openai import ChatOpenAI
from .base import BaseLLMProvider


class OpenAIProvider(BaseLLMProvider):
    """Provedor de LLM usando OpenAI."""
    
    def _initialize_llm(self):
        """Inicializa o modelo OpenAI."""
        if not self.config.get('api_key'):
            raise ValueError("OPENAI_API_KEY não configurada no .env")
        
        self.llm = ChatOpenAI(
            model=self.config['model'],
            temperature=self.config['temperature'],
            max_tokens=self.config.get('max_tokens', 2048),
            openai_api_key=self.config['api_key']
        )
    
    def get_llm(self):
        """Retorna a instância do modelo OpenAI."""
        return self.llm

