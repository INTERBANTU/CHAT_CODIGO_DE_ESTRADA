#!/bin/bash

# Script para iniciar o backend do Chatbot Código de Estrada

echo "🚗 Iniciando Backend - Chatbot Código de Estrada"
echo "================================================"

# Navegar para a pasta do backend
cd "$(dirname "$0")/model"

# Ativar ambiente virtual (usando o do projeto original)
if [ -d "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CONDUCAO/model/venv" ]; then
    echo "✅ Usando venv do projeto original..."
    source "/home/black/Documents/APRESENTACAO - MOZDEVZ/CHAT_CONDUCAO/model/venv/bin/activate"
else
    echo "⚠️  Venv não encontrado. Criando novo ambiente virtual..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Instalando dependências..."
    pip install -r requirements.txt
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Copiando de env.example..."
    cp env.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e adicione sua chave de API!"
fi

echo ""
echo "🚀 Iniciando servidor na porta 5001..."
echo "================================================"
python api.py

