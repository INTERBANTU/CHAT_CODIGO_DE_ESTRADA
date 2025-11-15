# 🚀 Como Rodar o Chatbot Código de Estrada

## 📋 Pré-requisitos

- Python 3.8+ instalado
- Node.js 18+ instalado
- Chave de API do Claude (ou OpenAI/Gemini)

## 🔧 Configuração Inicial

### 1. Backend (Python)

```bash
# Navegar para a pasta do backend
cd "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CODIGO_ESTRADA/model"

# Opção A: Usar o venv do projeto original (se existir)
source "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CONDUCAO/model/venv/bin/activate"

# Opção B: Criar um novo ambiente virtual
# python3 -m venv venv
# source venv/bin/activate

# Instalar dependências (se ainda não instaladas)
pip install -r requirements.txt

# Configurar variáveis de ambiente
# O arquivo .env já existe, mas verifique se tem a chave da API
# Edite o .env e adicione sua ANTHROPIC_API_KEY (ou outra chave conforme o provedor)
```

### 2. Frontend (React)

```bash
# Navegar para a pasta do frontend
cd "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CODIGO_ESTRADA/client"

# Instalar dependências (primeira vez)
npm install
```

## ▶️ Executar o Projeto

### Terminal 1 - Backend (API Flask)

```bash
cd "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CODIGO_ESTRADA/model"
source "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CONDUCAO/model/venv/bin/activate"
python api.py
```

A API estará rodando em: **http://localhost:5001**

### Terminal 2 - Frontend (React)

```bash
cd "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CODIGO_ESTRADA/client"
npm run dev
```

O frontend estará rodando em: **http://localhost:5174**

## 🔑 Credenciais de Login

- **Usuário**: `usuario@codigoestrada.mz` / `usuario2024`
- **Gestor**: `gestor@codigoestrada.mz` / `gestor2024`
- **Admin**: `admin@codigoestrada.mz` / `admin2024`

## 📝 Próximos Passos

1. Acesse http://localhost:5174 no navegador
2. Faça login como **Gestor** para fazer upload do Decreto-Lei n.º 1/2011 (Código da Estrada)
3. Após o upload, faça login como **Usuário** para usar o chatbot

## ⚠️ Notas Importantes

- Este projeto usa porta **5001** (backend) e **5174** (frontend) para não conflitar com o projeto de regulamento acadêmico
- O banco de dados está separado: `./chroma_db_codigo_estrada`
- Certifique-se de ter configurado a chave de API no arquivo `.env`

