export type PriceDirection = 'up' | 'down' | 'neutral';

export type OrbitSide = 'left' | 'right';

export interface CryptoCoinConfig {
  readonly id: string;
  readonly name: string;
  readonly symbol: string;
  readonly okxInstrumentId: string | null;
  readonly icon: string;
  readonly defaultPrice: number;
  readonly decimals: number;
  readonly side: OrbitSide;
}

export interface CryptoQuote {
  symbol: string;
  price: number;
  previousPrice: number;
  direction: PriceDirection;
  updatedAt: number;
}

export type PriceUpdateCallback = (quote: CryptoQuote) => void;

export interface OkxTickerMessage {
  readonly arg: { readonly channel: string; readonly instId: string };
  readonly data: readonly { readonly last: string }[];
}

export interface BinanceMiniTickerItem {
  readonly s: string;
  readonly c: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isOkxTickerMessage(payload: unknown): payload is OkxTickerMessage {
  if (!isRecord(payload) || !isRecord(payload.arg) || !Array.isArray(payload.data)) {
    return false;
  }
  const arg = payload.arg;
  if (arg.channel !== 'tickers' || typeof arg.instId !== 'string') {
    return false;
  }
  return payload.data.every(
    (item: unknown): boolean => isRecord(item) && typeof item.last === 'string'
  );
}

export function isBinanceTickerArray(payload: unknown): payload is BinanceMiniTickerItem[] {
  if (!Array.isArray(payload)) {
    return false;
  }
  for (const item of payload) {
    if (!isRecord(item) || typeof item.s !== 'string' || typeof item.c !== 'string') {
      return false;
    }
  }
  return true;
}

export const ORBIT_COINS: readonly CryptoCoinConfig[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTCUSDT',
    okxInstrumentId: 'BTC-USDT',
    icon: './assets/icons/btc.svg',
    defaultPrice: 87965.62,
    decimals: 2,
    side: 'left',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETHUSDT',
    okxInstrumentId: 'ETH-USDT',
    icon: './assets/icons/eth.svg',
    defaultPrice: 2950.04,
    decimals: 2,
    side: 'left',
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOLUSDT',
    okxInstrumentId: 'SOL-USDT',
    icon: './assets/icons/sol.svg',
    defaultPrice: 124.53,
    decimals: 2,
    side: 'left',
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRPUSDT',
    okxInstrumentId: 'XRP-USDT',
    icon: './assets/icons/xrp.svg',
    defaultPrice: 1.862,
    decimals: 3,
    side: 'left',
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDCUSDT',
    okxInstrumentId: 'USDC-USDT',
    icon: './assets/icons/usdc.svg',
    defaultPrice: 0.9997,
    decimals: 4,
    side: 'left',
  },
  {
    id: 'bnb',
    name: 'Binance Coin',
    symbol: 'BNBUSDT',
    okxInstrumentId: 'BNB-USDT',
    icon: './assets/icons/bnb.svg',
    defaultPrice: 844.91,
    decimals: 2,
    side: 'right',
  },
  {
    id: 'night',
    name: 'Midnight',
    symbol: 'NIGHTUSDT',
    okxInstrumentId: 'NIGHT-USDT',
    icon: './assets/icons/night.svg',
    defaultPrice: 0.06398,
    decimals: 5,
    side: 'right',
  },
  {
    id: 'doge',
    name: 'Dogecoin',
    symbol: 'DOGEUSDT',
    okxInstrumentId: 'DOGE-USDT',
    icon: './assets/icons/doge.svg',
    defaultPrice: 0.1278,
    decimals: 4,
    side: 'right',
  },
  {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUIUSDT',
    okxInstrumentId: 'SUI-USDT',
    icon: './assets/icons/sui.svg',
    defaultPrice: 1.427,
    decimals: 3,
    side: 'right',
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    okxInstrumentId: null,
    icon: './assets/icons/usdt.svg',
    defaultPrice: 1.0,
    decimals: 3,
    side: 'right',
  },
];

const CATALOG_COIN_IDS: readonly string[] = ['usdc', 'bnb', 'usdt', 'sol'];

export const CATALOG_COINS: readonly CryptoCoinConfig[] = CATALOG_COIN_IDS.map(
  (coinId): CryptoCoinConfig => {
    const coin = ORBIT_COINS.find((item): boolean => item.id === coinId);
    if (!coin) {
      throw new Error(`Unknown catalog coin id: ${coinId}`);
    }
    return coin;
  }
);
