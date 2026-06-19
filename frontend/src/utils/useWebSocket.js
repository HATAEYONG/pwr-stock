/**
 * Custom React Hook for WebSocket Integration
 * Provides real-time data updates to React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import wsService from '../services/websocket';

/**
 * Hook for WebSocket connection and real-time updates
 * @param {object} options - Configuration options
 * @returns {object} - WebSocket state and methods
 */
export const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    subscriptions = [],
    onMessage = null,
    onError = null
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  const callbacksRef = useRef({
    onMessage,
    onError
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = { onMessage, onError };
  }, [onMessage, onError]);

  // Connect to WebSocket
  useEffect(() => {
    if (autoConnect) {
      wsService.connect();

      // Set up connection state listener
      const checkConnection = () => {
        const state = wsService.getState();
        setConnectionState(state);
        setIsConnected(wsService.isConnected());
      };

      const connectionInterval = setInterval(checkConnection, 1000);

      // Set up message listener
      const handleMessage = (data) => {
        setLastMessage({ ...data, timestamp: Date.now() });

        if (callbacksRef.current.onMessage) {
          callbacksRef.current.onMessage(data);
        }
      };

      // Set up error listener
      const handleError = (err) => {
        setError(err);

        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(err);
        }
      };

      wsService.on('message', handleMessage);
      wsService.on('error', handleError);

      return () => {
        clearInterval(connectionInterval);
        wsService.off('message', handleMessage);
        wsService.off('error', handleError);
      };
    }
  }, [autoConnect]);

  // Subscribe to symbols
  useEffect(() => {
    if (isConnected && subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        wsService.subscribe(sub.symbol, sub.channel);
      });

      return () => {
        subscriptions.forEach(sub => {
          wsService.unsubscribe(sub.symbol, sub.channel);
        });
      };
    }
  }, [isConnected, subscriptions]);

  const sendMessage = useCallback((data) => {
    wsService.send(data);
  }, []);

  const subscribe = useCallback((symbol, channel) => {
    wsService.subscribe(symbol, channel);
  }, []);

  const unsubscribe = useCallback((symbol, channel) => {
    wsService.unsubscribe(symbol, channel);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    wsService.connect();
  }, []);

  return {
    isConnected,
    connectionState,
    lastMessage,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect
  };
};

/**
 * Hook for real-time price updates
 * @param {string} symbol - Symbol code
 * @returns {object} - Price data and status
 */
export const useRealTimePrice = (symbol) => {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const handlePriceUpdate = (data) => {
      if (data.symbol === symbol) {
        setPrevPrice(price);
        setPrice(data.price);

        const priceChange = data.price - (data.prev_close || price);
        setChange(priceChange);
        setChangePercent((priceChange / (data.prev_close || price)) * 100);
        setLastUpdate(new Date());
      }
    };

    wsService.on('price_update', handlePriceUpdate);

    if (symbol) {
      wsService.subscribe(symbol, 'prices');
    }

    return () => {
      wsService.off('price_update', handlePriceUpdate);
      if (symbol) {
        wsService.unsubscribe(symbol, 'prices');
      }
    };
  }, [symbol, price]);

  return {
    price,
    prevPrice,
    change,
    changePercent,
    lastUpdate,
    isUp: change > 0,
    isDown: change < 0
  };
};

/**
 * Hook for real-time OHLCV updates
 * @param {string} symbol - Symbol code
 * @returns {object} - OHLCV data and status
 */
export const useRealTimeOHLCV = (symbol) => {
  const [ohlcv, setOhlcv] = useState(null);
  const [candles, setCandles] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const handleOHLCVUpdate = (data) => {
      if (data.symbol === symbol) {
        setOhlcv(data.ohlcv);
        setCandles(prev => {
          const newCandles = [...prev, data.ohlcv];
          // Keep last 100 candles
          return newCandles.slice(-100);
        });
        setLastUpdate(new Date());
      }
    };

    wsService.on('ohlcv_update', handleOHLCVUpdate);

    if (symbol) {
      wsService.subscribe(symbol, 'ohlcv');
    }

    return () => {
      wsService.off('ohlcv_update', handleOHLCVUpdate);
      if (symbol) {
        wsService.unsubscribe(symbol, 'ohlcv');
      }
    };
  }, [symbol]);

  return {
    ohlcv,
    candles,
    lastUpdate
  };
};

/**
 * Hook for real-time trading signals
 * @returns {object} - Signals and status
 */
export const useRealTimeSignals = () => {
  const [signals, setSignals] = useState([]);
  const [lastSignal, setLastSignal] = useState(null);

  useEffect(() => {
    const handleSignal = (data) => {
      setLastSignal(data);
      setSignals(prev => [data, ...prev].slice(0, 50)); // Keep last 50 signals
    };

    wsService.on('signal', handleSignal);

    return () => {
      wsService.off('signal', handleSignal);
    };
  }, []);

  return {
    signals,
    lastSignal,
    clearSignals: () => setSignals([])
  };
};

export default useWebSocket;
