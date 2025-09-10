import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emergencyService } from "./services/emergency";
import { webSocketService } from "./services/websocket";
import { 
  analyzeVoiceStress, 
  generateSafetyRecommendations,
  analyzeBiometricData 
} from "./services/openai";
import { 
  insertUserSchema, 
  insertEmergencyAlertSchema,
  insertBiometricDataSchema,
  insertGuardianSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  webSocketService.init(httpServer);

  // Health check
  app.get("/api/health", (req, res) => {
    const wsStats = webSocketService.getConnectedClients();
    res.json({ 
      status: "healthy", 
      timestamp: new Date(),
      websocket: wsStats
    });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({ 
        user: { ...user, password: undefined },
        message: "User created successfully" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ 
        user: { ...user, password: undefined },
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Emergency routes
  app.post("/api/emergency/trigger", async (req, res) => {
    try {
      const triggerData = req.body;
      
      const response = await emergencyService.triggerEmergency(triggerData);
      
      if (response.success) {
        res.status(200).json(response);
      } else {
        res.status(500).json(response);
      }
    } catch (error) {
      console.error("Emergency trigger error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to trigger emergency",
        error: error.message 
      });
    }
  });

  app.get("/api/emergency/alerts/:userId", async (req, res) => {
    try {
      const alerts = await storage.getUserEmergencyAlerts(req.params.userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/emergency/active", async (req, res) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active alerts" });
    }
  });

  app.post("/api/emergency/respond", async (req, res) => {
    try {
      const { alertId, guardianId, responseType, notes } = req.body;
      
      const success = await emergencyService.respondToEmergency(
        alertId, 
        guardianId, 
        responseType, 
        notes
      );
      
      if (success) {
        res.json({ success: true, message: "Response recorded" });
      } else {
        res.status(500).json({ success: false, message: "Failed to record response" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Response failed" });
    }
  });

  app.post("/api/emergency/resolve", async (req, res) => {
    try {
      const { alertId, resolution, notes } = req.body;
      
      const success = await emergencyService.resolveEmergency(alertId, resolution, notes);
      
      if (success) {
        res.json({ success: true, message: "Emergency resolved" });
      } else {
        res.status(500).json({ success: false, message: "Failed to resolve emergency" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Resolution failed" });
    }
  });

  // Biometric monitoring routes
  app.post("/api/biometric", async (req, res) => {
    try {
      const biometricData = insertBiometricDataSchema.parse(req.body);
      const data = await storage.addBiometricData(biometricData);
      
      // Analyze biometric data for anomalies
      const analysis = await analyzeBiometricData({
        heartRate: data.heartRate,
        stressLevel: data.stressLevel,
        motionPattern: data.motionPattern,
        location: data.location
      });
      
      // If anomalies detected and should alert, trigger emergency protocols
      if (analysis.shouldAlert && analysis.overallRisk === "critical") {
        await emergencyService.triggerEmergency({
          userId: data.userId,
          triggerType: "biometric",
          location: data.location || { lat: 0, lng: 0 },
          additionalData: {
            biometricData: data
          }
        });
      }
      
      res.status(201).json({ data, analysis });
    } catch (error) {
      console.error("Biometric data error:", error);
      res.status(400).json({ message: "Failed to process biometric data" });
    }
  });

  app.get("/api/biometric/:userId/latest", async (req, res) => {
    try {
      const data = await storage.getLatestBiometricData(req.params.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch biometric data" });
    }
  });

  app.get("/api/biometric/:userId/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await storage.getUserBiometricHistory(req.params.userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch biometric history" });
    }
  });

  // AI analysis routes
  app.post("/api/ai/voice-analysis", async (req, res) => {
    try {
      const { audioData, userId, context } = req.body;
      
      const analysis = await analyzeVoiceStress(audioData, context);
      
      // Store AI interaction
      await storage.addAiInteraction({
        userId,
        interactionType: "voice_analysis",
        inputData: { audioData, context },
        aiResponse: analysis,
        confidence: analysis.confidence,
        actionTaken: analysis.shouldTriggerAlert ? "emergency_triggered" : "none"
      });
      
      // If voice stress indicates emergency, trigger response
      if (analysis.shouldTriggerAlert) {
        await emergencyService.triggerEmergency({
          userId,
          triggerType: "voice_stress",
          location: req.body.location || { lat: 0, lng: 0 },
          additionalData: {
            voiceData: audioData,
            contextInfo: context
          }
        });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Voice analysis error:", error);
      res.status(500).json({ message: "Voice analysis failed" });
    }
  });

  app.post("/api/ai/safety-recommendations", async (req, res) => {
    try {
      const { location, timeOfDay, userProfile } = req.body;
      
      const recommendations = await generateSafetyRecommendations(
        location, 
        timeOfDay, 
        userProfile
      );
      
      // Store AI interaction
      if (userProfile.userId) {
        await storage.addAiInteraction({
          userId: userProfile.userId,
          interactionType: "recommendation",
          inputData: { location, timeOfDay, userProfile },
          aiResponse: recommendations,
          confidence: 0.8, // Default confidence for recommendations
          actionTaken: "recommendations_provided"
        });
      }
      
      res.json(recommendations);
    } catch (error) {
      console.error("Safety recommendations error:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Guardian routes
  app.post("/api/guardians", async (req, res) => {
    try {
      const guardianData = insertGuardianSchema.parse(req.body);
      const guardian = await storage.createGuardian(guardianData);
      res.status(201).json(guardian);
    } catch (error) {
      console.error("Guardian creation error:", error);
      res.status(400).json({ message: "Failed to create guardian profile" });
    }
  });

  app.get("/api/guardians/nearby", async (req, res) => {
    try {
      const { lat, lng, radius = 10 } = req.query;
      
      const guardians = await storage.getNearbyGuardians(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      );
      
      res.json(guardians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nearby guardians" });
    }
  });

  app.put("/api/guardians/:id/status", async (req, res) => {
    try {
      const { isActive } = req.body;
      const guardian = await storage.updateGuardianStatus(req.params.id, isActive);
      
      if (!guardian) {
        return res.status(404).json({ message: "Guardian not found" });
      }
      
      res.json(guardian);
    } catch (error) {
      res.status(500).json({ message: "Failed to update guardian status" });
    }
  });

  // Safety zones routes
  app.get("/api/safety-zones", async (req, res) => {
    try {
      const zones = await storage.getSafetyZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch safety zones" });
    }
  });

  app.get("/api/safety-zones/check", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      const zone = await storage.getSafetyZoneByLocation(
        parseFloat(lat as string),
        parseFloat(lng as string)
      );
      
      res.json(zone);
    } catch (error) {
      res.status(500).json({ message: "Failed to check safety zone" });
    }
  });

  // Evidence vault routes
  app.get("/api/evidence/:alertId", async (req, res) => {
    try {
      const evidence = await storage.getAlertEvidence(req.params.alertId);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evidence" });
    }
  });

  return httpServer;
}
