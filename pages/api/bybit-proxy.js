import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com'; // Меняем на работающий эндпоинт

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
  console.log('Request received:', {
    method: req.method,
    query: req.query
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API Key:', BYBIT_API_KEY?.slice(0, 5) + '...');
    console.log('API Secret exists:', !!BYBIT_API_SECRET);
    
    // Получаем параметры запроса
    const timestamp = Date.now().toString();
    const parameters = {
      category: 'linear',
      limit: '1',
      timestamp
    };

    // Генерируем подпись
    const signature = generateSignature(parameters, BYBIT_API_SECRET);
    console.log('Generated signature:', signature);

    // Формируем URL для запроса к Bybit
    const queryString = Object.entries(parameters)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${queryString}`;
    console.log('Requesting Bybit URL:', url);

    // Выполняем запрос к Bybit
    const response = await fetch(url, {
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': '5000'
      }
    });

    if (!response.ok) {
      console.error('Bybit response not OK:', {
        status: response.status,
        statusText: response.statusText
      });
      const errorText = await response.text();
      console.error('Bybit error response:', errorText);
      throw new Error(`Bybit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Bybit response received');
    
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