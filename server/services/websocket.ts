import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { storage } from "../storage";

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  userType: "user" | "guardian" | "emergency_service";
  location?: { lat: number; lng: number };
  lastPing: number;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, ConnectedClient>();
  private pingInterval: NodeJS.Timeout | null = null;

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      const client: ConnectedClient = {
        ws,
        userType: "user",
        lastPing: Date.now()
      };
      
      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(clientId, message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
          this.sendToClient(clientId, { 
            type: 'error', 
            message: 'Invalid message format' 
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send connection confirmation
      this.sendToClient(clientId, { 
        type: 'connected', 
        clientId,
        timestamp: new Date() 
      });
    });

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000); // 30 seconds

    console.log('WebSocket server initialized on /ws');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'authenticate':
        await this.handleAuthentication(clientId, message);
        break;
      
      case 'location_update':
        await this.handleLocationUpdate(clientId, message);
        break;
      
      case 'biometric_update':
        await this.handleBiometricUpdate(clientId, message);
        break;
      
      case 'emergency_response':
        await this.handleEmergencyResponse(clientId, message);
        break;
      
      case 'guardian_status':
        await this.handleGuardianStatus(clientId, message);
        break;
      
      case 'ping':
        client.lastPing = Date.now();
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date() });
        break;
      
      default:
        console.log(`Unknown message type from ${clientId}:`, message.type);
    }
  }

  private async handleAuthentication(clientId: string, message: any) {
    try {
      const { userId, userType } = message;
      const client = this.clients.get(clientId);
      
      if (!client) return;

      // Verify user exists
      if (userId) {
        const user = await storage.getUser(userId);
        if (!user) {
          this.sendToClient(clientId, { 
            type: 'auth_error', 
            message: 'User not found' 
          });
          return;
        }
        
        client.userId = userId;
      }
      
      client.userType = userType || "user";
      
      this.sendToClient(clientId, { 
        type: 'authenticated', 
        userId,
        userType: client.userType,
        timestamp: new Date()
      });
      
      console.log(`Client ${clientId} authenticated as ${client.userType} (user: ${userId})`);
      
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendToClient(clientId, { 
        type: 'auth_error', 
        message: 'Authentication failed' 
      });
    }
  }

  private async handleLocationUpdate(clientId: string, message: any) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.userId) return;

      const { lat, lng, accuracy } = message;
      client.location = { lat, lng };
      
      // Store location for safety monitoring
      if (client.userId) {
        await storage.addBiometricData({
          userId: client.userId,
          location: { lat, lng, accuracy },
          motionPattern: message.motionPattern || "normal",
          heartRate: null,
          stressLevel: null,
          bloodPressure: null,
          temperature: null,
        });
      }
      
      // Check for safety zones
      // TODO: Implement safety zone checking logic
      
      this.sendToClient(clientId, { 
        type: 'location_received', 
        timestamp: new Date() 
      });
      
    } catch (error) {
      console.error('Location update error:', error);
    }
  }

  private async handleBiometricUpdate(clientId: string, message: any) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.userId) return;

      const { heartRate, stressLevel, motionPattern } = message;
      
      await storage.addBiometricData({
        userId: client.userId,
        heartRate,
        stressLevel,
        motionPattern,
        location: client.location,
        bloodPressure: null,
        temperature: null,
      });
      
      // TODO: Analyze biometric data for anomalies
      // If anomalies detected, trigger emergency protocols
      
      this.sendToClient(clientId, { 
        type: 'biometric_received', 
        timestamp: new Date() 
      });
      
    } catch (error) {
      console.error('Biometric update error:', error);
    }
  }

  private async handleEmergencyResponse(clientId: string, message: any) {
    try {
      const { alertId, guardianId, responseType, notes } = message;
      
      // TODO: Process emergency response
      // Update guardian response in database
      // Notify relevant parties
      
      this.broadcastToClients({
        type: 'emergency_update',
        alertId,
        guardianId,
        responseType,
        timestamp: new Date()
      }, 'emergency_service');
      
    } catch (error) {
      console.error('Emergency response error:', error);
    }
  }

  private async handleGuardianStatus(clientId: string, message: any) {
    try {
      const client = this.clients.get(clientId);
      if (!client || !client.userId) return;

      const { isActive, location } = message;
      
      // Update guardian status
      const guardian = await storage.getGuardianByUserId(client.userId);
      if (guardian) {
        await storage.updateGuardianStatus(guardian.id, isActive);
        
        if (location) {
          client.location = location;
        }
      }
      
      this.sendToClient(clientId, { 
        type: 'guardian_status_updated', 
        isActive,
        timestamp: new Date() 
      });
      
    } catch (error) {
      console.error('Guardian status error:', error);
    }
  }

  private pingClients() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout
    
    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > timeout) {
        console.log(`Client ${clientId} timed out, removing`);
        client.ws.terminate();
        this.clients.delete(clientId);
      } else if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    }
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  private broadcastToClients(data: any, userType?: string) {
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!userType || client.userType === userType) {
          client.ws.send(JSON.stringify(data));
        }
      }
    }
  }

  public broadcastEmergencyAlert(alertData: any) {
    this.broadcastToClients({
      type: 'emergency_alert',
      ...alertData,
      timestamp: new Date()
    });
  }

  public broadcastToNearbyGuardians(location: { lat: number; lng: number }, data: any, radiusKm = 10) {
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN && 
          client.userType === 'guardian' && 
          client.location) {
        
        const distance = this.calculateDistance(
          location.lat, location.lng,
          client.location.lat, client.location.lng
        );
        
        if (distance <= radiusKm) {
          client.ws.send(JSON.stringify({
            ...data,
            distance,
            timestamp: new Date()
          }));
        }
      }
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  public getConnectedClients(): { total: number; users: number; guardians: number; emergency: number } {
    let users = 0, guardians = 0, emergency = 0;
    
    for (const client of this.clients.values()) {
      switch (client.userType) {
        case 'user': users++; break;
        case 'guardian': guardians++; break;
        case 'emergency_service': emergency++; break;
      }
    }
    
    return {
      total: this.clients.size,
      users,
      guardians,
      emergency
    };
  }
}

export const webSocketService = new WebSocketService();

// Export function for use in other services
export function broadcastToConnectedClients(data: any) {
  webSocketService.broadcastEmergencyAlert(data);
}
