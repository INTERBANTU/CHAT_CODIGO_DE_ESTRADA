# API do IB - EstradaResponde

## Descrição

API Flask para o sistema IB - EstradaResponde. Permite processar documentos PDF do Código da Estrada, fazer perguntas usando modelos LLM (OpenAI, Claude, Gemini) e gerenciar documentos usando ChromaDB como banco de dados vetorial.

## Características

- ✅ **Arquitetura Modular**: Troque facilmente entre diferentes modelos LLM (OpenAI, Claude, Gemini)
- ✅ **ChromaDB**: Banco de dados vetorial persistente (substitui FAISS)
- ✅ **API RESTful**: Endpoints para upload, chat e gerenciamento de documentos
- ✅ **Configuração Flexível**: Tudo configurável via variáveis de ambiente

## Instalação

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas chaves de API
```

3. Execute a API:
```bash
python api.py
```

A API estará disponível em `http://localhost:5000`

## Configuração

### Trocar Modelo LLM

Para trocar o modelo LLM, edite o arquivo `.env`:

```env
# Para usar OpenAI (padrão)
LLM_PROVIDER=openai
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4o-mini

# Para usar Claude
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sua_chave_aqui
CLAUDE_MODEL=claude-sonnet-4-5-20250929

# Para usar Gemini
LLM_PROVIDER=gemini
GOOGLE_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-pro
```

### Configurações Disponíveis

- `LLM_PROVIDER`: Provedor LLM ('openai', 'claude', 'gemini')
- `CHUNK_SIZE`: Tamanho dos chunks de texto (padrão: 1000)
- `CHUNK_OVERLAP`: Sobreposição entre chunks (padrão: 200)
- `SEARCH_TYPE`: Tipo de busca ('similarity' ou 'mmr')
- `SEARCH_K`: Número de documentos a recuperar (padrão: 8)

## Endpoints da API

### Health Check
```
GET /api/health
```

### Upload de Documentos
```
POST /api/upload
Content-Type: multipart/form-data

Body: files (arquivos PDF)
```

### Chat
```
POST /api/chat
Content-Type: application/json

Body: {
  "question": "Sua pergunta aqui"
}
```

### Informações dos Documentos
```
GET /api/documents
```

### Limpar Documentos
```
DELETE /api/documents
```

### Informações do Modelo
```
GET /api/model
```

## Estrutura do Projeto

```
model/
├── api.py                 # API Flask principal
├── config.py             # Configurações centralizadas
├── document_processor.py # Processamento de PDFs e ChromaDB
├── llm_providers/        # Provedores de LLM modulares
│   ├── base.py           # Classe base abstrata
│   ├── openai_provider.py
│   ├── claude_provider.py
│   └── gemini_provider.py
└── requirements.txt      # Dependências Python
```

## Adicionar Novo Provedor LLM

1. Crie um novo arquivo em `llm_providers/` (ex: `new_provider.py`)
2. Herde de `BaseLLMProvider`:
```python
from .base import BaseLLMProvider

class NewProvider(BaseLLMProvider):
    def _initialize_llm(self):
        # Implemente a inicialização do modelo
        pass
    
    def get_llm(self):
        return self.llm
```

3. Adicione ao factory em `llm_providers/__init__.py`
4. Adicione configurações em `config.py`

## Notas

- Os documentos são armazenados em `./chroma_db` (configurável via `CHROMA_DB_PATH`)
- Arquivos enviados são salvos em `./uploads`
- A API suporta CORS configurável via `CORS_ORIGINS`

