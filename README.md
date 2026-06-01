# 🏆 Bolão Copa 2026

Sistema completo de bolão da Copa do Mundo com backend Python (FastAPI) e frontend Next.js com Carbon Design System.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração Inicial](#configuração-inicial)
- [Backend (FastAPI)](#backend-fastapi)
- [Frontend (Next.js)](#frontend-nextjs)
- [Banco de Dados (Supabase)](#banco-de-dados-supabase)
- [Deploy no Vercel](#deploy-no-vercel)
- [API Endpoints](#api-endpoints)
- [Regras do Bolão](#regras-do-bolão)

---

## 🎯 Visão Geral

Sistema de bolão para até 50 usuários simultâneos com:
- ✅ Apostas em jogos da Copa do Mundo
- ✅ Sistema de pontuação automático
- ✅ Ranking com critério de desempate
- ✅ Painel administrativo
- ✅ Integração com Football-Data.org API
- ✅ Interface moderna com Carbon Design System

---

## 🛠️ Tecnologias

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web moderno e rápido
- **Supabase Python Client** - Cliente para PostgreSQL
- **httpx** - Cliente HTTP assíncrono
- **Pydantic** - Validação de dados

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Type safety
- **Carbon Design System** - UI Components da IBM
- **Axios** - Cliente HTTP

### Banco de Dados
- **Supabase** (PostgreSQL) - Banco de dados gerenciado

### Deploy
- **Vercel** - Hospedagem serverless

---

## 📁 Estrutura do Projeto

```
bolao-copa/
├── backend/                    # API Python FastAPI
│   ├── app/
│   │   ├── api/               # Endpoints da API
│   │   │   ├── users.py       # Gerenciamento de usuários
│   │   │   ├── matches.py     # Jogos
│   │   │   ├── bets.py        # Apostas
│   │   │   ├── ranking.py     # Ranking
│   │   │   └── admin.py       # Administração
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── football_api.py # Integração Football-Data.org
│   │   │   ├── scoring.py     # Sistema de pontuação
│   │   │   └── sync.py        # Sincronização de dados
│   │   ├── config.py          # Configurações
│   │   ├── database.py        # Conexão Supabase
│   │   ├── models.py          # Modelos Pydantic
│   │   └── main.py            # App FastAPI
│   ├── requirements.txt       # Dependências Python
│   └── vercel.json           # Config Vercel para Python
│
├── frontend/                  # App Next.js
│   ├── app/                  # App Router
│   │   ├── layout.tsx        # Layout principal
│   │   ├── page.tsx          # Página inicial
│   │   └── globals.css       # Estilos globais
│   ├── components/           # Componentes React
│   ├── lib/                  # Utilitários
│   │   ├── api.ts           # Cliente API
│   │   └── supabase.ts      # Cliente Supabase
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── database/
│   └── schema.sql            # Schema do banco
│
└── README.md                 # Este arquivo
```

---

## ⚙️ Configuração Inicial

### 1. Clone o Repositório

```bash
cd /Users/rodrigosposito/Desktop
# O projeto já está em bolao-copa/
```

### 2. Configurar Variáveis de Ambiente

Você já tem o arquivo `.env` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
FOOTBALL_API_KEY=your_football_api_key_here
ENVIRONMENT=development
```

**Nota**: As credenciais reais estão nos arquivos `.env` que foram criados para você.

---

## 🐍 Backend (FastAPI)

### Instalação

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Executar Localmente

```bash
# Na pasta backend/
uvicorn app.main:app --reload --port 8000
```

A API estará disponível em: `http://localhost:8000`
Documentação interativa: `http://localhost:8000/docs`

### Testar Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Listar usuários
curl http://localhost:8000/api/users

# Ver ranking
curl http://localhost:8000/api/ranking
```

---

## ⚛️ Frontend (Next.js)

### Instalação

```bash
cd frontend
npm install
```

### Executar Localmente

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

### Build para Produção

```bash
npm run build
npm start
```

---

## 🗄️ Banco de Dados (Supabase)

### 1. Acessar Supabase

Você já tem um projeto Supabase configurado:
- URL: `https://erdklcxttfoevkdhzatp.supabase.co`

### 2. Executar Schema SQL

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o conteúdo de `database/schema.sql`
4. Execute o script

Isso criará:
- ✅ Tabela `users` (usuários)
- ✅ Tabela `matches` (jogos)
- ✅ Tabela `bets` (apostas)
- ✅ Tabela `config` (configurações)
- ✅ Índices para performance
- ✅ Triggers automáticos
- ✅ Row Level Security (RLS)

### 3. Verificar Tabelas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 🚀 Deploy no Vercel

### Backend (Python API)

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy do Backend**
```bash
cd backend
vercel --prod
```

3. **Configurar Variáveis de Ambiente no Vercel**
   - Acesse o dashboard do Vercel
   - Vá em Settings > Environment Variables
   - Adicione:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - `FOOTBALL_API_KEY`

### Frontend (Next.js)

1. **Deploy do Frontend**
```bash
cd frontend
vercel --prod
```

2. **Configurar Variável de Ambiente**
   - `NEXT_PUBLIC_API_URL` = URL do backend deployado

### Conectar os Dois

Após deploy, atualize o `NEXT_PUBLIC_API_URL` no frontend para apontar para a URL do backend.

---

## 📡 API Endpoints

### Usuários

```
GET    /api/users              # Listar todos os usuários
GET    /api/users/{id}         # Buscar usuário específico
POST   /api/users              # Criar novo usuário
PUT    /api/users/{id}         # Atualizar usuário
DELETE /api/users/{id}         # Deletar usuário
```

### Jogos

```
GET    /api/matches            # Jogos disponíveis para apostar
GET    /api/matches/upcoming   # Jogos futuros (visualização)
GET    /api/matches/finished   # Jogos finalizados
GET    /api/matches/{id}       # Jogo específico
```

### Apostas

```
POST   /api/bets               # Criar/atualizar aposta
GET    /api/bets/user/{id}     # Apostas de um usuário
GET    /api/bets/match/{id}    # Apostas de um jogo
DELETE /api/bets/{id}          # Deletar aposta
```

### Ranking

```
GET    /api/ranking            # Ranking geral
GET    /api/ranking/group/{g}  # Ranking por grupo
```

### Admin

```
GET    /api/admin/users                # Todos os usuários (admin)
PUT    /api/admin/users/{id}           # Atualizar usuário (admin)
GET    /api/admin/users/group/{group}  # Usuários por grupo
GET    /api/admin/pot/total            # Total do pote
PUT    /api/admin/config/pot           # Atualizar valor do pote
POST   /api/admin/sync                 # Sincronizar dados manualmente
GET    /api/admin/stats                # Estatísticas gerais
```

---

## 🎮 Regras do Bolão

### Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato | **7 pontos** |
| Vencedor correto | **5 pontos** |
| Empate correto | **3 pontos** |
| Erro | **0 pontos** |

### Critério de Desempate

Em caso de empate na pontuação total, vence quem tiver o palpite **mais próximo do placar exato do ÚLTIMO jogo** da competição.

### Regras de Aposta

- ✅ Usuário pode apostar até o início do jogo
- ✅ Pode alterar aposta antes do jogo começar
- ✅ Após início do jogo, aposta fica bloqueada
- ✅ Pontuação calculada automaticamente após jogo finalizar

### Pote

- Valor configurável por usuário (padrão: R$ 50)
- Total do pote = valor × número de usuários que pagaram
- Apenas usuários com `pagou = true` entram no cálculo

---

## 🔄 Sincronização de Dados

### Automática (Recomendado)

Configure um Cron Job no Vercel:

```json
{
  "crons": [{
    "path": "/api/admin/sync",
    "schedule": "0 * * * *"
  }]
}
```

Isso sincroniza a cada hora.

### Manual

```bash
curl -X POST https://seu-backend.vercel.app/api/admin/sync
```

### O que é Sincronizado

1. **Jogos** da API Football-Data.org
2. **Placares** atualizados
3. **Pontuação** de todas as apostas
4. **Ranking** recalculado
5. **Último jogo** marcado para desempate

---

## 🔑 Football-Data.org API

### Obter API Key

1. Acesse: https://www.football-data.org/client/register
2. Crie uma conta gratuita
3. Copie sua API key
4. Adicione no `.env`: `FOOTBALL_API_KEY=sua_key_aqui`

### Limites do Plano Gratuito

- ✅ 10 requisições por minuto
- ✅ Acesso a competições principais
- ✅ Dados em tempo real

---

## 🎨 Customização

### Alterar Valor do Pote

Via API:
```bash
curl -X PUT https://seu-backend.vercel.app/api/admin/config/pot \
  -H "Content-Type: application/json" \
  -d '{"value": "100"}'
```

Ou direto no banco:
```sql
UPDATE config SET value = '100' WHERE key = 'pot_value';
```

### Adicionar Usuários

```bash
curl -X POST https://seu-backend.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "grupo": "A",
    "pagou": true
  }'
```

---

## 🐛 Troubleshooting

### Backend não inicia

```bash
# Verificar dependências
pip install -r requirements.txt

# Verificar variáveis de ambiente
cat .env
```

### Frontend não conecta ao backend

1. Verificar `NEXT_PUBLIC_API_URL` no `.env`
2. Verificar CORS no backend (já configurado)
3. Testar backend diretamente: `curl http://localhost:8000/health`

### Erro no Supabase

1. Verificar credenciais no `.env`
2. Verificar se schema foi executado
3. Verificar RLS policies

---

## 📝 Próximos Passos

1. ✅ Executar schema SQL no Supabase
2. ✅ Testar backend localmente
3. ✅ Instalar dependências do frontend
4. ✅ Testar frontend localmente
5. ✅ Deploy no Vercel
6. ✅ Configurar sincronização automática
7. ✅ Adicionar usuários
8. ✅ Testar fluxo completo de apostas

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs no Vercel Dashboard
2. Testar endpoints na documentação: `/docs`
3. Verificar tabelas no Supabase Dashboard

---

## 📄 Licença

Projeto privado para uso pessoal.

---

**Desenvolvido com ❤️ para a Copa do Mundo 2026** 🏆⚽