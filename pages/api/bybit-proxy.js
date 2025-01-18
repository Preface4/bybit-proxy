import crypto from 'crypto';

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

async function fetchWalletBalance() {
  const params = {
    accountType: 'CONTRACT'
  };
  
  const { signature, timestamp } = generateSignature(params);
  
  const response = await fetch(`${BYBIT_BASE_URL}/v5/account/wallet-balance?${new URLSearchParams(params)}`, {
    headers: {
      'X-BAPI-API-KEY': BYBIT_API_KEY,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW
    }
  });
  
  return await response.json();
}

async function fetchPositionInfo(symbol) {
  const params = {
    category: 'linear',
    symbol: symbol
  };
  
  const { signature, timestamp } = generateSignature(params);
  
  const response = await fetch(`${BYBIT_BASE_URL}/v5/position/list?${new URLSearchParams(params)}`, {
    headers: {
      'X-BAPI-API-KEY': BYBIT_API_KEY,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW
    }
  });
  
  return await response.json();
}

async function fetchClosedPnL(symbol) {
  const params = {
    category: 'linear',
    symbol: symbol,
    limit: 50
  };
  
  const { signature, timestamp } = generateSignature(params);
  
  const response = await fetch(`${BYBIT_BASE_URL}/v5/position/closed-pnl?${new URLSearchParams(params)}`, {
    headers: {
      'X-BAPI-API-KEY': BYBIT_API_KEY,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': RECV_WINDOW
    }
  });
  
  return await response.json();
}

export default async function handler(req, res) {
  try {
    // 1. Получаем историю сделок
    const { signature, timestamp, queryString } = generateSignature({
      ...req.query,
      limit: '50'
    });
    
    const tradesResponse = await fetch(`${BYBIT_BASE_URL}/v5/execution/list?${queryString}`, {
      headers: {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': RECV_WINDOW
      }
    });

    const tradesData = await tradesResponse.json();
    
    if (tradesData.result?.list?.length > 0) {
      // 2. Получаем баланс
      const balanceData = await fetchWalletBalance();
      
      // 3. Получаем информацию о позициях и PnL для каждого символа
      const uniqueSymbols = [...new Set(tradesData.result.list.map(trade => trade.symbol))];
      const [positionsData, pnlData] = await Promise.all([
        Promise.all(uniqueSymbols.map(symbol => fetchPositionInfo(symbol))),
        Promise.all(uniqueSymbols.map(symbol => fetchClosedPnL(symbol)))
      ]);
      
      res.status(200).json({
        trades: tradesData,
        balance: balanceData,
        positions: positionsData,
        pnl: pnlData
      });
    } else {
      res.status(200).json({
        trades: tradesData,
        balance: null,
        positions: [],
        pnl: []
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