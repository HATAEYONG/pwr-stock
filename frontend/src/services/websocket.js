/**
 * WebSocket Service for Real-time Data Updates
 * Handles WebSocket connections for live price updates and market data
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.isManualClose = false;
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket URL (default from env)
   */
  connect(url = null) {
    const wsUrl = url || import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/market/';

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isManualClose = false;

        // Send initial subscription message
        this.send({
          type: 'subscribe',
          channels: ['prices', 'ohlcv', 'signals']
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (!this.isManualClose) {
          this.reconnect();
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Reconnect to WebSocket server
   */
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Send message to WebSocket server
   * @param {object} data - Data to send
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected. Message not sent:', data);
    }
  }

  /**
   * Subscribe to specific symbol updates
   * @param {string} symbol - Symbol code
   * @param {string} channel - Channel name (prices, ohlcv, signals)
   */
  subscribe(symbol, channel = 'prices') {
    this.send({
      type: 'subscribe_symbol',
      symbol: symbol,
      channel: channel
    });
  }

  /**
   * Unsubscribe from specific symbol updates
   * @param {string} symbol - Symbol code
   * @param {string} channel - Channel name
   */
  unsubscribe(symbol, channel = 'prices') {
    this.send({
      type: 'unsubscribe_symbol',
      symbol: symbol,
      channel: channel
    });
  }

  /**
   * Add event listener for specific message type
   * @param {string} eventType - Event type (price_update, ohlcv_update, signal, etc.)
   * @param {function} callback - Callback function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {function} callback - Callback function to remove
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param {object} data - Parsed message data
   */
  handleMessage(data) {
    const { type, payload } = data;

    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in ${type} callback:`, error);
        }
      });
    }

    // Also trigger generic 'message' listeners
    if (this.listeners.has('message')) {
      this.listeners.get('message').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    }
  }

  /**
   * Get connection state
   * @returns {string} - Connection state
   */
  getState() {
    if (!this.ws) return 'DISCONNECTED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
