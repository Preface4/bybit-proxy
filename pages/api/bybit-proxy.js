import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';

// Функция для создания подписи
const generateSignature = (timestamp, params) => {
  // Сортируем параметры
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Формируем строку для подписи: timestamp + apiKey + params
  const stringToSign = `${timestamp}${BYBIT_API_KEY}${sortedParams}`;
  console.log('String to sign:', stringToSign);

  const signature = crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(stringToSign)
    .digest('hex');

  console.log('Generated signature:', signature);
  return signature;
};

export default async function handler(req, res) {
  try {
    const timestamp = Date.now().toString();
    console.log('Using timestamp:', timestamp);
    console.log('Query parameters:', req.query);

    // Генерируем подпись
    const signature = generateSignature(timestamp, req.query);

    // Формируем URL с параметрами
    const queryString = Object.entries(req.query)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${queryString}`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000',
        'Content-Type': 'application/json'
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