const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

class NotificationWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });
    
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract userId and role from query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const userId = url.searchParams.get('userId');
        const userRole = url.searchParams.get('role');

        if (!userId) {
          ws.close(4001, 'Missing userId');
          return;
        }

        console.log(`WebSocket connection established for user: ${userId} (${userRole})`);

        // Add client to the map
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId).add(ws);

        // Handle incoming messages
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            await this.handleMessage(ws, userId, data);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
          }
        });

        // Handle connection close
        ws.on('close', (code, reason) => {
          console.log(`WebSocket connection closed for user: ${userId}, code: ${code}, reason: ${reason}`);
          this.removeClient(userId, ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for user: ${userId}`, error);
          this.removeClient(userId, ws);
        });

        // Send connection success message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'WebSocket connection established',
          userId,
          timestamp: new Date().toISOString()
        }));

      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close(4000, 'Connection failed');
      }
    });

    console.log('WebSocket server initialized');
  }

  async handleMessage(ws, userId, data) {
    switch (data.type) {
      case 'auth':
        // Handle authentication if needed
        console.log(`User ${userId} authenticated via WebSocket`);
        break;
        
      case 'ping':
        // Handle ping/pong for connection health
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  removeClient(userId, ws) {
    const clientSet = this.clients.get(userId);
    if (clientSet) {
      clientSet.delete(ws);
      if (clientSet.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  // Send notification to a specific user
  sendToUser(userId, notification) {
    const clientSet = this.clients.get(userId);
    if (clientSet && clientSet.size > 0) {
      const message = JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      });

      clientSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
            console.log(`Notification sent to user: ${userId}`);
          } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
            this.removeClient(userId, ws);
          }
        } else {
          this.removeClient(userId, ws);
        }
      });

      return true; // Notification sent
    }
    return false; // User not connected
  }

  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    const results = {};
    userIds.forEach(userId => {
      results[userId] = this.sendToUser(userId, notification);
    });
    return results;
  }

  // Broadcast to all connected clients (admin function)
  broadcast(notification) {
    const message = JSON.stringify({
      type: 'broadcast',
      data: notification,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    this.clients.forEach((clientSet, userId) => {
      clientSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            console.error(`Error broadcasting to user ${userId}:`, error);
            this.removeClient(userId, ws);
          }
        }
      });
    });

    console.log(`Broadcast sent to ${sentCount} connections`);
    return sentCount;
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.clients.size;
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  // Close all connections
  closeAllConnections() {
    this.clients.forEach((clientSet, userId) => {
      clientSet.forEach(ws => {
        ws.close(1000, 'Server shutdown');
      });
    });
    this.clients.clear();
  }
}

module.exports = NotificationWebSocketServer;
