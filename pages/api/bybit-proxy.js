import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';

const generateSignature = (params) => {
  // 1. Получаем текущий timestamp
  const timestamp = Date.now().toString();
  
  // 2. Сортируем параметры запроса
  const sortedParams = Object.entries({
    ...params,
    api_key: BYBIT_API_KEY,
    timestamp: timestamp
  })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  console.log('Sorted params:', sortedParams);
  
  // 3. Генерируем подпись
  const signature = crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(sortedParams)
    .digest('hex');

  return { signature, timestamp, sortedParams };
};

export default async function handler(req, res) {
  try {
    console.log('Request query:', req.query);
    
    // Генерируем подпись и получаем параметры
    const { signature, timestamp, sortedParams } = generateSignature(req.query);
    console.log('Generated signature:', signature);
    console.log('Using timestamp:', timestamp);
    
    // Формируем URL с теми же параметрами
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${sortedParams}`;
    console.log('Final URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000'
      }
    });

    const data = await response.json();
    console.log('Response:', data);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}