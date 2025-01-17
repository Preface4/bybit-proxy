// pages/api/bybit-proxy.js
import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bybit.ph';

// Функция для создания подписи
const generateSignature = (parameters, secret) => {
  const sortedParams = Object.keys(parameters)
    .sort()
    .reduce((acc, key) => {
      acc[key] = parameters[key];
      return acc;
    }, {});

  const queryString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex');
};

export default async function handler(req, res) {
  console.log('Received request:', {
    method: req.method,
    query: req.query,
    headers: req.headers
  });
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем параметры запроса
    const timestamp = Date.now().toString();
    const parameters = {
      ...req.query,
      timestamp
    };

    // Генерируем подпись
    const signature = generateSignature(parameters, BYBIT_API_SECRET);

    // Формируем URL для запроса к Bybit
    const queryString = Object.entries(parameters)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    const url = `${BYBIT_BASE_URL}${req.query.endpoint}?${queryString}`;

    // Выполняем запрос к Bybit
    const response = await fetch(url, {
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000'
      }
    });

    const data = await response.json();
    
    // Возвращаем результат
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    });
  }
}