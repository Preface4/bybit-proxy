import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';
const RECV_WINDOW = '5000';

const generateSignature = (params) => {
  // 1. Получаем timestamp
  const timestamp = Date.now().toString();
  
  // 2. Сортируем параметры запроса
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. Формируем строку для подписи: timestamp + apiKey + recv_window + queryString
  const signString = `${timestamp}${BYBIT_API_KEY}${RECV_WINDOW}${queryString}`;
  console.log('String to sign:', signString);
  
  // 4. Генерируем подпись
  const signature = crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(signString)
    .digest('hex');

  return { signature, timestamp, queryString };
};

export default async function handler(req, res) {
  try {
    console.log('Request query:', req.query);
    
    // Генерируем подпись и получаем параметры
    const { signature, timestamp, queryString } = generateSignature(req.query);
    console.log('Generated signature:', signature);
    console.log('Using timestamp:', timestamp);
    
    // Формируем URL с параметрами запроса
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${queryString}`;
    console.log('Final URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': RECV_WINDOW
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