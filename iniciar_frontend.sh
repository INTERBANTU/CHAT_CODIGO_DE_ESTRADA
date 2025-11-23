#!/bin/bash

# Script para iniciar o frontend do IB - EstradaResponde

echo "🚗 Iniciando Frontend - IB - EstradaResponde"
echo "=================================================="

# Navegar para a pasta do frontend
cd "$(dirname "$0")/client"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

echo ""
echo "🚀 Iniciando servidor de desenvolvimento na porta 5174..."
echo "=================================================="
npm run dev

