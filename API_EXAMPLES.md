# 📡 Exemplos de Uso da API

## 🔗 Base URL

```
Local: http://localhost:8000
Produção: https://seu-backend.vercel.app
```

---

## 👥 Usuários

### Criar usuário

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "grupo": "A",
    "pagou": true
  }'
```

**Resposta:**
```json
{
  "id": "uuid-aqui",
  "nome": "João Silva",
  "pontos_total": 0,
  "ultimo_palpite_casa": null,
  "ultimo_palpite_fora": null,
  "grupo": "A",
  "pagou": true,
  "created_at": "2026-05-20T17:00:00Z"
}
```

### Listar todos os usuários

```bash
curl http://localhost:8000/api/users
```

### Buscar usuário específico

```bash
curl http://localhost:8000/api/users/{user_id}
```

### Atualizar usuário

```bash
curl -X PUT http://localhost:8000/api/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Jr",
    "grupo": "B"
  }'
```

---

## ⚽ Jogos

### Listar jogos disponíveis para apostar

```bash
curl http://localhost:8000/api/matches
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "id_api": 12345,
    "time_casa": "Brasil",
    "time_fora": "Argentina",
    "data": "2026-06-20T16:00:00Z",
    "placar_casa": null,
    "placar_fora": null,
    "status": "SCHEDULED",
    "is_last_match": false,
    "created_at": "2026-05-20T17:00:00Z",
    "updated_at": "2026-05-20T17:00:00Z"
  }
]
```

### Listar jogos futuros (visualização)

```bash
curl http://localhost:8000/api/matches/upcoming
```

### Listar jogos finalizados

```bash
curl http://localhost:8000/api/matches/finished
```

### Buscar jogo específico

```bash
curl http://localhost:8000/api/matches/{match_id}
```

### Buscar último jogo (para desempate)

```bash
curl http://localhost:8000/api/matches/last/match
```

---

## 🎲 Apostas

### Criar/Atualizar aposta

```bash
curl -X POST http://localhost:8000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": "user-uuid",
    "jogo_id": "match-uuid",
    "palpite_casa": 2,
    "palpite_fora": 1,
    "resultado_radio": "CASA"
  }'
```

**Resposta:**
```json
{
  "id": "bet-uuid",
  "usuario_id": "user-uuid",
  "jogo_id": "match-uuid",
  "palpite_casa": 2,
  "palpite_fora": 1,
  "resultado_radio": "CASA",
  "pontos": 0,
  "created_at": "2026-05-20T17:00:00Z"
}
```

### Listar apostas de um usuário

```bash
curl http://localhost:8000/api/bets/user/{user_id}
```

### Listar apostas de um jogo

```bash
curl http://localhost:8000/api/bets/match/{match_id}
```

### Deletar aposta

```bash
curl -X DELETE http://localhost:8000/api/bets/{bet_id}
```

---

## 🏆 Ranking

### Ver ranking geral

```bash
curl http://localhost:8000/api/ranking
```

**Resposta:**
```json
{
  "ranking": [
    {
      "id": "user-uuid",
      "nome": "João Silva",
      "pontos_total": 45,
      "ultimo_palpite_casa": 2,
      "ultimo_palpite_fora": 1,
      "grupo": "A",
      "pagou": true,
      "posicao": 1,
      "diferenca_ultimo_jogo": 0.0
    },
    {
      "id": "user-uuid-2",
      "nome": "Maria Santos",
      "pontos_total": 42,
      "ultimo_palpite_casa": 1,
      "ultimo_palpite_fora": 1,
      "grupo": "A",
      "pagou": true,
      "posicao": 2,
      "diferenca_ultimo_jogo": 2.0
    }
  ],
  "total_usuarios": 2
}
```

### Ver ranking de um grupo

```bash
curl http://localhost:8000/api/ranking/group/A
```

---

## 🔧 Admin

### Listar todos os usuários (admin)

```bash
curl http://localhost:8000/api/admin/users
```

### Atualizar usuário (admin)

```bash
curl -X PUT http://localhost:8000/api/admin/users/{user_id} \
  -H "Content-Type: application/json" \
  -d '{
    "grupo": "B",
    "pagou": true
  }'
```

### Listar usuários por grupo

```bash
curl http://localhost:8000/api/admin/users/group/A
```

### Ver total do pote

```bash
curl http://localhost:8000/api/admin/pot/total
```

**Resposta:**
```json
{
  "valor_por_usuario": 50.0,
  "usuarios_pagantes": 25,
  "total_pote": 1250.0
}
```

### Atualizar valor do pote

```bash
curl -X PUT http://localhost:8000/api/admin/config/pot \
  -H "Content-Type: application/json" \
  -d '{
    "value": "100"
  }'
```

### Sincronizar dados manualmente

```bash
curl -X POST http://localhost:8000/api/admin/sync
```

**Resposta:**
```json
{
  "success": true,
  "matches_updated": 64,
  "bets_calculated": 150,
  "users_updated": 25,
  "message": "Full sync completed successfully"
}
```

### Ver estatísticas gerais

```bash
curl http://localhost:8000/api/admin/stats
```

**Resposta:**
```json
{
  "total_users": 50,
  "paid_users": 45,
  "unpaid_users": 5,
  "total_matches": 64,
  "finished_matches": 10,
  "scheduled_matches": 54,
  "total_bets": 450
}
```

---

## 🔄 Fluxo Completo de Aposta

### 1. Criar usuário

```bash
USER_ID=$(curl -s -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome": "Teste User", "grupo": "A", "pagou": true}' \
  | jq -r '.id')

echo "User ID: $USER_ID"
```

### 2. Sincronizar jogos

```bash
curl -X POST http://localhost:8000/api/admin/sync
```

### 3. Listar jogos disponíveis

```bash
MATCH_ID=$(curl -s http://localhost:8000/api/matches \
  | jq -r '.[0].id')

echo "Match ID: $MATCH_ID"
```

### 4. Fazer aposta

```bash
curl -X POST http://localhost:8000/api/bets \
  -H "Content-Type: application/json" \
  -d "{
    \"usuario_id\": \"$USER_ID\",
    \"jogo_id\": \"$MATCH_ID\",
    \"palpite_casa\": 2,
    \"palpite_fora\": 1,
    \"resultado_radio\": \"CASA\"
  }"
```

### 5. Ver apostas do usuário

```bash
curl http://localhost:8000/api/bets/user/$USER_ID
```

### 6. Ver ranking

```bash
curl http://localhost:8000/api/ranking
```

---

## 🧪 Testes com Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Criar usuário
response = requests.post(
    f"{BASE_URL}/api/users",
    json={
        "nome": "Python User",
        "grupo": "A",
        "pagou": True
    }
)
user = response.json()
print(f"User created: {user['id']}")

# Listar jogos
matches = requests.get(f"{BASE_URL}/api/matches").json()
print(f"Available matches: {len(matches)}")

# Fazer aposta
if matches:
    bet = requests.post(
        f"{BASE_URL}/api/bets",
        json={
            "usuario_id": user['id'],
            "jogo_id": matches[0]['id'],
            "palpite_casa": 2,
            "palpite_fora": 1,
            "resultado_radio": "CASA"
        }
    ).json()
    print(f"Bet created: {bet['id']}")

# Ver ranking
ranking = requests.get(f"{BASE_URL}/api/ranking").json()
print(f"Total users in ranking: {ranking['total_usuarios']}")
```

---

## 🧪 Testes com JavaScript/Node

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testAPI() {
  // Criar usuário
  const userResponse = await axios.post(`${BASE_URL}/api/users`, {
    nome: 'JS User',
    grupo: 'A',
    pagou: true
  });
  const user = userResponse.data;
  console.log(`User created: ${user.id}`);

  // Listar jogos
  const matchesResponse = await axios.get(`${BASE_URL}/api/matches`);
  const matches = matchesResponse.data;
  console.log(`Available matches: ${matches.length}`);

  // Fazer aposta
  if (matches.length > 0) {
    const betResponse = await axios.post(`${BASE_URL}/api/bets`, {
      usuario_id: user.id,
      jogo_id: matches[0].id,
      palpite_casa: 2,
      palpite_fora: 1,
      resultado_radio: 'CASA'
    });
    console.log(`Bet created: ${betResponse.data.id}`);
  }

  // Ver ranking
  const rankingResponse = await axios.get(`${BASE_URL}/api/ranking`);
  console.log(`Total users: ${rankingResponse.data.total_usuarios}`);
}

testAPI().catch(console.error);
```

---

## 📝 Notas Importantes

1. **Timing de Apostas**: Apostas só podem ser criadas/editadas antes do início do jogo
2. **Pontuação**: Calculada automaticamente após o jogo finalizar
3. **Ranking**: Atualizado automaticamente após cada sincronização
4. **Desempate**: Baseado na diferença do palpite do último jogo

---

## 🔐 Autenticação

Atualmente a API não requer autenticação. Para produção, considere adicionar:
- JWT tokens
- API keys
- Rate limiting
- CORS específico

---

**Documentação Interativa**: http://localhost:8000/docs