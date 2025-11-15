"""
Factory para criar instâncias de provedores de LLM.
"""

from config import LLM_PROVIDER, LLM_CONFIG
from .openai_provider import OpenAIProvider
from .claude_provider import ClaudeProvider
from .gemini_provider import GeminiProvider


def get_llm_provider():
    """
    Factory function para criar o provedor de LLM configurado.
    
    Returns:
        Instância do provedor de LLM configurado
        
    Raises:
        ValueError: Se o provedor não for suportado
    """
    provider_name = LLM_PROVIDER.lower()
    config = LLM_CONFIG.get(provider_name)
    
    if not config:
        raise ValueError(f"Provedor '{provider_name}' não suportado. Use: 'openai', 'claude' ou 'gemini'")
    
    if provider_name == 'openai':
        return OpenAIProvider(config)
    elif provider_name == 'claude':
        return ClaudeProvider(config)
    elif provider_name == 'gemini':
        return GeminiProvider(config)
    else:
        raise ValueError(f"Provedor '{provider_name}' não implementado")

