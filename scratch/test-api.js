const axios = require('axios');

const apiKey = 'fde65f5cfad8421399d767ca2cec0b81';
const compCode = 'WC'; // World Cup

async function test() {
  const url = `https://api.football-data.org/v4/competitions/${compCode}/matches`;
  console.log(`Connecting to: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: { 'X-Auth-Token': apiKey },
      timeout: 10000,
    });
    console.log('Success! Status:', response.status);
    console.log('Matches Count:', response.data.matches ? response.data.matches.length : 0);
    if (response.data.matches && response.data.matches.length > 0) {
      console.log('Sample Match:', JSON.stringify(response.data.matches[0], null, 2));
    }
  } catch (error) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

test();
