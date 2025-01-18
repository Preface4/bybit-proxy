import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';

// Функция для создания подписи
const generateSignature = (timestamp, params) => {
  // Сортируем параметры и формируем строку
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Строка для подписи
  const stringToSign = `${timestamp}${BYBIT_API_KEY}${sortedParams}`;
  console.log('Params for signature:', sortedParams);
  console.log('Full string to sign:', stringToSign);

  const signature = crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(stringToSign)
    .digest('hex');

  return { signature, sortedParams };
};

export default async function handler(req, res) {
  try {
    const timestamp = Date.now().toString();
    console.log('Timestamp:', timestamp);
    console.log('Original query:', req.query);

    // Генерируем подпись и получаем отсортированные параметры
    const { signature, sortedParams } = generateSignature(timestamp, req.query);
    console.log('Generated signature:', signature);

    // Используем те же отсортированные параметры для URL
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${sortedParams}`;
    console.log('Final URL:', url);

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