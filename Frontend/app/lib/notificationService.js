// Real-time notification service using WebSocket
class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Initialize WebSocket connection
  connect(userId, userRole) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket connection timeout, closing...');
        this.socket.close();
      }
    }, 10000); // 10 second timeout

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//localhost:5001/ws?userId=${userId}&role=${userRole}`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected for notifications');
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
        
        // Send authentication
        this.socket.send(JSON.stringify({
          type: 'auth',
          userId,
          userRole,
          timestamp: new Date().toISOString()
        }));
      };

      this.socket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('WebSocket received:', notification);
          this.notifyListeners(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.attemptReconnection(userId, userRole);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.log('WebSocket readyState:', this.socket?.readyState);
        console.log('WebSocket URL was:', wsUrl);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      console.log('This might be because:');
      console.log('1. Backend server is not running');
      console.log('2. WebSocket server is not properly configured');
      console.log('3. Network connectivity issues');
      console.log('Notifications will still work via HTTP polling, but without real-time updates.');
      this.attemptReconnection(userId, userRole);
    }
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnection(userId, userRole) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      this.reconnectAttempts++;
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(userId, userRole);
      }, delay);
    } else {
      console.log('Max reconnection attempts reached. WebSocket functionality will be disabled.');
      console.log('Notifications will still work, but without real-time updates.');
    }
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Send notification (for testing or manual sending)
  sendNotification(notification) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(notification));
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Get connection status
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
