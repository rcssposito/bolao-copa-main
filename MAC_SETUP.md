# 🍎 Guia de Setup para Mac

## ⚡ Início Rápido (3 comandos)

```bash
# 1. Ir para o backend e iniciar
cd /Users/rodrigosposito/Desktop/bolao-copa/backend
./start.sh

# 2. Em outro terminal, ir para o frontend
cd /Users/rodrigosposito/Desktop/bolao-copa/frontend
npm install && npm run dev
```

Pronto! 🎉

---

## 📝 Passo a Passo Detalhado

### 1. Backend Python

```bash
# Navegar para o backend
cd /Users/rodrigosposito/Desktop/bolao-copa/backend

# Opção A: Usar o script (RECOMENDADO)
./start.sh

# Opção B: Comando manual
python3 -m uvicorn app.main:app --reload --port 8000
```

**Verificar se está funcionando:**
```bash
# Em outro terminal
curl http://localhost:8000/health
```

Deve retornar: `{"status":"healthy"}`

---

### 2. Banco de Dados (Supabase)

1. Abrir no navegador: https://supabase.com/dashboard/project/erdklcxttfoevkdhzatp
2. Clicar em **SQL Editor** (menu lateral)
3. Copiar todo o conteúdo de `database/schema.sql`
4. Colar no editor
5. Clicar em **Run** (ou CMD+Enter)

✅ Tabelas criadas!

---

### 3. Frontend Next.js

```bash
# Navegar para o frontend
cd /Users/rodrigosposito/Desktop/bolao-copa/frontend

# Instalar dependências (primeira vez)
npm install

# O arquivo .env.local já foi criado para você
# Caso precise recriar, use suas próprias credenciais

# Iniciar o frontend
npm run dev
```

**Acessar**: http://localhost:3000

---

## 🧪 Testar a API

### Opção 1: Script Python

```bash
cd /Users/rodrigosposito/Desktop/bolao-copa/backend
python3 test_api.py
```

### Opção 2: cURL

```bash
# Health check
curl http://localhost:8000/health

# Criar usuário
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","grupo":"A","pagou":true}'

# Ver ranking
curl http://localhost:8000/api/ranking

# Sincronizar jogos
curl -X POST http://localhost:8000/api/admin/sync
```

---

## 🐛 Problemas Comuns no Mac

### Erro: "python3: command not found"

Instalar Python:
```bash
# Usando Homebrew
brew install python3

# Verificar instalação
python3 --version
```

### Erro: "pip: command not found"

```bash
# Instalar pip
python3 -m ensurepip --upgrade
```

### Erro: "Permission denied" ao executar start.sh

```bash
chmod +x start.sh
./start.sh
```

### Erro: "Port 8000 already in use"

```bash
# Encontrar processo usando a porta
lsof -ti:8000

# Matar o processo
kill -9 $(lsof -ti:8000)

# Ou usar outra porta
python3 -m uvicorn app.main:app --reload --port 8001
```

### Erro: "Module not found"

```bash
# Reinstalar dependências
cd backend
python3 -m pip install -r requirements.txt --force-reinstall
```

### Erro no npm install

```bash
# Limpar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🔧 Comandos Úteis para Mac

### Backend

```bash
# Ver logs em tempo real
tail -f logs/app.log

# Parar o servidor (se rodando em background)
pkill -f uvicorn

# Verificar se está rodando
ps aux | grep uvicorn

# Testar conexão
nc -zv localhost 8000
```

### Frontend

```bash
# Build para produção
npm run build

# Iniciar em produção
npm start

# Limpar cache do Next.js
rm -rf .next

# Ver processos Node
ps aux | grep node
```

### Banco de Dados

```bash
# Conectar via psql (se tiver instalado)
psql "postgresql://postgres:[PASSWORD]@db.erdklcxttfoevkdhzatp.supabase.co:5432/postgres"

# Backup do banco
pg_dump -h db.erdklcxttfoevkdhzatp.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql
```

---

## 📦 Instalar Dependências Globais (Opcional)

```bash
# Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3
brew install python3

# Node.js e npm
brew install node

# PostgreSQL client (para psql)
brew install postgresql

# Vercel CLI
npm install -g vercel
```

---

## 🚀 Deploy no Vercel (Mac)

### Backend

```bash
cd /Users/rodrigosposito/Desktop/bolao-copa/backend

# Login no Vercel (primeira vez)
vercel login

# Deploy
vercel --prod
```

### Frontend

```bash
cd /Users/rodrigosposito/Desktop/bolao-copa/frontend

# Atualizar .env.local com URL do backend
echo "NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app" > .env.local

# Deploy
vercel --prod
```

---

## 🎯 Atalhos para Terminal (Opcional)

Adicionar ao `~/.zshrc` ou `~/.bash_profile`:

```bash
# Atalhos para o Bolão Copa
alias bolao-backend='cd /Users/rodrigosposito/Desktop/bolao-copa/backend && ./start.sh'
alias bolao-frontend='cd /Users/rodrigosposito/Desktop/bolao-copa/frontend && npm run dev'
alias bolao-test='cd /Users/rodrigosposito/Desktop/bolao-copa/backend && python3 test_api.py'
```

Depois:
```bash
source ~/.zshrc  # ou source ~/.bash_profile
```

Agora pode usar:
```bash
bolao-backend   # Inicia o backend
bolao-frontend  # Inicia o frontend
bolao-test      # Testa a API
```

---

## 📱 Acessar de Outros Dispositivos na Rede Local

```bash
# Descobrir seu IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Exemplo de IP: 192.168.1.100
# Acessar de outro dispositivo:
# Backend: http://192.168.1.100:8000
# Frontend: http://192.168.1.100:3000
```

---

## 🔍 Verificar Status

```bash
# Backend rodando?
curl -s http://localhost:8000/health | jq

# Frontend rodando?
curl -s http://localhost:3000 | head -n 5

# Banco conectado?
curl -s http://localhost:8000/api/users | jq
```

---

## 📊 Monitoramento

```bash
# Ver uso de CPU/Memória
top -pid $(pgrep -f uvicorn)

# Ver logs do sistema
log show --predicate 'process == "Python"' --last 5m

# Ver conexões de rede
lsof -i -P | grep LISTEN
```

---

## 🎓 Dicas para Mac

1. **Use iTerm2** ao invés do Terminal padrão (melhor experiência)
2. **Use tmux** para múltiplas sessões em um terminal
3. **Use oh-my-zsh** para melhorar o shell
4. **Ative o Spotlight** para encontrar arquivos rapidamente (CMD+Space)
5. **Use CMD+K** no terminal para limpar a tela

---

## ✅ Checklist de Verificação

- [ ] Python 3.11+ instalado (`python3 --version`)
- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Dependências do backend instaladas
- [ ] Dependências do frontend instaladas
- [ ] Schema SQL executado no Supabase
- [ ] Backend rodando na porta 8000
- [ ] Frontend rodando na porta 3000
- [ ] API respondendo (`curl http://localhost:8000/health`)

---

**Tudo funcionando?** Consulte o [README.md](README.md) para próximos passos! 🚀