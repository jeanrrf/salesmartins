console.log('API Error Logger Initialized');

// Monkey patch fetch to log API errors
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const url = args[0];
  if (url.includes('/api/')) {
    console.log('API Request:', url);
    try {
      const response = await originalFetch(...args);
      const clone = response.clone();
      try {
        const data = await clone.json();
        console.log('API Response:', data);
      } catch (e) {
        console.error('API Response is not valid JSON:', await clone.text());
      }
      return response;
    } catch (error) {
      console.error('API Request Failed:', error);
      throw error;
    }
  }
  return originalFetch(...args);
};