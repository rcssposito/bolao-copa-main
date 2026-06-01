const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('=== INICIANDO TESTE DE PONTA A PONTA ===');
  
  const endpoints = [
    { name: 'Total Pot (Pote Total)', path: '/api/admin/pot/total', method: 'GET' },
    { name: 'Admin Stats (Estatísticas Admin)', path: '/api/admin/stats', method: 'GET' },
    { name: 'Partidas Ativas (Matches)', path: '/api/matches', method: 'GET' },
    { name: 'Classificação (Ranking)', path: '/api/ranking', method: 'GET' },
    { name: 'Upcoming Matches (Próximas Partidas)', path: '/api/matches/upcoming', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting [${endpoint.method}] ${endpoint.name} em ${BASE_URL}${endpoint.path}...`);
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status Code: ${response.status} ${response.statusText}`);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        if (response.ok) {
          console.log('✅ Sucesso!');
          if (Array.isArray(json)) {
            console.log(`Itens retornados: ${json.length}`);
            if (json.length > 0) {
              console.log('Exemplo do primeiro item:', JSON.stringify(json[0], null, 2).substring(0, 300) + '...');
            }
          } else {
            console.log('Dados do JSON:', JSON.stringify(json, null, 2));
          }
        } else {
          console.error('❌ Erro retornado pela API:', json.error || json);
        }
      } catch (e) {
        console.log(`Resposta não-JSON (tamanho ${text.length} bytes):`);
        console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      }
    } catch (error) {
      console.error(`❌ Falha ao conectar na API:`, error.message);
    }
  }

  console.log('\n=== TESTES CONCLUÍDOS ===');
}

runTests();
