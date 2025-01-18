import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';

// Функция для создания подписи
const generateSignature = (parameters, secret) => {
  // Удаляем api_key из параметров для подписи
  const { api_key, ...otherParams } = parameters;
  
  const sortedParams = Object.keys(otherParams)
    .sort()
    .reduce((acc, key) => {
      acc[key] = otherParams[key];
      return acc;
    }, {});

  const queryString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  console.log('Query string for signature:', queryString);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(queryString)
    .digest('hex');
    
  console.log('Generated signature:', signature);
  return signature;
};

export default async function handler(req, res) {
  console.log('Request received with query:', req.query);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${queryString}`;
    console.log('Final URL:', url);

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
    console.log('Bybit response:', data);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}