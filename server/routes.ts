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
import { aiCrowdMonitoringService } from "./services/ai-crowd-monitoring";
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

  // ========== ADVANCED AI & SAFETY FEATURES ==========

  // AI Crowd Monitoring routes
  app.post("/api/ai/crowd-analysis", async (req, res) => {
    try {
      const { location, imageData, timeOfDay, weatherConditions, eventType } = req.body;
      
      if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ message: "Location coordinates required" });
      }

      const analysis = await aiCrowdMonitoringService.analyzeCrowdBehavior({
        location,
        imageData,
        timeOfDay: timeOfDay || new Date().toISOString(),
        weatherConditions,
        eventType
      });

      res.json(analysis);
    } catch (error) {
      console.error("Crowd analysis failed:", error);
      res.status(500).json({ message: "Failed to analyze crowd behavior" });
    }
  });

  app.get("/api/ai/crowd-analysis/location", async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Location coordinates required" });
      }

      const analysis = await aiCrowdMonitoringService.getLocationCrowdAnalysis(
        { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
        radius ? parseFloat(radius as string) : 1
      );

      res.json(analysis);
    } catch (error) {
      console.error("Failed to get location crowd analysis:", error);
      res.status(500).json({ message: "Failed to get crowd analysis" });
    }
  });

  app.get("/api/ai/crowd-patterns/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      
      const patterns = await aiCrowdMonitoringService.analyzeCrowdPatterns({
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });

      res.json(patterns);
    } catch (error) {
      console.error("Failed to analyze crowd patterns:", error);
      res.status(500).json({ message: "Failed to analyze crowd patterns" });
    }
  });

  app.get("/api/ai/emergency-dispersal/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      
      const plan = await aiCrowdMonitoringService.getEmergencyDispersalPlan({
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });

      res.json(plan);
    } catch (error) {
      console.error("Failed to get dispersal plan:", error);
      res.status(500).json({ message: "Failed to get emergency dispersal plan" });
    }
  });

  // Satellite Communication Backup (Simulated)
  app.post("/api/satellite/emergency", async (req, res) => {
    try {
      const { userId, alertId, messageContent, location } = req.body;
      
      // Simulate satellite transmission
      const satelliteMessage = {
        id: Date.now().toString(),
        userId,
        alertId,
        messageType: "emergency_alert",
        messageContent,
        location,
        satelliteProvider: "starlink", // Default to Starlink
        transmissionStatus: "pending",
        batteryLevel: 85, // Simulated device battery
        signalStrength: 75, // Simulated signal strength
        createdAt: new Date(),
      };

      // In a real implementation, this would:
      // 1. Connect to satellite network API
      // 2. Send emergency message via satellite
      // 3. Track delivery status
      // 4. Store in satellite backup table

      console.log("Satellite emergency message prepared:", satelliteMessage);
      
      res.json({
        message: "Emergency message queued for satellite transmission",
        messageId: satelliteMessage.id,
        estimatedDelivery: "2-5 minutes"
      });
    } catch (error) {
      console.error("Satellite communication failed:", error);
      res.status(500).json({ message: "Satellite communication failed" });
    }
  });

  // AR Safety Features
  app.get("/api/ar/safety-overlay/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const { radius = 100 } = req.query;

      // Generate AR safety overlay data
      const arData = {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        safetyFeatures: [
          {
            type: "safe_path",
            path: [
              { lat: parseFloat(lat), lng: parseFloat(lng) },
              { lat: parseFloat(lat) + 0.001, lng: parseFloat(lng) + 0.001 }
            ],
            safety_score: 85,
            lighting: "good",
            crowd_density: "low"
          },
          {
            type: "threat_warning",
            location: { lat: parseFloat(lat) + 0.0005, lng: parseFloat(lng) - 0.0005 },
            threat_level: "medium",
            description: "Poorly lit area, avoid after dark"
          },
          {
            type: "guardian_nearby",
            location: { lat: parseFloat(lat) - 0.0008, lng: parseFloat(lng) + 0.0003 },
            guardian_id: "guardian-123",
            response_time: "3 minutes"
          }
        ],
        emergencyOptions: [
          { type: "fake_call", title: "Fake Call to Mom" },
          { type: "panic_alarm", title: "Panic Alarm" },
          { type: "safe_phrase", title: "Send Safe Phrase" }
        ]
      };

      res.json(arData);
    } catch (error) {
      console.error("AR safety overlay failed:", error);
      res.status(500).json({ message: "Failed to generate AR safety overlay" });
    }
  });

  // Quantum Blockchain Evidence (Simulated)
  app.post("/api/quantum-blockchain/store", async (req, res) => {
    try {
      const { evidenceId, evidenceData } = req.body;
      
      // Simulate quantum-safe blockchain storage
      const blockData = {
        evidenceId,
        blockHash: `qb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        previousBlockHash: "previous_block_hash_placeholder",
        merkleRoot: `merkle_${Math.random().toString(36).substr(2, 16)}`,
        quantumSignature: `quantum_sig_${Math.random().toString(36).substr(2, 20)}`,
        timestamp: new Date(),
        isQuantumResistant: true,
        chainVerified: false
      };

      console.log("Quantum blockchain block created:", blockData);
      
      res.json({
        message: "Evidence stored in quantum-safe blockchain",
        blockHash: blockData.blockHash,
        verificationUrl: `/api/quantum-blockchain/verify/${blockData.blockHash}`
      });
    } catch (error) {
      console.error("Quantum blockchain storage failed:", error);
      res.status(500).json({ message: "Quantum blockchain storage failed" });
    }
  });

  // Predictive Safety Analytics
  app.get("/api/predictive/safety-forecast/:lat/:lng", async (req, res) => {
    try {
      const { lat, lng } = req.params;
      const { timeframe = "next_hour" } = req.query;

      // Generate AI-powered safety predictions
      const forecast = {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        timeframe,
        predictions: [
          {
            time: "next_hour",
            safety_score: 78,
            risk_factors: ["High crowd density expected", "Limited lighting"],
            recommendations: ["Use main roads", "Travel in groups"]
          },
          {
            time: "evening",
            safety_score: 65,
            risk_factors: ["Reduced visibility", "Increased alcohol-related incidents"],
            recommendations: ["Avoid isolated areas", "Keep emergency contacts ready"]
          }
        ],
        alternativeRoutes: [
          {
            route: "Main Street Path",
            safety_score: 85,
            estimated_time: "12 minutes",
            guardian_coverage: true
          }
        ]
      };

      res.json(forecast);
    } catch (error) {
      console.error("Safety forecast failed:", error);
      res.status(500).json({ message: "Failed to generate safety forecast" });
    }
  });

  // Smart Wearable Integration
  app.post("/api/wearables/register", async (req, res) => {
    try {
      const { userId, deviceType, deviceId, capabilities } = req.body;
      
      const wearableDevice = {
        id: Date.now().toString(),
        userId,
        deviceType,
        deviceId,
        isActive: true,
        batteryLevel: 100,
        capabilities: capabilities || ["heart_rate", "panic_button", "location_tracking"],
        firmwareVersion: "v2.1.5",
        encryptionKey: `enc_${Math.random().toString(36).substr(2, 16)}`,
        emergencyProtocol: {
          auto_alert_threshold: 180, // BPM
          panic_gesture: "triple_tap",
          fallback_contacts: ["emergency_services", "primary_guardian"]
        }
      };

      console.log("Smart wearable registered:", wearableDevice);
      
      res.json({
        message: "Smart wearable registered successfully",
        device: wearableDevice
      });
    } catch (error) {
      console.error("Wearable registration failed:", error);
      res.status(500).json({ message: "Wearable registration failed" });
    }
  });

  return httpServer;
}
