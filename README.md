# IB - EstradaResponde

<div align="center">

![IB - EstradaResponde](docs/IB_ESTRADA_RESPONDE/00%20-%20Login.png)

**"A estrada tem perguntas — nós temos as respostas."**

*O teu guia inteligente do Código da Estrada*

[![Powered by InterBantu](https://img.shields.io/badge/Powered%20by-InterBantu-orange?style=flat-square)](https://interbantu.com)

</div>

---

Sistema de chatbot inteligente desenvolvido pela **InterBantu** para responder perguntas sobre o **Código da Estrada de Moçambique** e legislação de trânsito rodoviário. Utiliza tecnologias de inteligência artificial (IA) para processar documentos legais e fornecer respostas precisas baseadas na legislação oficial, sempre citando as fontes (artigos, números e alíneas) e incluindo valores de multas quando disponíveis.

## 🎬 Como Funciona - Fluxo Completo

### 1️⃣ Tela de Login

O sistema começa com uma tela de login intuitiva e responsiva, onde você pode selecionar seu perfil (Usuário, Gestor ou Administrador) e fazer login automaticamente com as credenciais de teste.

![Tela de Login](docs/IB_ESTRADA_RESPONDE/00%20-%20Login.png)

**Características:**
- Design moderno e responsivo para mobile e desktop
- Seleção visual de perfil com preenchimento automático de credenciais
- Interface otimizada para diferentes tamanhos de tela

---

### 2️⃣ Tela Inicial do Assistente Virtual

Após o login, você é recebido pelo **IB - EstradaResponde** com uma mensagem de boas-vindas e perguntas sugeridas para começar rapidamente.

![Tela Inicial - Assistente Virtual](docs/IB_ESTRADA_RESPONDE/01%20-%20Usuario%20-%20Tela%20Inicial.png)

**Funcionalidades:**
- Mensagem de apresentação do IB - EstradaResponde da InterBantu
- Perguntas sugeridas por categoria (Velocidade, Multas, Condução, etc.)
- Interface de chat limpa e intuitiva
- Histórico de conversa persistente

---

### 3️⃣ Exemplo de Uso: Consulta sobre Carta de Condução

#### Pergunta: "Esqueci a carta de condução, qual é a multa?"

O sistema busca informações relevantes no Código da Estrada e fornece uma resposta completa com:

- **Explicação clara e direta** da infração
- **Valor da multa** quando disponível
- **Citações precisas** dos artigos, números e alíneas
- **Seção de fontes** no final da resposta

![Consulta - Carta de Condução - Parte 1](docs/IB_ESTRADA_RESPONDE/02%20-%20P1%20-%20P1%20-%20Esqueci%20Carta%20de%20Conducao.png)

![Consulta - Carta de Condução - Parte 2](docs/IB_ESTRADA_RESPONDE/02%20-%20P1%20-%20P2%20-%20Esqueci%20Carta%20de%20Conducao.png)

#### Detalhamento do Artigo 127 - Carta de Condução

As imagens abaixo mostram a resposta detalhada sobre o Artigo 127 do Código da Estrada, incluindo informações completas sobre a obrigatoriedade de portar a carta de condução:

![Artigo 127 - Carta de Condução - Parte 1](docs/IB_ESTRADA_RESPONDE/02%20-%20Artigo%20127%20-%20Carta%20de%20Condu%C3%A7%C3%A3o%20-%20P1.png)

![Artigo 127 - Carta de Condução - Parte 2](docs/IB_ESTRADA_RESPONDE/02%20-%20Artigo%20127%20-%20Carta%20de%20Condu%C3%A7%C3%A3o%20-%20P2.png)

📄 **Para conferir o documento oficial completo:** [Decreto-Lei n.º 1/2011 - Código da Estrada](https://www.imahanjane.co.mz/wp-content/uploads/2021/03/Decreto-Lei-n-01.2011-Aprova-o-Codigo-da-Estrada.pdf)

**Detalhes da Resposta:**
- Artigo 127 do Código da Estrada
- Número específico da infração
- Valor da multa em meticais (MT)
- Referências completas aos documentos oficiais

---

### 4️⃣ Exemplo de Uso: Consulta sobre Multas por Velocidade

#### Pergunta: "Quais são as multas dentro e fora das localidades?"

O sistema fornece uma resposta abrangente sobre limites de velocidade e multas relacionadas, incluindo:

- **Limites de velocidade** para diferentes tipos de veículos
- **Valores de multas** para excesso de velocidade
- **Diferenças** entre dentro e fora das localidades
- **Citações completas** de todos os artigos relevantes

![Consulta - Multas - Parte 1](docs/IB_ESTRADA_RESPONDE/03%20-%20P2%20-%20P1%20-%20Multas%20Dentro%20e%20Fora%20das%20Localidades.png)

![Consulta - Multas - Parte 2](docs/IB_ESTRADA_RESPONDE/03%20-%20P2%20-%20P2%20-%20Multas%20Dentro%20e%20Fora%20das%20Localidades.png)

![Consulta - Multas - Parte 3](docs/IB_ESTRADA_RESPONDE/03%20-%20P2%20-%20P3%20-%20Multas%20Dentro%20e%20Fora%20das%20Localidades.png)

**Características da Resposta:**
- Organização em seções claras
- Tabelas e listas quando apropriado
- Múltiplos artigos citados quando relevante
- Seção de fontes completa no final

---

## 🔄 Fluxo Completo do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  1. LOGIN                                                    │
│     • Selecionar perfil (Usuário/Gestor/Admin)              │
│     • Credenciais preenchidas automaticamente                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  2. ASSISTENTE VIRTUAL                                       │
│     • Mensagem de boas-vindas do IB - EstradaResponde       │
│     • Perguntas sugeridas por categoria                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  3. FAZER PERGUNTA                                           │
│     • Digitar pergunta sobre Código da Estrada              │
│     • Sistema busca em documentos processados                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  4. PROCESSAMENTO                                            │
│     • Busca semântica no ChromaDB                            │
│     • Recuperação de contexto relevante                      │
│     • Geração de resposta pelo LLM                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RESPOSTA                                                 │
│     • Explicação clara e direta                              │
│     • Valores de multas quando disponíveis                   │
│     • Citações de artigos, números e alíneas                 │
│     • Seção de fontes completa                               │
└─────────────────────────────────────────────────────────────┘
```

---

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

- **Usuário**: `usuario@interbantu.com` / `usuario2024`
  - Acesso ao Assistente Virtual para fazer perguntas

- **Gestor**: `gestor@interbantu.com` / `gestor2024`
  - Acesso ao Painel do Gestor para gerenciar documentos
  - Acesso ao Assistente Virtual

- **Admin**: `admin@interbantu.com` / `admin2024`
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

