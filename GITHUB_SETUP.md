# Instruções para Conectar com GitHub

## Pré-requisitos

1. Ter uma conta no GitHub
2. Ter o Git instalado no sistema
3. Ter acesso ao repositório: https://github.com/INTERBANTU/CHAT_CODIGO_DE_ESTRADA

## Passo a Passo

### 1. Inicializar o Repositório Git (se ainda não foi feito)

```bash
# Navegar para a pasta do projeto
cd "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CODIGO_ESTRADA"

# Inicializar o repositório Git
git init

# Configurar seu nome e email (se ainda não configurou)
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### 2. Criar arquivo .gitignore (se não existir)

```bash
# Criar arquivo .gitignore para ignorar arquivos desnecessários
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Ambiente
.env
.env.local
.env.*.local

# Banco de dados
*.db
*.sqlite
*.sqlite3
chroma_db/
chroma_db_*/

# Uploads
uploads/
model/uploads/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Build
client/dist/
client/build/
*.pyc
EOF
```

### 3. Adicionar Arquivos ao Git

```bash
# Adicionar todos os arquivos (exceto os ignorados pelo .gitignore)
git add .

# Verificar o que será commitado
git status
```

### 4. Fazer o Primeiro Commit

```bash
# Fazer o commit inicial
git commit -m "Initial commit: Chatbot Código de Estrada"
```

### 5. Conectar com o Repositório Remoto do GitHub

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/INTERBANTU/CHAT_CODIGO_DE_ESTRADA.git

# Verificar se foi adicionado corretamente
git remote -v
```

### 6. Fazer Push para o GitHub

```bash
# Renomear branch para main (se necessário)
git branch -M main

# Fazer push para o GitHub
# Se for a primeira vez, pode pedir autenticação
git push -u origin main
```

**Nota:** Se pedir autenticação, você pode:
- Usar um Personal Access Token (recomendado)
- Ou configurar SSH keys

### 7. Configurar Autenticação (se necessário)

#### Opção A: Personal Access Token

1. Ir para: https://github.com/settings/tokens
2. Gerar novo token (classic)
3. Dar permissões: `repo` (acesso completo ao repositório)
4. Copiar o token
5. Quando pedir senha, usar o token no lugar da senha

#### Opção B: SSH Keys

```bash
# Gerar chave SSH (se ainda não tiver)
ssh-keygen -t ed25519 -C "seu.email@exemplo.com"

# Copiar a chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar a chave no GitHub: https://github.com/settings/keys
# Depois mudar a URL do remote para SSH:
git remote set-url origin git@github.com:INTERBANTU/CHAT_CODIGO_DE_ESTRADA.git
```

## Comandos Úteis para o Futuro

### Verificar Status
```bash
git status
```

### Adicionar Mudanças
```bash
# Adicionar todos os arquivos modificados
git add .

# Ou adicionar arquivos específicos
git add arquivo1.py arquivo2.tsx
```

### Fazer Commit
```bash
git commit -m "Descrição das mudanças"
```

### Enviar para GitHub
```bash
git push origin main
```

### Atualizar do GitHub
```bash
git pull origin main
```

### Ver Histórico
```bash
git log --oneline
```

## Estrutura Recomendada de Commits

Use mensagens de commit descritivas:

```bash
git commit -m "feat: adicionar logo InterBantu e footer"
git commit -m "fix: corrigir captura de números e alíneas nos artigos"
git commit -m "docs: atualizar README com instruções de uso"
git commit -m "refactor: aumentar tamanho de chunks para melhor captura"
```

## Resolver Conflitos (se necessário)

Se houver conflitos ao fazer pull:

```bash
# Ver arquivos em conflito
git status

# Editar os arquivos para resolver conflitos
# Depois:
git add .
git commit -m "resolve: resolver conflitos de merge"
git push origin main
```

## Verificar Conexão

```bash
# Verificar remotes configurados
git remote -v

# Deve mostrar:
# origin  https://github.com/INTERBANTU/CHAT_CODIGO_DE_ESTRADA.git (fetch)
# origin  https://github.com/INTERBANTU/CHAT_CODIGO_DE_ESTRADA.git (push)
```

