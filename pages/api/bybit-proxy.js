import crypto from 'crypto';

// Конфигурация
const BYBIT_API_KEY = process.env.BYBIT_API_KEY;
const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET;
const BYBIT_BASE_URL = 'https://api.bytick.com';
const RECV_WINDOW = '5000';

const generateSignature = (params) => {
  const timestamp = Date.now().toString();
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const signString = `${timestamp}${BYBIT_API_KEY}${RECV_WINDOW}${queryString}`;
  
  const signature = crypto
    .createHmac('sha256', BYBIT_API_SECRET)
    .update(signString)
    .digest('hex');

  return { signature, timestamp, queryString };
};

async function fetchPositionInfo(symbol) {
  const posParams = {
    category: 'linear',
    symbol: symbol
  };
  
  const { signature: posSignature, timestamp: posTimestamp } = generateSignature(posParams);
  
  const posResponse = await fetch(`${BYBIT_BASE_URL}/v5/position/list?${new URLSearchParams(posParams)}`, {
    headers: {
      'X-BAPI-API-KEY': BYBIT_API_KEY,
      'X-BAPI-SIGN': posSignature,
      'X-BAPI-TIMESTAMP': posTimestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW
    }
  });
  
  return await posResponse.json();
}

export default async function handler(req, res) {
  try {
    // Получаем историю сделок
    const { signature, timestamp, queryString } = generateSignature({
      ...req.query,
      limit: '50'  // Увеличим лимит для получения большей истории
    });
    
    const tradesUrl = `${BYBIT_BASE_URL}/v5/execution/list?${queryString}`;
    const tradesResponse = await fetch(tradesUrl, {
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': RECV_WINDOW
      }
    });

    const tradesData = await tradesResponse.json();
    
    // Если есть сделки, получим информацию о текущих позициях
    if (tradesData.result?.list?.length > 0) {
      const uniqueSymbols = [...new Set(tradesData.result.list.map(trade => trade.symbol))];
      const positionsData = await Promise.all(
        uniqueSymbols.map(symbol => fetchPositionInfo(symbol))
      );
      
      res.status(200).json({
        trades: tradesData,
        positions: positionsData
      });
    } else {
      res.status(200).json({
        trades: tradesData,
        positions: []
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}