"""
Configuração centralizada para o sistema IB - EstradaResponde.
Permite trocar facilmente entre diferentes modelos LLM.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Configuração do modelo LLM atual
# Opções: 'openai', 'claude', 'gemini'
# FORÇANDO uso do Claude Sonnet - sempre usar Claude, ignorando o .env
# Se quiser usar outro provedor temporariamente, defina no shell:
# export LLM_PROVIDER=openai && python api.py
LLM_PROVIDER = 'claude'  # SEMPRE usar Claude Sonnet, ignorar .env

# Configurações específicas por provedor
LLM_CONFIG = {
    'openai': {
        'model': os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
        'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.1')),
        'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', '2048')),
        'api_key': os.getenv('OPENAI_API_KEY')
    },
    'claude': {
        'model': os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-5-20250929'),
        'temperature': float(os.getenv('CLAUDE_TEMPERATURE', '0.1')),
        'max_tokens': int(os.getenv('CLAUDE_MAX_TOKENS', '2048')),
        'api_key': os.getenv('ANTHROPIC_API_KEY')
    },
    'gemini': {
        'model': os.getenv('GEMINI_MODEL', 'gemini-pro'),
        'temperature': float(os.getenv('GEMINI_TEMPERATURE', '0.1')),
        'api_key': os.getenv('GOOGLE_API_KEY')
    }
}

# Configuração de embeddings
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-large')
EMBEDDING_PROVIDER = os.getenv('EMBEDDING_PROVIDER', 'openai')

# Configuração do ChromaDB - Banco separado para Código de Estrada
CHROMA_DB_PATH = os.getenv('CHROMA_DB_PATH', './chroma_db_codigo_estrada')
CHROMA_COLLECTION_NAME = os.getenv('CHROMA_COLLECTION_NAME', 'codigo_estrada_documents')

# Configuração de processamento de texto
# Aumentado para melhor preservar artigos completos e capturar últimos parágrafos
CHUNK_SIZE = int(os.getenv('CHUNK_SIZE', '3000'))  # Aumentado para 3000 para capturar artigos completos
# Overlap aumentado MUITO significativamente para garantir que artigos não sejam cortados e capturar melhor os últimos parágrafos, especialmente quando estão em outra página
CHUNK_OVERLAP = int(os.getenv('CHUNK_OVERLAP', '1000'))  # Aumentado para 1000 para garantir captura de conteúdo entre páginas (ex: número 5 do artigo 44)

# Configuração de busca
SEARCH_TYPE = os.getenv('SEARCH_TYPE', 'mmr')  # 'similarity' ou 'mmr'
SEARCH_K = int(os.getenv('SEARCH_K', '15'))  # Aumentado para 15 para buscar mais chunks relacionados
SEARCH_FETCH_K = int(os.getenv('SEARCH_FETCH_K', '25'))  # Aumentado para 25 para ter mais opções na busca
SEARCH_LAMBDA_MULT = float(os.getenv('SEARCH_LAMBDA_MULT', '0.4'))  # Reduzido para 0.4 para mais diversidade e capturar chunks relacionados

# Configuração da API - Porta diferente para não conflitar
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', '5001'))  # Porta 5001 para Código de Estrada
API_DEBUG = os.getenv('API_DEBUG', 'False').lower() == 'true'

# CORS
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',')

