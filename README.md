# ChatBot Código de Estrada

Sistema de chatbot inteligente desenvolvido para responder perguntas sobre o **Código da Estrada de Moçambique** e legislação de trânsito rodoviário. Utiliza tecnologias de inteligência artificial (IA) para processar documentos legais e fornecer respostas precisas baseadas na legislação oficial, sempre citando as fontes (artigos, números e alíneas) e incluindo valores de multas quando disponíveis.

## 📋 Sobre o Projeto

Este projeto foi desenvolvido pela **InterBantu** para facilitar o acesso e compreensão do Código da Estrada e legislação de trânsito para cidadãos, condutores e profissionais do setor. O sistema utiliza processamento de linguagem natural (NLP) e busca semântica para encontrar informações relevantes em documentos PDF oficiais e fornecer respostas claras e precisas.

## 🚀 Características

- ✅ **Frontend React**: Interface moderna e responsiva
- ✅ **Backend Python**: API Flask com suporte a múltiplos modelos LLM
- ✅ **ChromaDB**: Banco de dados vetorial persistente (substitui FAISS)
- ✅ **Modelos LLM Modulares**: Troque facilmente entre OpenAI, Claude e Gemini
- ✅ **Sistema de Usuários**: Usuários, Gestores e Administradores
- ✅ **Upload de Documentos**: Processamento automático de PDFs (decretos e legislação)

## 📋 Pré-requisitos

- Python 3.8+
- Node.js 18+
- Chave de API de um dos provedores LLM (OpenAI, Anthropic ou Google)

## 🔧 Instalação

### Backend (Python)

1. Navegue até a pasta `model`:
```bash
cd model
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o .env com suas chaves de API
```

4. Execute a API:
```bash
python api.py
```

A API estará disponível em `http://localhost:5001`

### Frontend (React)

1. Navegue até a pasta `client`:
```bash
cd client
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL da API (opcional):
```bash
# Crie um arquivo .env.local com:
# VITE_API_URL=http://localhost:5000/api
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5174`

## ⚙️ Configuração do Modelo LLM

Para trocar o modelo LLM, edite o arquivo `model/.env`:

### OpenAI (Padrão)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4o-mini
```

### Anthropic Claude
```env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sua_chave_aqui
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

### Google Gemini
```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-pro
```

## 🚀 Como Rodar

### Método Rápido (Scripts)

O projeto inclui scripts de inicialização para facilitar o processo:

#### 1. Iniciar Backend

```bash
./iniciar_backend.sh
```

Este script:
- Ativa o ambiente virtual Python
- Verifica se o arquivo `.env` existe (cria a partir de `env.example` se necessário)
- Inicia o servidor Flask na porta **5001**

#### 2. Iniciar Frontend

Em um terminal separado:

```bash
./iniciar_frontend.sh
```

Este script:
- Verifica e instala dependências do Node.js se necessário
- Inicia o servidor de desenvolvimento na porta **5174**

### Método Manual

#### Backend

```bash
cd model
source venv/bin/activate  # ou use o venv do projeto original
python api.py
```

#### Frontend

```bash
cd client
npm install  # apenas na primeira vez
npm run dev
```

### Verificar se está rodando

- **Backend**: Acesse `http://localhost:5001/api/health` no navegador
- **Frontend**: Acesse `http://localhost:5174` no navegador

## 🔄 Como Reiniciar

### Reiniciar Backend

1. **Parar o processo atual:**
   ```bash
   # Encontrar o processo
   lsof -ti:5001
   # ou
   ps aux | grep "python api.py"
   
   # Matar o processo (substitua PID pelo número do processo)
   kill -9 PID
   ```

2. **Reiniciar:**
   ```bash
   ./iniciar_backend.sh
   ```

### Reiniciar Frontend

1. **Parar o processo atual:**
   - Pressione `Ctrl+C` no terminal onde o frontend está rodando
   - Ou encontre e mate o processo:
     ```bash
     lsof -ti:5174 | xargs kill -9
     ```

2. **Reiniciar:**
   ```bash
   ./iniciar_frontend.sh
   ```

### Reiniciar Tudo

```bash
# Parar todos os processos
pkill -f "python api.py"
pkill -f "vite"

# Reiniciar backend
./iniciar_backend.sh &

# Reiniciar frontend (em terminal separado)
./iniciar_frontend.sh
```

## 📖 Como Usar

### 1. Acessar o Sistema

Abra o navegador e acesse: `http://localhost:5174`

### 2. Fazer Login

Use uma das credenciais de demonstração:

- **Usuário**: `usuario@codigoestrada.mz` / `usuario2024`
  - Acesso ao Assistente Virtual para fazer perguntas

- **Gestor**: `gestor@codigoestrada.mz` / `gestor2024`
  - Acesso ao Painel do Gestor para gerenciar documentos
  - Acesso ao Assistente Virtual

- **Admin**: `admin@codigoestrada.mz` / `admin2024`
  - Acesso completo ao Painel do Administrador
  - Visualização de estatísticas e gerenciamento de usuários

### 3. Upload de Documentos (Gestor/Admin)

1. Faça login como **Gestor** ou **Admin**
2. Acesse o **Painel do Gestor** ou **Painel do Administrador**
3. Na seção "Documentos", clique em "Fazer Upload"
4. Selecione arquivos PDF com decretos e legislação de trânsito
   - Exemplo: Decreto-Lei n.º 1/2011 - Código da Estrada
5. Aguarde o processamento (pode levar alguns minutos dependendo do tamanho)
6. O sistema processará automaticamente e dividirá em segmentos para busca

### 4. Fazer Perguntas (Usuário/Gestor/Admin)

1. Acesse o **Assistente Virtual**
2. Digite sua pergunta sobre o código de estrada ou legislação de trânsito
   - Exemplos:
     - "Quais são os limites de velocidade dentro e fora das localidades?"
     - "Quais são as multas por condução sob influência de álcool?"
     - "Em que locais é proibida a ultrapassagem?"
3. Clique em "Enviar" ou pressione Enter
4. Aguarde a resposta baseada nos documentos processados
5. Use as perguntas sugeridas para começar rapidamente

### 5. Gerenciar Documentos (Gestor/Admin)

- **Visualizar documentos**: Veja todos os documentos processados
- **Estatísticas**: Acompanhe o número de documentos e segmentos
- **Remover documentos**: Delete documentos se necessário (limpa o banco de dados)

### 6. Visualizar Estatísticas (Admin)

No Painel do Administrador, você pode ver:
- Total de documentos processados
- Total de segmentos de texto
- Informações sobre o modelo LLM em uso

## 🏗️ Estrutura do Projeto

```
ChatBot Regulamento/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   └── contexts/       # Contextos React
│   └── package.json
│
└── model/                  # Backend Python
    ├── api.py              # API Flask principal
    ├── config.py           # Configurações
    ├── document_processor.py  # Processamento de PDFs
    ├── llm_providers/      # Provedores de LLM modulares
    │   ├── base.py
    │   ├── openai_provider.py
    │   ├── claude_provider.py
    │   └── gemini_provider.py
    └── requirements.txt
```

## 🔌 Endpoints da API

- `GET /api/health` - Health check
- `POST /api/upload` - Upload de documentos PDF
- `POST /api/chat` - Enviar pergunta ao chatbot
- `GET /api/documents` - Informações dos documentos processados
- `DELETE /api/documents` - Limpar todos os documentos
- `GET /api/model` - Informações do modelo LLM atual

## 🛠️ Desenvolvimento

### Adicionar Novo Provedor LLM

1. Crie um novo arquivo em `model/llm_providers/` (ex: `new_provider.py`)
2. Herde de `BaseLLMProvider`:
```python
from .base import BaseLLMProvider

class NewProvider(BaseLLMProvider):
    def _initialize_llm(self):
        # Implemente a inicialização
        pass
    
    def get_llm(self):
        return self.llm
```

3. Adicione ao factory em `llm_providers/__init__.py`
4. Adicione configurações em `config.py`

## 📝 Notas

- Os documentos são armazenados em `./chroma_db_codigo_estrada` (configurável)
- Arquivos enviados são salvos em `./uploads`
- A API suporta CORS configurável
- O sistema usa ChromaDB ao invés de FAISS para persistência
- Banco de dados separado do projeto de regulamento acadêmico

## 👥 Desenvolvido por

**InterBantu**

- Website: https://interbantu.com
- GitHub: https://github.com/INTERBANTU

## 📄 Licença

Este projeto está licenciado sob a Apache License 2.0.

---

**Powered by [InterBantu](https://interbantu.com)**

