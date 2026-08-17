import {
  isBinanceTickerArray,
  isOkxTickerMessage,
  type CryptoQuote,
  type PriceDirection,
  type PriceUpdateCallback,
} from '../types/crypto.types';

const OKX_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public';
const BINANCE_WS_URL = 'wss://data-stream.binance.vision/ws/!miniTicker@arr';
const THROTTLE_MS = 500;
const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 10000;
const OKX_PING_INTERVAL_MS = 20000;
const FAILURES_BEFORE_FAILOVER = 3;

interface FeedVendor {
  readonly id: 'okx' | 'binance';
  readonly url: string;
}

const FEED_VENDORS: readonly FeedVendor[] = [
  { id: 'okx', url: OKX_WS_URL },
  { id: 'binance', url: BINANCE_WS_URL },
];

class CryptoWebSocketClient {
  private socket: WebSocket | null = null;
  private subscribers: Set<PriceUpdateCallback> = new Set();
  private trackedSymbols: Set<string> = new Set();
  private okxInstruments: Map<string, string> = new Map();
  private lastUpdateTimes: Map<string, number> = new Map();
  private lastPrices: Map<string, number> = new Map();
  private vendorIndex = 0;
  private vendorFailures = 0;
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;

  public connect(): void {
    this.clearReconnectTimer();
    const vendor = FEED_VENDORS[this.vendorIndex];
    try {
      this.socket = new WebSocket(vendor.url);
      this.setupSocketListeners(this.socket, vendor);
    } catch (error) {
      this.handleFeedFailure(error instanceof Error ? error : new Error('WS connection error'));
    }
  }

  public disconnect(): void {
    this.clearTimers();
    if (this.socket) {
      this.detachSocketListeners(this.socket);
      this.socket.close();
      this.socket = null;
    }
  }

  public subscribe(callback: PriceUpdateCallback): () => void {
    this.subscribers.add(callback);
    return (): void => {
      this.subscribers.delete(callback);
    };
  }

  public registerTrackedCoin(symbol: string, okxInstrumentId: string | null): void {
    this.trackedSymbols.add(symbol);
    if (okxInstrumentId) {
      this.okxInstruments.set(okxInstrumentId, symbol);
    }
  }

  public registerInitialPrice(symbol: string, price: number): void {
    this.lastPrices.set(symbol, price);
  }

  private setupSocketListeners(socket: WebSocket, vendor: FeedVendor): void {
    socket.onopen = (): void => {
      this.reconnectAttempt = 0;
      this.vendorFailures = 0;
      if (vendor.id === 'okx') {
        this.subscribeOkxInstruments(socket);
        this.startOkxPing(socket);
      }
    };
    socket.onmessage = (event: MessageEvent): void => {
      this.handleSocketMessage(event.data, vendor);
    };
    socket.onerror = (): void => {
      this.handleFeedFailure(new Error('WebSocket encountered an error'));
    };
    socket.onclose = (event: CloseEvent): void => {
      this.clearPingTimer();
      this.handleFeedFailure(new Error(event.reason || 'Socket closed'));
    };
  }

  private detachSocketListeners(socket: WebSocket): void {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
  }

  private subscribeOkxInstruments(socket: WebSocket): void {
    const args = [...this.okxInstruments.keys()].map((instId) => ({
      channel: 'tickers',
      instId,
    }));
    if (args.length > 0) {
      socket.send(JSON.stringify({ op: 'subscribe', args }));
    }
  }

  private startOkxPing(socket: WebSocket): void {
    this.clearPingTimer();
    this.pingTimer = window.setInterval((): void => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('ping');
      }
    }, OKX_PING_INTERVAL_MS);
  }

  private handleSocketMessage(rawData: unknown, vendor: FeedVendor): void {
    if (typeof rawData !== 'string' || rawData === 'pong') {
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawData);
    } catch {
      return;
    }

    if (vendor.id === 'okx') {
      this.processOkxPayload(payload);
    } else {
      this.processBinancePayload(payload);
    }
  }

  private processOkxPayload(payload: unknown): void {
    if (!isOkxTickerMessage(payload)) {
      return;
    }
    const symbol = this.okxInstruments.get(payload.arg.instId);
    if (!symbol) {
      return;
    }
    const price = Number(payload.data[0].last);
    if (Number.isFinite(price) && price > 0) {
      this.emitPriceUpdate(symbol, price);
    }
  }

  private processBinancePayload(payload: unknown): void {
    if (!isBinanceTickerArray(payload)) {
      return;
    }
    for (const ticker of payload) {
      const symbol = ticker.s.toUpperCase();
      if (!this.trackedSymbols.has(symbol)) {
        continue;
      }
      const price = Number.parseFloat(ticker.c);
      if (Number.isFinite(price) && price > 0) {
        this.emitPriceUpdate(symbol, price);
      }
    }
  }

  private emitPriceUpdate(symbol: string, price: number): void {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(symbol) ?? 0;
    if (now - lastUpdate < THROTTLE_MS) {
      return;
    }

    const previousPrice = this.lastPrices.get(symbol) ?? price;
    const quote: CryptoQuote = {
      symbol,
      price,
      previousPrice,
      direction: calculateDirection(price, previousPrice),
      updatedAt: now,
    };

    this.lastUpdateTimes.set(symbol, now);
    this.lastPrices.set(symbol, price);
    this.subscribers.forEach((callback): void => {
      callback(quote);
    });
  }

  private handleFeedFailure(reason: Error): void {
    if (this.reconnectTimer !== null) {
      return;
    }
    this.vendorFailures += 1;
    if (this.vendorFailures >= FAILURES_BEFORE_FAILOVER) {
      this.vendorFailures = 0;
      this.vendorIndex = (this.vendorIndex + 1) % FEED_VENDORS.length;
    }
    this.scheduleReconnect(reason);
  }

  private scheduleReconnect(reason: Error): void {
    const delay = Math.min(
      INITIAL_RECONNECT_MS * Math.pow(2, this.reconnectAttempt),
      MAX_RECONNECT_MS
    );
    this.reconnectAttempt += 1;
    console.warn(`Crypto feed lost (${reason.message}), reconnecting in ${delay}ms`);
    this.reconnectTimer = window.setTimeout((): void => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearPingTimer(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearTimers(): void {
    this.clearReconnectTimer();
    this.clearPingTimer();
  }
}

function calculateDirection(current: number, previous: number): PriceDirection {
  if (current > previous) {
    return 'up';
  }
  if (current < previous) {
    return 'down';
  }
  return 'neutral';
}

export const cryptoWS = new CryptoWebSocketClient();
