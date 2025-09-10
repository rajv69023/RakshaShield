import { storage } from "../storage";
import { 
  type InsertEmergencyAlert, 
  type EmergencyAlert, 
  type InsertGuardianResponse,
  type Guardian
} from "@shared/schema";
import { 
  analyzeVoiceStress, 
  generateEmergencyResponse, 
  analyzeBiometricData 
} from "./openai";
import { broadcastToConnectedClients } from "./websocket";

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

export class EmergencyService {
  
  async triggerEmergency(trigger: EmergencyTrigger): Promise<EmergencyResponse> {
    try {
      console.log(`🚨 Emergency triggered by user ${trigger.userId}, type: ${trigger.triggerType}`);
      
      // Get user details
      const user = await storage.getUser(trigger.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Analyze the trigger data to determine severity
      const analysisResults = await this.analyzeTriggerData(trigger);
      
      // Create emergency alert record
      const alertData: InsertEmergencyAlert = {
        userId: trigger.userId,
        alertType: trigger.triggerType,
        priority: this.determinePriority(analysisResults),
        status: "active",
        location: trigger.location,
        biometricData: trigger.additionalData?.biometricData,
        voiceAnalysis: analysisResults.voiceAnalysis,
        evidenceData: null,
        contactsNotified: null,
        guardiansAlerted: null,
        responseTime: null,
      };

      const alert = await storage.createEmergencyAlert(alertData);
      
      // Generate AI-powered emergency response plan
      const emergencyPlan = await generateEmergencyResponse({
        alertType: trigger.triggerType,
        location: trigger.location,
        biometricData: trigger.additionalData?.biometricData,
        voiceAnalysis: analysisResults.voiceAnalysis,
        userProfile: {
          name: user.fullName,
          phone: user.phoneNumber,
          medicalInfo: user.medicalInfo
        }
      });

      // Execute emergency response
      const response = await this.executeEmergencyResponse(alert, emergencyPlan, user);
      
      // Start evidence collection
      await this.startEvidenceCollection(alert.id, trigger);
      
      // Broadcast real-time alert to connected clients
      await this.broadcastEmergencyAlert(alert, user);
      
      console.log(`✅ Emergency response completed for alert ${alert.id}`);
      return response;
      
    } catch (error) {
      console.error("Emergency trigger failed:", error);
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

  private async analyzeTriggerData(trigger: EmergencyTrigger) {
    const results: any = {
      overallRisk: "medium",
      voiceAnalysis: null,
      biometricAnalysis: null
    };

    // Analyze voice data if available
    if (trigger.additionalData?.voiceData) {
      try {
        results.voiceAnalysis = await analyzeVoiceStress(
          trigger.additionalData.voiceData,
          trigger.additionalData?.contextInfo
        );
        
        if (results.voiceAnalysis.shouldTriggerAlert) {
          results.overallRisk = "high";
        }
      } catch (error) {
        console.error("Voice analysis failed:", error);
      }
    }

    // Analyze biometric data if available
    if (trigger.additionalData?.biometricData) {
      try {
        results.biometricAnalysis = await analyzeBiometricData({
          ...trigger.additionalData.biometricData,
          location: trigger.location
        });
        
        if (results.biometricAnalysis.shouldAlert) {
          results.overallRisk = "critical";
        }
      } catch (error) {
        console.error("Biometric analysis failed:", error);
      }
    }

    return results;
  }

  private determinePriority(analysisResults: any): string {
    if (analysisResults.overallRisk === "critical") return "critical";
    if (analysisResults.overallRisk === "high") return "high";
    if (analysisResults.voiceAnalysis?.riskLevel === "high") return "high";
    if (analysisResults.biometricAnalysis?.overallRisk === "high") return "high";
    return "medium";
  }

  private async executeEmergencyResponse(
    alert: EmergencyAlert, 
    emergencyPlan: any, 
    user: any
  ): Promise<EmergencyResponse> {
    const actionsTriggered: string[] = [];
    let guardiansAlerted = 0;
    let contactsNotified = 0;

    try {
      // 1. Alert nearby guardians
      const nearbyGuardians = await storage.getNearbyGuardians(
        alert.location.lat,
        alert.location.lng,
        10 // 10km radius
      );

      for (const guardian of nearbyGuardians.slice(0, 5)) { // Alert top 5 guardians
        try {
          await this.alertGuardian(alert.id, guardian);
          guardiansAlerted++;
          actionsTriggered.push(`Guardian ${guardian.id} alerted`);
        } catch (error) {
          console.error(`Failed to alert guardian ${guardian.id}:`, error);
        }
      }

      // 2. Notify emergency contacts
      if (user.emergencyContacts) {
        const contacts = Array.isArray(user.emergencyContacts) ? user.emergencyContacts : [];
        for (const contact of contacts.slice(0, 3)) { // Top 3 contacts
          try {
            await this.notifyEmergencyContact(alert, contact);
            contactsNotified++;
            actionsTriggered.push(`Contact ${contact.name} notified`);
          } catch (error) {
            console.error(`Failed to notify contact ${contact.name}:`, error);
          }
        }
      }

      // 3. Contact emergency services if critical
      if (alert.priority === "critical") {
        try {
          await this.contactEmergencyServices(alert, emergencyPlan.emergencyServices);
          actionsTriggered.push("Emergency services contacted");
        } catch (error) {
          console.error("Failed to contact emergency services:", error);
        }
      }

      // 4. Update alert with notification results
      await storage.updateEmergencyAlert(alert.id, {
        contactsNotified: contactsNotified,
        guardiansAlerted: guardiansAlerted,
      });

      return {
        alertId: alert.id,
        success: true,
        actionsTriggered,
        guardiansAlerted,
        contactsNotified,
        estimatedResponseTime: this.calculateEstimatedResponseTime(nearbyGuardians),
      };

    } catch (error) {
      console.error("Emergency response execution failed:", error);
      return {
        alertId: alert.id,
        success: false,
        actionsTriggered,
        guardiansAlerted,
        contactsNotified,
        estimatedResponseTime: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  private async alertGuardian(alertId: string, guardian: Guardian): Promise<void> {
    // Create guardian response record
    const response: InsertGuardianResponse = {
      alertId,
      guardianId: guardian.id,
      responseType: "notified",
      responseTime: 0,
      estimatedArrival: null,
      notes: null,
    };

    await storage.createGuardianResponse(response);

    // TODO: Send push notification, SMS, or call to guardian
    console.log(`Guardian ${guardian.id} alerted for emergency ${alertId}`);
  }

  private async notifyEmergencyContact(alert: EmergencyAlert, contact: any): Promise<void> {
    // TODO: Send SMS/call to emergency contact
    console.log(`Emergency contact ${contact.name} notified for alert ${alert.id}`);
  }

  private async contactEmergencyServices(alert: EmergencyAlert, services: string[]): Promise<void> {
    // TODO: Integrate with national emergency services APIs
    console.log(`Emergency services ${services.join(", ")} contacted for alert ${alert.id}`);
  }

  private calculateEstimatedResponseTime(guardians: Guardian[]): number {
    if (guardians.length === 0) return 900; // 15 minutes default
    
    const averageResponseTime = guardians.reduce((sum, guardian) => {
      return sum + (guardian.responseTime || 300);
    }, 0) / guardians.length;

    return Math.min(averageResponseTime, 600); // Max 10 minutes
  }

  private async startEvidenceCollection(alertId: string, trigger: EmergencyTrigger): Promise<void> {
    try {
      // TODO: Start audio/video recording
      // TODO: Capture location traces
      // TODO: Store in blockchain-secured evidence vault
      console.log(`Evidence collection started for alert ${alertId}`);
    } catch (error) {
      console.error("Failed to start evidence collection:", error);
    }
  }

  private async broadcastEmergencyAlert(alert: EmergencyAlert, user: any): Promise<void> {
    try {
      const alertData = {
        type: "emergency_alert",
        alertId: alert.id,
        userId: alert.userId,
        userName: user.fullName,
        alertType: alert.alertType,
        priority: alert.priority,
        location: alert.location,
        timestamp: alert.createdAt,
      };

      // Broadcast to all connected guardians and emergency contacts
      broadcastToConnectedClients(alertData);
      
    } catch (error) {
      console.error("Failed to broadcast emergency alert:", error);
    }
  }

  async respondToEmergency(
    alertId: string, 
    guardianId: string, 
    responseType: "accepted" | "declined" | "arrived" | "completed",
    notes?: string
  ): Promise<boolean> {
    try {
      const response: InsertGuardianResponse = {
        alertId,
        guardianId,
        responseType,
        responseTime: Date.now(), // TODO: Calculate actual response time
        notes,
        estimatedArrival: responseType === "accepted" ? 300 : null, // 5 minutes estimate
      };

      await storage.createGuardianResponse(response);

      // Broadcast response update
      broadcastToConnectedClients({
        type: "guardian_response",
        alertId,
        guardianId,
        responseType,
        timestamp: new Date(),
      });

      console.log(`Guardian ${guardianId} responded to alert ${alertId}: ${responseType}`);
      return true;

    } catch (error) {
      console.error("Failed to record guardian response:", error);
      return false;
    }
  }

  async resolveEmergency(alertId: string, resolution: string, notes?: string): Promise<boolean> {
    try {
      await storage.updateEmergencyAlert(alertId, {
        status: "resolved",
        resolvedAt: new Date(),
      });

      // Broadcast resolution
      broadcastToConnectedClients({
        type: "emergency_resolved",
        alertId,
        resolution,
        timestamp: new Date(),
      });

      console.log(`Emergency alert ${alertId} resolved: ${resolution}`);
      return true;

    } catch (error) {
      console.error("Failed to resolve emergency:", error);
      return false;
    }
  }
}

export const emergencyService = new EmergencyService();
