import { apiRequest } from "./queryClient";
import { useCallback, useState } from "react";

export interface EmergencyTrigger {
  userId: string;
  triggerType: "manual" | "voice_stress" | "biometric" | "fall_detection" | "panic_gesture";
  location: {
    lat: number;
    lng: number;
    address?: string;
    accuracy?: number;
  };
  additionalData?: {
    voiceData?: string;
    biometricData?: any;
    gestureData?: any;
    contextInfo?: string;
  };
}

export interface EmergencyResponse {
  alertId: string;
  success: boolean;
  actionsTriggered: string[];
  guardiansAlerted: number;
  contactsNotified: number;
  estimatedResponseTime: number;
  error?: string;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  alertType: string;
  priority: string;
  status: string;
  location: any;
  biometricData?: any;
  voiceAnalysis?: any;
  evidenceData?: any;
  contactsNotified?: number;
  guardiansAlerted?: number;
  responseTime?: number;
  createdAt: string;
  updatedAt: string;
}

class EmergencyService {
  private static instance: EmergencyService;
  private activeAlert: EmergencyAlert | null = null;
  private emergencyCallbacks: Array<(alert: EmergencyAlert) => void> = [];

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  async triggerEmergency(trigger: EmergencyTrigger): Promise<EmergencyResponse> {
    try {
      console.log("🚨 Triggering emergency:", trigger.triggerType);

      const response = await apiRequest('POST', '/api/emergency/trigger', trigger);
      const result: EmergencyResponse = await response.json();

      if (result.success) {
        console.log("✅ Emergency triggered successfully:", result);
        
        // Store active alert for tracking
        if (result.alertId) {
          await this.fetchAlertDetails(result.alertId);
        }

        // Notify callbacks
        if (this.activeAlert) {
          this.emergencyCallbacks.forEach(callback => callback(this.activeAlert!));
        }
      } else {
        console.error("❌ Emergency trigger failed:", result.error);
      }

      return result;
    } catch (error) {
      console.error("Emergency trigger error:", error);
      return {
        alertId: "",
        success: false,
        actionsTriggered: [],
        guardiansAlerted: 0,
        contactsNotified: 0,
        estimatedResponseTime: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  async fetchAlertDetails(alertId: string): Promise<EmergencyAlert | null> {
    try {
      const response = await apiRequest('GET', `/api/emergency/alerts/${alertId}`);
      const alert: EmergencyAlert = await response.json();
      this.activeAlert = alert;
      return alert;
    } catch (error) {
      console.error("Failed to fetch alert details:", error);
      return null;
    }
  }

  async respondToEmergency(alertId: string, guardianId: string, responseType: "accepted" | "declined" | "arrived" | "completed", notes?: string): Promise<boolean> {
    try {
      const response = await apiRequest('POST', '/api/emergency/respond', {
        alertId,
        guardianId,
        responseType,
        notes
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Failed to respond to emergency:", error);
      return false;
    }
  }

  async resolveEmergency(alertId: string, resolution: string, notes?: string): Promise<boolean> {
    try {
      const response = await apiRequest('POST', '/api/emergency/resolve', {
        alertId,
        resolution,
        notes
      });

      const result = await response.json();
      
      if (result.success && this.activeAlert?.id === alertId) {
        this.activeAlert = null;
      }

      return result.success;
    } catch (error) {
      console.error("Failed to resolve emergency:", error);
      return false;
    }
  }

  async getActiveAlerts(): Promise<EmergencyAlert[]> {
    try {
      const response = await apiRequest('GET', '/api/emergency/active');
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch active alerts:", error);
      return [];
    }
  }

  async getUserEmergencyHistory(userId: string): Promise<EmergencyAlert[]> {
    try {
      const response = await apiRequest('GET', `/api/emergency/alerts/${userId}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch emergency history:", error);
      return [];
    }
  }

  onEmergencyAlert(callback: (alert: EmergencyAlert) => void): () => void {
    this.emergencyCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.emergencyCallbacks.indexOf(callback);
      if (index > -1) {
        this.emergencyCallbacks.splice(index, 1);
      }
    };
  }

  getActiveAlert(): EmergencyAlert | null {
    return this.activeAlert;
  }

  // Quick emergency shortcuts
  async triggerManualSOS(location: { lat: number; lng: number }, contextInfo?: string): Promise<EmergencyResponse> {
    return this.triggerEmergency({
      userId: "current-user-id", // TODO: Get actual user ID
      triggerType: "manual",
      location,
      additionalData: {
        contextInfo: contextInfo || "Manual SOS button pressed"
      }
    });
  }

  async triggerVoiceStressAlert(location: { lat: number; lng: number }, voiceData: string, analysis: any): Promise<EmergencyResponse> {
    return this.triggerEmergency({
      userId: "current-user-id", // TODO: Get actual user ID
      triggerType: "voice_stress",
      location,
      additionalData: {
        voiceData,
        contextInfo: `Voice stress detected: ${analysis.riskLevel} risk level`
      }
    });
  }

  async triggerBiometricAlert(location: { lat: number; lng: number }, biometricData: any): Promise<EmergencyResponse> {
    return this.triggerEmergency({
      userId: "current-user-id", // TODO: Get actual user ID
      triggerType: "biometric",
      location,
      additionalData: {
        biometricData,
        contextInfo: `Biometric anomaly detected: HR ${biometricData.heartRate}, Stress ${biometricData.stressLevel}`
      }
    });
  }

  // Utility methods
  formatResponseTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-safety-danger text-white";
      case "medium": return "bg-safety-caution text-black";
      case "low": return "bg-safety-safe text-white";
      default: return "bg-muted text-muted-foreground";
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case "active": return "bg-destructive text-destructive-foreground";
      case "responded": return "bg-safety-caution text-black";
      case "resolved": return "bg-safety-safe text-white";
      case "false_alarm": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  }
}

export const emergencyService = EmergencyService.getInstance();

// React hook for emergency management
export function useEmergency() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerEmergency = useCallback(async (trigger: EmergencyTrigger): Promise<EmergencyResponse> => {
    setIsTriggering(true);
    setError(null);
    
    try {
      const response = await emergencyService.triggerEmergency(trigger);
      
      if (response.success) {
        const alert = await emergencyService.fetchAlertDetails(response.alertId);
        setActiveAlert(alert);
      } else {
        setError(response.error || "Emergency trigger failed");
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      return {
        alertId: "",
        success: false,
        actionsTriggered: [],
        guardiansAlerted: 0,
        contactsNotified: 0,
        estimatedResponseTime: 0,
        error: errorMessage
      };
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const resolveEmergency = useCallback(async (alertId: string, resolution: string, notes?: string): Promise<boolean> => {
    try {
      const success = await emergencyService.resolveEmergency(alertId, resolution, notes);
      if (success && activeAlert?.id === alertId) {
        setActiveAlert(null);
      }
      return success;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to resolve emergency");
      return false;
    }
  }, [activeAlert]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isTriggering,
    activeAlert,
    error,
    triggerEmergency,
    resolveEmergency,
    clearError,
    emergencyService,
  };
}

// Utility function for emergency detection
export function detectEmergencyKeywords(text: string): boolean {
  const emergencyKeywords = [
    'help', 'emergency', 'sos', 'danger', 'attack', 'threat',
    'scared', 'afraid', 'stalking', 'following', 'harassment',
    'rape', 'assault', 'violence', 'kidnap', 'abduction',
    'police', 'call police', 'call 100', 'call 108', 'call 181'
  ];

  const normalizedText = text.toLowerCase();
  return emergencyKeywords.some(keyword => normalizedText.includes(keyword));
}

// Emergency contact utilities
export function formatEmergencyNumber(number: string): string {
  // Format Indian emergency numbers
  if (number === "100") return "100 (Police)";
  if (number === "108") return "108 (Ambulance)";
  if (number === "181") return "181 (Women's Helpline)";
  if (number === "1090") return "1090 (Women's Helpline)";
  if (number === "112") return "112 (Unified Emergency)";
  
  return number;
}

export function getEmergencyServices(): Array<{ number: string; name: string; description: string }> {
  return [
    { number: "100", name: "Police", description: "For immediate police assistance" },
    { number: "108", name: "Ambulance", description: "For medical emergencies" },
    { number: "181", name: "Women's Helpline", description: "24/7 women's safety helpline" },
    { number: "1090", name: "Women's Helpline", description: "Alternative women's helpline" },
    { number: "112", name: "Unified Emergency", description: "Single emergency number for all services" },
  ];
}

export default emergencyService;
