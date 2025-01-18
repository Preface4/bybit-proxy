import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';

// Функция для создания подписи
const generateSignature = (parameters, secret) => {
  // Преобразуем параметры в строку для подписи
  const timestamp = Date.now().toString();
  const params = {
    ...parameters,
    timestamp
  };
  
  const orderedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  console.log('Ordered params for signature:', orderedParams);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(orderedParams)
    .digest('hex');
  
  console.log('Generated signature:', signature);
  
  return {
    signature,
    timestamp,
    orderedParams
  };
};

export default async function handler(req, res) {
  try {
    const { signature, timestamp, orderedParams } = generateSignature(req.query, BYBIT_API_SECRET);
    
    console.log('Making request with:');
    console.log('API Key:', BYBIT_API_KEY);
    console.log('Timestamp:', timestamp);
    console.log('Signature:', signature);
    
    const url = `${BYBIT_BASE_URL}/v5/execution/list?${orderedParams}`;
    console.log('Request URL:', url);

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