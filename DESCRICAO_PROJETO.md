# IB - EstradaResponde

## 📋 Descrição do Projeto

Sistema de chatbot inteligente desenvolvido para responder perguntas sobre o **Código da Estrada de Moçambique** e legislação de trânsito rodoviário. O sistema utiliza tecnologias de inteligência artificial (IA) para processar documentos legais e fornecer respostas precisas baseadas na legislação oficial.

## 🎯 Objetivo

Facilitar o acesso e compreensão do Código da Estrada e legislação de trânsito para cidadãos, condutores e profissionais do setor, através de um assistente virtual que responde perguntas de forma clara e precisa, sempre citando as fontes oficiais.

## ✨ Características Principais

### 🤖 Assistente Virtual Inteligente
- Respostas baseadas em documentos oficiais (decretos e legislação)
- Citações precisas de artigos, números e alíneas
- Inclusão automática de valores de multas quando disponíveis
- Interface conversacional e amigável

### 📚 Gestão de Documentos
- Upload e processamento automático de PDFs
- Suporte a múltiplos documentos
- Divisão inteligente em segmentos para busca eficiente
- Banco de dados vetorial persistente (ChromaDB)

### 🔍 Sistema de Busca Avançado
- Busca semântica usando embeddings
- Recuperação de informações relevantes
- Suporte a múltiplos documentos simultaneamente
- Algoritmo MMR (Maximum Marginal Relevance) para diversidade

### 👥 Sistema de Usuários
- **Usuário**: Acesso ao assistente virtual para fazer perguntas
- **Gestor**: Gerenciamento de documentos e upload de PDFs
- **Administrador**: Acesso completo com estatísticas e visão geral

### 🎨 Interface Moderna
- Design responsivo (mobile e desktop)
- Cores personalizadas (branco, #cf5001, #2d1d0e)
- Logo InterBantu integrada
- Footer "Powered by InterBantu" com link

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **React Router** para navegação
- **React Hot Toast** para notificações
- **Lucide React** para ícones

### Backend
- **Python 3.8+**
- **Flask** para API REST
- **LangChain** para processamento de LLM
- **ChromaDB** para banco de dados vetorial
- **PyPDF2** para extração de texto de PDFs
- **OpenAI Embeddings** para vetorização de texto

### Modelos de IA
- Suporte a múltiplos provedores LLM:
  - **OpenAI** (GPT-4o-mini, GPT-4)
  - **Anthropic Claude** (Claude Sonnet)
  - **Google Gemini** (Gemini Pro)
- Modelo de embeddings: text-embedding-3-large

## 📁 Estrutura do Projeto

```
CHAT_CODIGO_ESTRADA/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── contexts/       # Contextos React (Auth)
│   │   ├── services/       # Serviços de API
│   │   └── ...
│   └── public/             # Arquivos estáticos
│
└── model/                  # Backend Python
    ├── api.py              # API Flask principal
    ├── config.py           # Configurações centralizadas
    ├── document_processor.py  # Processamento de PDFs
    ├── llm_providers/      # Provedores de LLM modulares
    │   ├── base.py         # Classe base e prompt template
    │   ├── openai_provider.py
    │   ├── claude_provider.py
    │   └── gemini_provider.py
    ├── chroma_db_codigo_estrada/  # Banco de dados vetorial
    └── uploads/            # PDFs enviados
```

## 🚀 Funcionalidades

### Para Usuários
- ✅ Fazer perguntas sobre o Código da Estrada
- ✅ Receber respostas com citações precisas
- ✅ Ver valores de multas quando aplicável
- ✅ Usar perguntas sugeridas para começar
- ✅ Histórico de conversação

### Para Gestores
- ✅ Upload de documentos PDF
- ✅ Visualização de documentos processados
- ✅ Estatísticas de segmentos e documentos
- ✅ Remoção de documentos
- ✅ Acesso ao assistente virtual

### Para Administradores
- ✅ Todas as funcionalidades do Gestor
- ✅ Visão geral completa do sistema
- ✅ Estatísticas detalhadas
- ✅ Informações sobre o modelo LLM em uso

## 📊 Processamento de Documentos

1. **Upload**: PDF é enviado através da interface
2. **Extração**: Texto é extraído do PDF
3. **Divisão**: Texto é dividido em chunks inteligentes (3000 caracteres, overlap de 1000)
4. **Vetorização**: Cada chunk é convertido em embedding
5. **Armazenamento**: Embeddings são armazenados no ChromaDB
6. **Busca**: Quando o usuário faz uma pergunta, o sistema busca os chunks mais relevantes

## 🔐 Segurança

- Sistema de autenticação por tipo de usuário
- Validação de uploads (apenas PDFs)
- CORS configurado para origens específicas
- Variáveis de ambiente para chaves de API

## 📝 Licença

Este projeto está licenciado sob a Apache License 2.0.

## 👥 Desenvolvido por

**InterBantu**

- Website: https://interbantu.com
- GitHub: https://github.com/INTERBANTU

## 📞 Suporte

Para questões sobre o projeto, entre em contato através do repositório GitHub.

---

**Powered by [InterBantu](https://interbantu.com)**

