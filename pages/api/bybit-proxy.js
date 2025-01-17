export default async function handler(req, res) {
  console.log('Starting basic test...');

  try {
    // Пробуем разные эндпоинты
    const endpoints = [
      'https://api.bybit.ph',
      'https://api-v5.bybit.com',
      'https://api.bytick.com'
    ];

    for (const url of endpoints) {
      console.log(`Testing endpoint: ${url}`);
      try {
        const response = await fetch(url);
        const status = response.status;
        const text = await response.text();
        console.log(`Response from ${url}:`, { status, text });
      } catch (error) {
        console.log(`Error for ${url}:`, error.message);
      }
    }

    res.status(200).json({ message: 'Test completed, check logs' });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: error.message });
  }
}