import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface VoiceStressAnalysis {
  stressScore: number; // 0-100, higher means more stress
  confidence: number; // 0-1, confidence in the analysis
  emotions: string[]; // detected emotions
  riskLevel: "low" | "medium" | "high" | "critical";
  transcript?: string;
  shouldTriggerAlert: boolean;
}

export interface SafetyRecommendation {
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  safeRoutes?: Array<{
    description: string;
    estimatedTime: number;
    safetyScore: number;
  }>;
  nearbyResources: Array<{
    type: string;
    name: string;
    distance: number;
    contact?: string;
  }>;
}

export interface BiometricAnalysis {
  overallRisk: "low" | "medium" | "high" | "critical";
  anomalies: string[];
  predictions: string[];
  shouldAlert: boolean;
  confidence: number;
}

export async function analyzeVoiceStress(audioData: string, context?: string): Promise<VoiceStressAnalysis> {
  try {
    const prompt = `
    Analyze the following voice data for signs of stress, fear, panic, or distress. 
    Context: ${context || "General safety monitoring"}
    
    Look for:
    - Voice trembling or shaking
    - Elevated pitch or tone
    - Rapid speech patterns
    - Keywords indicating distress ("help", "stop", "no", etc.)
    - Background noise that might indicate danger
    
    Respond with JSON in this exact format:
    {
      "stressScore": number (0-100),
      "confidence": number (0-1),
      "emotions": ["emotion1", "emotion2"],
      "riskLevel": "low|medium|high|critical",
      "transcript": "transcribed text",
      "shouldTriggerAlert": boolean
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert voice stress analyst specialized in women's safety. Analyze voice patterns for signs of distress with high accuracy."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      stressScore: Math.max(0, Math.min(100, result.stressScore || 0)),
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
      emotions: Array.isArray(result.emotions) ? result.emotions : [],
      riskLevel: ["low", "medium", "high", "critical"].includes(result.riskLevel) ? result.riskLevel : "low",
      transcript: result.transcript || "",
      shouldTriggerAlert: Boolean(result.shouldTriggerAlert)
    };
  } catch (error) {
    console.error("Voice stress analysis failed:", error);
    return {
      stressScore: 0,
      confidence: 0,
      emotions: [],
      riskLevel: "low",
      shouldTriggerAlert: false
    };
  }
}

export async function generateSafetyRecommendations(
  location: { lat: number; lng: number; address?: string },
  timeOfDay: string,
  userProfile: { age?: number; medicalConditions?: string[] }
): Promise<SafetyRecommendation> {
  try {
    const prompt = `
    Generate safety recommendations for a woman at this location and time:
    Location: ${location.address || `${location.lat}, ${location.lng}`}
    Time: ${timeOfDay}
    User Profile: Age ${userProfile.age || "unknown"}, Medical conditions: ${userProfile.medicalConditions?.join(", ") || "none"}
    
    Consider:
    - Time of day safety factors
    - Local crime patterns
    - Well-lit and populated routes
    - Nearby police stations, hospitals, safe buildings
    - Public transportation safety
    - Medical considerations
    
    Respond with JSON in this exact format:
    {
      "riskLevel": "low|medium|high|critical",
      "recommendations": ["recommendation1", "recommendation2"],
      "safeRoutes": [
        {
          "description": "route description",
          "estimatedTime": minutes,
          "safetyScore": number (1-10)
        }
      ],
      "nearbyResources": [
        {
          "type": "police|hospital|safe_building|transport",
          "name": "resource name",
          "distance": meters,
          "contact": "phone number if available"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a women's safety expert providing location-based safety recommendations for India. Consider local safety patterns and cultural context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      riskLevel: ["low", "medium", "high", "critical"].includes(result.riskLevel) ? result.riskLevel : "medium",
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      safeRoutes: Array.isArray(result.safeRoutes) ? result.safeRoutes : [],
      nearbyResources: Array.isArray(result.nearbyResources) ? result.nearbyResources : []
    };
  } catch (error) {
    console.error("Safety recommendations failed:", error);
    return {
      riskLevel: "medium",
      recommendations: ["Stay in well-lit areas", "Keep emergency contacts ready"],
      safeRoutes: [],
      nearbyResources: []
    };
  }
}

export async function analyzeBiometricData(data: {
  heartRate?: number;
  stressLevel?: string;
  motionPattern?: string;
  location?: { lat: number; lng: number };
  historicalData?: any[];
}): Promise<BiometricAnalysis> {
  try {
    const prompt = `
    Analyze this biometric data for safety concerns:
    
    Current Data:
    - Heart Rate: ${data.heartRate || "unknown"} BPM
    - Stress Level: ${data.stressLevel || "unknown"}
    - Motion Pattern: ${data.motionPattern || "unknown"}
    - Location: ${data.location ? `${data.location.lat}, ${data.location.lng}` : "unknown"}
    
    Historical Patterns: ${data.historicalData ? "Available" : "Not available"}
    
    Look for:
    - Abnormal heart rate patterns
    - Stress indicators
    - Motion patterns suggesting distress (running, erratic movement)
    - Sudden changes from baseline
    - Medical emergency indicators
    
    Respond with JSON in this exact format:
    {
      "overallRisk": "low|medium|high|critical",
      "anomalies": ["anomaly1", "anomaly2"],
      "predictions": ["prediction1", "prediction2"],
      "shouldAlert": boolean,
      "confidence": number (0-1)
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical AI specialist analyzing biometric data for women's safety. Focus on detecting emergency situations and health risks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      overallRisk: ["low", "medium", "high", "critical"].includes(result.overallRisk) ? result.overallRisk : "low",
      anomalies: Array.isArray(result.anomalies) ? result.anomalies : [],
      predictions: Array.isArray(result.predictions) ? result.predictions : [],
      shouldAlert: Boolean(result.shouldAlert),
      confidence: Math.max(0, Math.min(1, result.confidence || 0))
    };
  } catch (error) {
    console.error("Biometric analysis failed:", error);
    return {
      overallRisk: "low",
      anomalies: [],
      predictions: [],
      shouldAlert: false,
      confidence: 0
    };
  }
}

export async function generateEmergencyResponse(alertData: {
  alertType: string;
  location: { lat: number; lng: number; address?: string };
  biometricData?: any;
  voiceAnalysis?: any;
  userProfile?: any;
}): Promise<{
  urgencyLevel: number;
  responseActions: string[];
  contactsToAlert: string[];
  emergencyServices: string[];
  instructions: string[];
}> {
  try {
    const prompt = `
    Generate emergency response plan for this alert:
    
    Alert Type: ${alertData.alertType}
    Location: ${alertData.location.address || `${alertData.location.lat}, ${alertData.location.lng}`}
    Biometric Data: ${JSON.stringify(alertData.biometricData || {})}
    Voice Analysis: ${JSON.stringify(alertData.voiceAnalysis || {})}
    
    Generate immediate response actions considering:
    - Alert severity and type
    - Location accessibility
    - Available resources
    - Indian emergency services (100, 108, 181)
    - Family and guardian notifications
    
    Respond with JSON in this exact format:
    {
      "urgencyLevel": number (1-10),
      "responseActions": ["action1", "action2"],
      "contactsToAlert": ["family", "guardians", "police"],
      "emergencyServices": ["100", "108", "181"],
      "instructions": ["instruction1", "instruction2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an emergency response coordinator specializing in women's safety in India. Generate appropriate response plans for different emergency scenarios."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      urgencyLevel: Math.max(1, Math.min(10, result.urgencyLevel || 5)),
      responseActions: Array.isArray(result.responseActions) ? result.responseActions : [],
      contactsToAlert: Array.isArray(result.contactsToAlert) ? result.contactsToAlert : [],
      emergencyServices: Array.isArray(result.emergencyServices) ? result.emergencyServices : ["100"],
      instructions: Array.isArray(result.instructions) ? result.instructions : []
    };
  } catch (error) {
    console.error("Emergency response generation failed:", error);
    return {
      urgencyLevel: 8,
      responseActions: ["Alert emergency contacts", "Contact police", "Start location tracking"],
      contactsToAlert: ["family", "guardians", "police"],
      emergencyServices: ["100", "108"],
      instructions: ["Stay calm", "Move to safe location if possible", "Keep phone charged"]
    };
  }
}
