import { useState, useEffect, useRef, useCallback } from "react";
import { webSocketManager } from "@/lib/websocket";

interface BiometricData {
  heartRate: number;
  stressLevel: "low" | "normal" | "elevated" | "high" | "critical";
  motionPattern: string;
  timestamp: string;
  location?: { lat: number; lng: number };
}

interface EmergencyAlert {
  type: string;
  alertId: string;
  userId: string;
  userName: string;
  alertType: string;
  priority: string;
  location: { lat: number; lng: number; address?: string };
  timestamp: string;
}

interface GuardianResponse {
  type: string;
  alertId: string;
  guardianId: string;
  responseType: "accepted" | "declined" | "arrived" | "completed";
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback((userId?: string, userType: "user" | "guardian" | "emergency_service" = "user") => {
    try {
      setConnectionStatus("connecting");
      setError(null);

      webSocketManager.connect({
        onOpen: () => {
          setIsConnected(true);
          setConnectionStatus("connected");
          reconnectAttemptsRef.current = 0;
          
          // Authenticate after connection
          if (userId) {
            webSocketManager.authenticate(userId, userType);
          }
        },
        onMessage: (message: WebSocketMessage) => {
          setLastMessage(message);
          
          // Handle specific message types
          switch (message.type) {
            case "authenticated":
              console.log("WebSocket authenticated successfully");
              break;
            case "auth_error":
              setError(`Authentication failed: ${message.message}`);
              break;
            case "emergency_alert":
              console.log("Emergency alert received:", message);
              break;
            case "guardian_response":
              console.log("Guardian response received:", message);
              break;
            case "biometric_received":
              console.log("Biometric data acknowledged");
              break;
            case "error":
              setError(message.message);
              break;
          }
        },
        onClose: () => {
          setIsConnected(false);
          setConnectionStatus("disconnected");
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // 1s, 2s, 4s, 8s, 16s
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect(userId, userType);
            }, delay);
          } else {
            setConnectionStatus("error");
            setError("Failed to connect after multiple attempts");
          }
        },
        onError: (error: Event) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("error");
          setError("WebSocket connection error");
        }
      });
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setConnectionStatus("error");
      setError("Failed to initialize WebSocket connection");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    webSocketManager.disconnect();
    setIsConnected(false);
    setConnectionStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (isConnected) {
      webSocketManager.send(message);
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      webSocketManager.disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage
  };
}

export function useBiometricData() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const [latestBiometric, setLatestBiometric] = useState<BiometricData | null>(null);

  // Listen for biometric-related messages
  useEffect(() => {
    if (lastMessage?.type === "biometric_update") {
      setLatestBiometric(lastMessage.data);
    }
  }, [lastMessage]);

  const sendBiometricData = useCallback((data: Omit<BiometricData, "timestamp">) => {
    sendMessage({
      type: "biometric_update",
      ...data,
      timestamp: new Date().toISOString()
    });
  }, [sendMessage]);

  const sendLocationUpdate = useCallback((location: { lat: number; lng: number; accuracy?: number }, motionPattern: string = "normal") => {
    sendMessage({
      type: "location_update",
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      motionPattern
    });
  }, [sendMessage]);

  return {
    latestBiometric,
    isConnected,
    sendBiometricData,
    sendLocationUpdate
  };
}

export function useEmergencyAlerts() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [guardianResponses, setGuardianResponses] = useState<GuardianResponse[]>([]);

  // Listen for emergency-related messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "emergency_alert":
        setActiveAlerts(prev => {
          const exists = prev.find(alert => alert.alertId === lastMessage.alertId);
          if (!exists) {
            return [...prev, lastMessage as EmergencyAlert];
          }
          return prev;
        });
        break;
      
      case "guardian_response":
        setGuardianResponses(prev => [...prev, lastMessage as GuardianResponse]);
        break;
      
      case "emergency_resolved":
        setActiveAlerts(prev => prev.filter(alert => alert.alertId !== lastMessage.alertId));
        break;
    }
  }, [lastMessage]);

  const respondToEmergency = useCallback((alertId: string, guardianId: string, responseType: "accepted" | "declined", notes?: string) => {
    sendMessage({
      type: "emergency_response",
      alertId,
      guardianId,
      responseType,
      notes
    });
  }, [sendMessage]);

  const updateGuardianStatus = useCallback((isActive: boolean, location?: { lat: number; lng: number }) => {
    sendMessage({
      type: "guardian_status",
      isActive,
      location
    });
  }, [sendMessage]);

  return {
    activeAlerts,
    guardianResponses,
    isConnected,
    respondToEmergency,
    updateGuardianStatus
  };
}
