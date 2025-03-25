// Simple script to test API connectivity
console.log('Testing API connectivity...');

// Test NFT Price Floor API
fetch('https://api.nftpricefloor.com/projects/cryptopunks/charts/1d?api_key=90414d13-22fa-4477-b1f9-55d4387a731b', {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
.then(response => {
  console.log('NFT Price Floor API response status:', response.status);
  if (response.ok) {
    return response.json();
  }
  throw new Error(`HTTP error! status: ${response.status}`);
})
.then(data => {
  console.log('NFT Price Floor API data:', data);
})
.catch(error => {
  console.error('NFT Price Floor API error:', error);
});

// Test NFTfi API
fetch('https://theta-sdk-api.nftfi.com/loans-due?daysFromNow=30&page_size=100&nftProjectName=Cryptopunks')
.then(response => {
  console.log('NFTfi API response status:', response.status);
  if (response.ok) {
    return response.json();
  }
  throw new Error(`HTTP error! status: ${response.status}`);
})
.then(data => {
  console.log('NFTfi API data:', data);
})
.catch(error => {
  console.error('NFTfi API error:', error);
});

// Test Reservoir API
fetch('https://api.reservoir.tools/collections/v6?slug=cryptopunks', {
  headers: {
    'accept': '*/*',
    'x-api-key': 'demo-api-key'
  }
})
.then(response => {
  console.log('Reservoir API response status:', response.status);
  if (response.ok) {
    return response.json();
  }
  throw new Error(`HTTP error! status: ${response.status}`);
})
.then(data => {
  console.log('Reservoir API data:', data);
})
.catch(error => {
  console.error('Reservoir API error:', error);
}); 