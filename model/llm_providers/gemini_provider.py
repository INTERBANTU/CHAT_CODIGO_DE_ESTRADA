"""
Provedor de LLM usando Google Gemini.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from .base import BaseLLMProvider


class GeminiProvider(BaseLLMProvider):
    """Provedor de LLM usando Google Gemini."""
    
    def _initialize_llm(self):
        """Inicializa o modelo Gemini."""
        if not self.config.get('api_key'):
            raise ValueError("GOOGLE_API_KEY não configurada no .env")
        
        self.llm = ChatGoogleGenerativeAI(
            model=self.config['model'],
            temperature=self.config['temperature'],
            google_api_key=self.config['api_key']
        )
    
    def get_llm(self):
        """Retorna a instância do modelo Gemini."""
        return self.llm

