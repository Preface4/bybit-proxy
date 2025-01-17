// Убираем импорт fetch, так как он встроен в Node.js
export default async function handler(req, res) {
  console.log('Starting basic test...');

  try {
    // Пробуем разные эндпоинты
    const endpoints = [
      'https://api.bybit.ph',
      'https://api-v5.bybit.com',
      'https://api.bytick.com'
    ];

    const results = {};

    for (const url of endpoints) {
      console.log(`Testing endpoint: ${url}`);
      try {
        const response = await fetch(url);
        const status = response.status;
        let body = 'Unable to get body';
        try {
          body = await response.text();
        } catch (e) {
          console.log(`Error getting body from ${url}:`, e.message);
        }
        results[url] = { status, body };
        console.log(`Success for ${url}:`, { status });
      } catch (error) {
        console.log(`Error for ${url}:`, error.message);
        results[url] = { error: error.message };
      }
    }

    res.status(200).json({
      message: 'Test completed',
      results
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}