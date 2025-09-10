import React from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketCallbacks {
  onOpen?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private userType: "user" | "guardian" | "emergency_service" = "user";

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }

  connect(callbacks: WebSocketCallbacks = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    this.callbacks = callbacks;
    const wsUrl = this.getWebSocketUrl();
    
    console.log("Connecting to WebSocket:", wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected successfully");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.startHeartbeat();
      
      if (this.callbacks.onOpen) {
        this.callbacks.onOpen();
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log("WebSocket message received:", message.type);
        
        // Handle internal message types
        if (message.type === 'pong') {
          console.log("Received pong from server");
          return;
        }
        
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(message);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      this.stopHeartbeat();
      
      if (this.callbacks.onClose) {
        this.callbacks.onClose();
      }
      
      // Attempt to reconnect if not manually closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    };
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect(this.callbacks);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  authenticate(userId: string, userType: "user" | "guardian" | "emergency_service" = "user"): void {
    this.userId = userId;
    this.userType = userType;
    
    this.send({
      type: 'authenticate',
      userId,
      userType
    });
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log("WebSocket message sent:", message.type);
      } catch (error) {
        console.error("Failed to send WebSocket message:", error);
      }
    } else {
      console.warn("Cannot send message: WebSocket not connected", {
        readyState: this.ws?.readyState,
        message: message.type
      });
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }
    
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return "CLOSED";
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }

  // Utility methods for specific message types
  sendLocationUpdate(lat: number, lng: number, accuracy?: number, motionPattern?: string): void {
    this.send({
      type: 'location_update',
      lat,
      lng,
      accuracy,
      motionPattern: motionPattern || 'normal'
    });
  }

  sendBiometricUpdate(heartRate?: number, stressLevel?: string, motionPattern?: string): void {
    this.send({
      type: 'biometric_update',
      heartRate,
      stressLevel,
      motionPattern
    });
  }

  sendEmergencyResponse(alertId: string, guardianId: string, responseType: string, notes?: string): void {
    this.send({
      type: 'emergency_response',
      alertId,
      guardianId,
      responseType,
      notes
    });
  }

  updateGuardianStatus(isActive: boolean, location?: { lat: number; lng: number }): void {
    this.send({
      type: 'guardian_status',
      isActive,
      location
    });
  }
}

// Create singleton instance
export const webSocketManager = new WebSocketManager();

// React hook for WebSocket connection
export function useWebSocketConnection(userId?: string, userType: "user" | "guardian" | "emergency_service" = "user") {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState("CLOSED");
  const [lastMessage, setLastMessage] = React.useState<WebSocketMessage | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const callbacks: WebSocketCallbacks = {
      onOpen: () => {
        setIsConnected(true);
        setConnectionState("OPEN");
        setError(null);
        
        if (userId) {
          webSocketManager.authenticate(userId, userType);
        }
      },
      onMessage: (message) => {
        setLastMessage(message);
        
        if (message.type === 'auth_error') {
          setError(message.message);
        }
      },
      onClose: () => {
        setIsConnected(false);
        setConnectionState("CLOSED");
      },
      onError: () => {
        setError("WebSocket connection error");
        setConnectionState("ERROR");
      }
    };

    webSocketManager.connect(callbacks);

    return () => {
      webSocketManager.disconnect();
    };
  }, [userId, userType]);

  const sendMessage = React.useCallback((message: WebSocketMessage) => {
    webSocketManager.send(message);
  }, []);

  return {
    isConnected,
    connectionState,
    lastMessage,
    error,
    sendMessage,
    webSocketManager
  };
}

export default webSocketManager;
