# 🚀 Guia Rápido de Início

## ✅ Checklist de Setup

### 1. Backend Python (5 minutos)

```bash
cd backend

# Instalar dependências (já em andamento)
python3 -m pip install -r requirements.txt

# Criar arquivo .env (copiar do .env.example)
cp .env.example .env

# Editar .env com suas credenciais
# (você já tem as credenciais corretas no .env da raiz)

# Testar o backend
uvicorn app.main:app --reload --port 8000
```

Acesse: http://localhost:8000/docs para ver a documentação interativa

### 2. Banco de Dados Supabase (2 minutos)

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto: https://supabase.com/dashboard/project/erdklcxttfoevkdhzatp
3. Vá em **SQL Editor**
4. Cole o conteúdo de `database/schema.sql`
5. Clique em **Run**

✅ Pronto! Tabelas criadas.

### 3. Frontend Next.js (3 minutos)

```bash
cd frontend

# Instalar dependências
npm install

# O arquivo .env.local já foi criado para você
# Caso precise recriar, use suas próprias credenciais

# Rodar o frontend
npm run dev
```

Acesse: http://localhost:3000

---

## 🧪 Testar o Sistema

### 1. Criar um usuário

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste User",
    "grupo": "A",
    "pagou": true
  }'
```

### 2. Sincronizar jogos da API

```bash
curl -X POST http://localhost:8000/api/admin/sync
```

### 3. Ver jogos disponíveis

```bash
curl http://localhost:8000/api/matches
```

### 4. Ver ranking

```bash
curl http://localhost:8000/api/ranking
```

---

## 🚀 Deploy no Vercel

### Backend

```bash
cd backend
vercel --prod
```

Anote a URL do backend (ex: `https://seu-backend.vercel.app`)

### Frontend

```bash
cd frontend

# Atualizar .env.local com a URL do backend
echo "NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app" > .env.local

# Deploy
vercel --prod
```

---

## 📝 Comandos Úteis

### Backend

```bash
# Rodar em desenvolvimento
uvicorn app.main:app --reload

# Rodar em produção
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Ver logs
tail -f logs/app.log
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Lint
npm run lint
```

### Banco de Dados

```bash
# Conectar via psql (se necessário)
psql postgresql://postgres:[PASSWORD]@db.erdklcxttfoevkdhzatp.supabase.co:5432/postgres

# Backup
pg_dump -h db.erdklcxttfoevkdhzatp.supabase.co -U postgres -d postgres > backup.sql
```

---

## 🐛 Problemas Comuns

### Backend não inicia

```bash
# Verificar Python
python3 --version  # Deve ser 3.11+

# Reinstalar dependências
pip install -r requirements.txt --force-reinstall

# Verificar .env
cat .env
```

### Frontend não conecta

```bash
# Verificar se backend está rodando
curl http://localhost:8000/health

# Verificar .env.local
cat .env.local

# Limpar cache
rm -rf .next
npm run dev
```

### Erro no Supabase

1. Verificar credenciais no .env
2. Verificar se schema foi executado
3. Verificar RLS policies no dashboard

---

## 📊 Estrutura de Dados

### Criar usuário de teste

```sql
INSERT INTO users (nome, grupo, pagou) 
VALUES ('João Silva', 'A', true);
```

### Ver todos os usuários

```sql
SELECT * FROM users;
```

### Ver jogos

```sql
SELECT * FROM matches ORDER BY data;
```

### Ver apostas

```sql
SELECT u.nome, m.time_casa, m.time_fora, b.palpite_casa, b.palpite_fora, b.pontos
FROM bets b
JOIN users u ON b.usuario_id = u.id
JOIN matches m ON b.jogo_id = m.id;
```

---

## 🎯 Próximos Passos

1. ✅ Executar schema SQL
2. ✅ Testar backend localmente
3. ✅ Testar frontend localmente
4. ⏳ Criar componentes React
5. ⏳ Deploy no Vercel
6. ⏳ Configurar cron job para sync

---

**Dúvidas?** Consulte o [README.md](README.md) completo!