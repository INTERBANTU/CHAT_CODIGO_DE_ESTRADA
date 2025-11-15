"""
Provedor de LLM usando Anthropic Claude.
"""

from langchain_anthropic import ChatAnthropic
from .base import BaseLLMProvider


class ClaudeProvider(BaseLLMProvider):
    """Provedor de LLM usando Anthropic Claude."""
    
    def _initialize_llm(self):
        """Inicializa o modelo Claude."""
        api_key = self.config.get('api_key')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY não configurada no .env. Por favor, configure a variável ANTHROPIC_API_KEY no arquivo .env")
        
        # ChatAnthropic do langchain-anthropic lê automaticamente da variável de ambiente ANTHROPIC_API_KEY
        # Garantir que a variável de ambiente está definida
        import os
        os.environ['ANTHROPIC_API_KEY'] = api_key
        
        # ChatAnthropic não aceita api_key como parâmetro, apenas lê da variável de ambiente
        self.llm = ChatAnthropic(
            model=self.config['model'],
            temperature=self.config['temperature'],
            max_tokens=self.config.get('max_tokens', 2048)
        )
    
    def get_llm(self):
        """Retorna a instância do modelo Claude."""
        return self.llm

