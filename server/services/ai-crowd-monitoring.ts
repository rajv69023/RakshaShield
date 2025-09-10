import { db } from "../db";
import { cctvFeeds, crowdAnalysis, threatDetections } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CrowdAnalysisInput {
  cctvFeedId?: string;
  location: { lat: number; lng: number; address?: string };
  imageData?: string; // base64 encoded image
  videoUrl?: string;
  timeOfDay: string;
  weatherConditions?: string;
  eventType?: string; // festival, market, protest, normal
}

interface CrowdBehaviorAnalysis {
  crowdDensity: "low" | "medium" | "high" | "critical";
  crowdSize: number;
  movementPattern: "normal" | "agitated" | "panic" | "dispersing" | "gathering";
  aggressionLevel: "none" | "low" | "medium" | "high" | "dangerous";
  emotionalState: "calm" | "excited" | "tense" | "fearful" | "angry";
  riskScore: number; // 0-100
  threatIndicators: string[];
  recommendations: string[];
  confidence: number;
  specificThreats: {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number;
    description: string;
    isWomenTargeted: boolean;
  }[];
}

export class AiCrowdMonitoringService {
  
  // Analyze crowd behavior using AI vision
  async analyzeCrowdBehavior(input: CrowdAnalysisInput): Promise<CrowdBehaviorAnalysis> {
    try {
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const prompt = `
        Analyze this crowd scene for women's safety. Focus specifically on:
        
        1. CROWD CHARACTERISTICS:
        - Density: Estimate crowd size and density level
        - Movement patterns: Are people moving normally, agitated, panicking?
        - Gender composition: What's the gender ratio?
        
        2. SAFETY INDICATORS FOR WOMEN:
        - Aggressive behavior towards women
        - Harassment indicators
        - Stalking behaviors
        - Unsafe crowd dynamics
        - Gender-based intimidation
        
        3. THREAT DETECTION:
        - Suspicious individuals
        - Weapons or dangerous objects
        - Gang activities
        - Predatory behavior patterns
        - Areas of concern for women's safety
        
        4. ENVIRONMENTAL FACTORS:
        - Lighting conditions
        - Escape routes availability
        - Security presence
        - Safe zones within the area
        
        Context: Location: ${input.location.address || 'Unknown'}, Time: ${input.timeOfDay}, Weather: ${input.weatherConditions || 'Unknown'}, Event: ${input.eventType || 'Normal day'}
        
        Provide analysis in JSON format with risk scores (0-100) and specific recommendations for women's safety.
      `;

      const messages: any[] = [
        {
          role: "system",
          content: "You are an AI safety expert specializing in crowd behavior analysis for women's safety. Analyze crowds for potential threats, harassment, and unsafe conditions specifically targeting women. Provide detailed risk assessments and safety recommendations."
        },
        {
          role: "user",
          content: input.imageData ? [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { url: `data:image/jpeg;base64,${input.imageData}` }
            }
          ] : prompt
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Structure the response
      const crowdBehavior: CrowdBehaviorAnalysis = {
        crowdDensity: analysis.crowd_density || "medium",
        crowdSize: analysis.crowd_size || 0,
        movementPattern: analysis.movement_pattern || "normal",
        aggressionLevel: analysis.aggression_level || "none",
        emotionalState: analysis.emotional_state || "calm",
        riskScore: Math.min(100, Math.max(0, analysis.risk_score || 30)),
        threatIndicators: analysis.threat_indicators || [],
        recommendations: analysis.recommendations || [],
        confidence: Math.min(1, Math.max(0, analysis.confidence || 0.7)),
        specificThreats: (analysis.specific_threats || []).map((threat: any) => ({
          type: threat.type || "unknown",
          severity: threat.severity || "low",
          confidence: threat.confidence || 0.5,
          description: threat.description || "",
          isWomenTargeted: threat.is_women_targeted || false
        }))
      };

      // Store analysis in database
      await this.storeCrowdAnalysis(input, crowdBehavior);

      // Check for high-risk threats
      if (crowdBehavior.riskScore > 70 || crowdBehavior.aggressionLevel === "dangerous") {
        await this.handleHighRiskSituation(input.location, crowdBehavior);
      }

      return crowdBehavior;

    } catch (error) {
      console.error("AI crowd analysis failed:", error);
      throw new Error("Failed to analyze crowd behavior: " + (error as Error).message);
    }
  }

  // Store crowd analysis in database
  private async storeCrowdAnalysis(input: CrowdAnalysisInput, analysis: CrowdBehaviorAnalysis): Promise<void> {
    try {
      // Store crowd analysis
      const [crowdRecord] = await db.insert(crowdAnalysis).values({
        cctvFeedId: input.cctvFeedId || null,
        location: input.location,
        crowdDensity: analysis.crowdDensity,
        crowdSize: analysis.crowdSize,
        movementPattern: analysis.movementPattern,
        aggressionLevel: analysis.aggressionLevel,
        emotionalState: analysis.emotionalState,
        riskScore: analysis.riskScore,
        threatIndicators: analysis.threatIndicators,
        recommendations: analysis.recommendations,
        aiConfidence: analysis.confidence,
      }).returning();

      // Store specific threats
      for (const threat of analysis.specificThreats) {
        await db.insert(threatDetections).values({
          crowdAnalysisId: crowdRecord.id,
          location: input.location,
          threatType: threat.type,
          severity: threat.severity,
          confidence: threat.confidence,
          description: threat.description,
          isWomenTargeted: threat.isWomenTargeted,
          alertGenerated: threat.severity === "high" || threat.severity === "critical",
        });
      }

    } catch (error) {
      console.error("Failed to store crowd analysis:", error);
    }
  }

  // Handle high-risk situations
  private async handleHighRiskSituation(location: any, analysis: CrowdBehaviorAnalysis): Promise<void> {
    console.warn(`HIGH RISK CROWD SITUATION DETECTED:`, {
      location,
      riskScore: analysis.riskScore,
      aggressionLevel: analysis.aggressionLevel,
      threats: analysis.specificThreats.filter(t => t.isWomenTargeted)
    });

    // This would integrate with emergency alert system
    // For now, we log the incident for immediate response
    
    // Future: Automatically alert nearby guardians and authorities
    // Future: Send push notifications to women in the area
    // Future: Activate enhanced monitoring for the location
  }

  // Get recent crowd analysis for a location
  async getLocationCrowdAnalysis(location: { lat: number; lng: number }, radiusKm: number = 1): Promise<any[]> {
    try {
      // For simplicity, we'll get recent analysis within the area
      // In a real implementation, we'd use PostGIS for proper geographic queries
      const recentAnalysis = await db
        .select()
        .from(crowdAnalysis)
        .where(gte(crowdAnalysis.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000))) // Last 24 hours
        .orderBy(desc(crowdAnalysis.timestamp))
        .limit(20);

      return recentAnalysis;
    } catch (error) {
      console.error("Failed to get location crowd analysis:", error);
      return [];
    }
  }

  // Analyze historical crowd patterns for predictive safety
  async analyzeCrowdPatterns(location: { lat: number; lng: number }): Promise<{
    safetyScore: number;
    riskFactors: string[];
    safeTimes: string[];
    dangerousTimes: string[];
    recommendations: string[];
  }> {
    try {
      // Get historical data for the location
      const historicalData = await db
        .select()
        .from(crowdAnalysis)
        .where(gte(crowdAnalysis.timestamp, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) // Last 30 days
        .orderBy(desc(crowdAnalysis.timestamp));

      // Analyze patterns using AI
      const prompt = `
        Analyze these historical crowd behavior patterns to predict safety for women:
        
        Data: ${JSON.stringify(historicalData.slice(0, 50))}
        
        Provide insights on:
        1. Overall safety score for women (0-100)
        2. Common risk factors
        3. Safest times to visit
        4. Most dangerous times
        5. Specific recommendations for women's safety
        
        Focus on patterns that affect women's safety specifically.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a safety analyst specializing in women's safety patterns. Analyze crowd data to provide safety insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const patterns = JSON.parse(response.choices[0].message.content || '{}');

      return {
        safetyScore: patterns.safety_score || 70,
        riskFactors: patterns.risk_factors || [],
        safeTimes: patterns.safe_times || [],
        dangerousTimes: patterns.dangerous_times || [],
        recommendations: patterns.recommendations || []
      };

    } catch (error) {
      console.error("Failed to analyze crowd patterns:", error);
      return {
        safetyScore: 50,
        riskFactors: ["Insufficient data"],
        safeTimes: [],
        dangerousTimes: [],
        recommendations: ["Enable location monitoring for better insights"]
      };
    }
  }

  // Real-time threat detection from multiple CCTV feeds
  async monitorMultipleFeeds(feedIds: string[]): Promise<void> {
    console.log(`Starting real-time monitoring of ${feedIds.length} CCTV feeds`);
    
    // This would be a continuous monitoring process
    // For demonstration, we'll simulate processing each feed
    for (const feedId of feedIds) {
      try {
        // Get feed info
        const [feed] = await db.select().from(cctvFeeds).where(eq(cctvFeeds.feedId, feedId));
        
        if (feed && feed.aiAnalysisEnabled) {
          console.log(`Monitoring feed ${feedId} at location:`, feed.location);
          
          // In real implementation, this would:
          // 1. Connect to CCTV stream
          // 2. Capture frames every 30 seconds
          // 3. Run AI analysis on each frame
          // 4. Detect changes in crowd behavior
          // 5. Alert on threats
          
          // Simulate analysis (in production, this would be real-time)
          // await this.analyzeCrowdBehavior({
          //   cctvFeedId: feed.id,
          //   location: feed.location as any,
          //   timeOfDay: new Date().toISOString(),
          // });
        }
      } catch (error) {
        console.error(`Failed to monitor feed ${feedId}:`, error);
      }
    }
  }

  // Emergency crowd dispersal recommendations
  async getEmergencyDispersalPlan(location: { lat: number; lng: number }): Promise<{
    evacuationRoutes: any[];
    safetyZones: any[];
    emergencyContacts: any[];
    instructions: string[];
  }> {
    // This would integrate with city emergency systems
    // For now, provide general safety guidance
    
    return {
      evacuationRoutes: [
        { route: "Main Street North", safety: "high", crowdCapacity: "low" },
        { route: "Park Avenue East", safety: "medium", crowdCapacity: "medium" }
      ],
      safetyZones: [
        { name: "City Hall", capacity: 500, distance: "200m" },
        { name: "Police Station", capacity: 100, distance: "500m" }
      ],
      emergencyContacts: [
        { service: "Women's Helpline", number: "181" },
        { service: "Police Emergency", number: "100" },
        { service: "Medical Emergency", number: "108" }
      ],
      instructions: [
        "Move calmly to the nearest safe zone",
        "Stay in groups, don't separate",
        "Keep emergency contacts ready",
        "Follow guardian app directions"
      ]
    };
  }
}

export const aiCrowdMonitoringService = new AiCrowdMonitoringService();