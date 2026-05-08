// Test API configuration
console.log('Environment VITE_API_URL:', process.env.VITE_API_URL);

// Test the API fetch function
import { apiFetch, API_BASE } from './src/api/config.js';

console.log('API_BASE:', API_BASE);

// Test API connection
apiFetch('/trips')
  .then(data => console.log('API Response:', data))
  .catch(error => console.error('API Error:', error.message));
