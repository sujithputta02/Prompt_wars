// Quick test for WeatherAPI.com
const apiKey = 'c0c8c9d60e2049da98071044261504';
const lat = 19.0760; // Mumbai
const lng = 72.8777;

const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&aqi=no`;

console.log('Testing WeatherAPI.com...');
console.log('API Key:', apiKey);
console.log('Location: Mumbai (19.0760, 72.8877)\n');

fetch(url)
  .then(response => {
    console.log('Status:', response.status, response.statusText);
    if (!response.ok) {
      return response.json().then(data => {
        console.error('Error Response:', JSON.stringify(data, null, 2));
        process.exit(1);
      });
    }
    return response.json();
  })
  .then(data => {
    if (data.current) {
      console.log('\n✅ SUCCESS! WeatherAPI is working\n');
      console.log('Location:', data.location.name, ',', data.location.country);
      console.log('Temperature:', data.current.temp_c, '°C');
      console.log('Condition:', data.current.condition.text);
      console.log('Humidity:', data.current.humidity, '%');
      console.log('Wind:', data.current.wind_kph, 'km/h');
      console.log('Visibility:', data.current.vis_km, 'km');
      console.log('\nFull Response:', JSON.stringify(data, null, 2));
    }
  })
  .catch(error => {
    console.error('❌ Network Error:', error.message);
    process.exit(1);
  });
