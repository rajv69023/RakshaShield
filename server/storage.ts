import { 
  users, 
  guardians, 
  emergencyAlerts, 
  biometricData, 
  safetyZones, 
  guardianResponses, 
  aiInteractions, 
  evidenceVault,
  type User, 
  type InsertUser,
  type Guardian,
  type InsertGuardian,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type BiometricData,
  type InsertBiometricData,
  type SafetyZone,
  type InsertSafetyZone,
  type GuardianResponse,
  type InsertGuardianResponse,
  type AiInteraction,
  type InsertAiInteraction,
  type EvidenceVault,
  type InsertEvidenceVault
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, inArray, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Guardian operations
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  getGuardianByUserId(userId: string): Promise<Guardian | undefined>;
  getNearbyGuardians(lat: number, lng: number, radiusKm: number): Promise<Guardian[]>;
  updateGuardianStatus(id: string, isActive: boolean): Promise<Guardian | undefined>;

  // Emergency operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlert(id: string): Promise<EmergencyAlert | undefined>;
  getUserEmergencyAlerts(userId: string): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: string, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined>;
  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;

  // Biometric operations
  addBiometricData(data: InsertBiometricData): Promise<BiometricData>;
  getLatestBiometricData(userId: string): Promise<BiometricData | undefined>;
  getUserBiometricHistory(userId: string, limit?: number): Promise<BiometricData[]>;

  // Safety zones
  getSafetyZones(): Promise<SafetyZone[]>;
  createSafetyZone(zone: InsertSafetyZone): Promise<SafetyZone>;
  getSafetyZoneByLocation(lat: number, lng: number): Promise<SafetyZone | undefined>;

  // Guardian responses
  createGuardianResponse(response: InsertGuardianResponse): Promise<GuardianResponse>;
  getAlertResponses(alertId: string): Promise<GuardianResponse[]>;

  // AI interactions
  addAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getUserAiInteractions(userId: string, limit?: number): Promise<AiInteraction[]>;

  // Evidence vault
  addEvidence(evidence: InsertEvidenceVault): Promise<EvidenceVault>;
  getAlertEvidence(alertId: string): Promise<EvidenceVault[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Guardian operations
  async createGuardian(insertGuardian: InsertGuardian): Promise<Guardian> {
    const [guardian] = await db
      .insert(guardians)
      .values({
        ...insertGuardian,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return guardian;
  }

  async getGuardianByUserId(userId: string): Promise<Guardian | undefined> {
    const [guardian] = await db.select().from(guardians).where(eq(guardians.userId, userId));
    return guardian || undefined;
  }

  async getNearbyGuardians(lat: number, lng: number, radiusKm: number): Promise<Guardian[]> {
    // This is a simplified version - in production, use PostGIS for proper geospatial queries
    const activeGuardians = await db
      .select()
      .from(guardians)
      .where(and(
        eq(guardians.isActive, true),
        eq(guardians.verificationStatus, "verified")
      ));
    
    return activeGuardians.filter(guardian => {
      if (!guardian.location) return false;
      const location = guardian.location as { lat: number; lng: number };
      const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
      return distance <= radiusKm;
    });
  }

  async updateGuardianStatus(id: string, isActive: boolean): Promise<Guardian | undefined> {
    const [guardian] = await db
      .update(guardians)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(guardians.id, id))
      .returning();
    return guardian || undefined;
  }

  // Emergency operations
  async createEmergencyAlert(insertAlert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [alert] = await db
      .insert(emergencyAlerts)
      .values({
        ...insertAlert,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return alert;
  }

  async getEmergencyAlert(id: string): Promise<EmergencyAlert | undefined> {
    const [alert] = await db.select().from(emergencyAlerts).where(eq(emergencyAlerts.id, id));
    return alert || undefined;
  }

  async getUserEmergencyAlerts(userId: string): Promise<EmergencyAlert[]> {
    return await db
      .select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async updateEmergencyAlert(id: string, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined> {
    const [alert] = await db
      .update(emergencyAlerts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db
      .select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.status, "active"))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  // Biometric operations
  async addBiometricData(data: InsertBiometricData): Promise<BiometricData> {
    const [biometric] = await db
      .insert(biometricData)
      .values({
        ...data,
        timestamp: new Date(),
      })
      .returning();
    return biometric;
  }

  async getLatestBiometricData(userId: string): Promise<BiometricData | undefined> {
    const [latest] = await db
      .select()
      .from(biometricData)
      .where(eq(biometricData.userId, userId))
      .orderBy(desc(biometricData.timestamp))
      .limit(1);
    return latest || undefined;
  }

  async getUserBiometricHistory(userId: string, limit = 100): Promise<BiometricData[]> {
    return await db
      .select()
      .from(biometricData)
      .where(eq(biometricData.userId, userId))
      .orderBy(desc(biometricData.timestamp))
      .limit(limit);
  }

  // Safety zones
  async getSafetyZones(): Promise<SafetyZone[]> {
    return await db.select().from(safetyZones);
  }

  async createSafetyZone(zone: InsertSafetyZone): Promise<SafetyZone> {
    const [safetyZone] = await db
      .insert(safetyZones)
      .values({
        ...zone,
        createdAt: new Date(),
        lastUpdated: new Date(),
      })
      .returning();
    return safetyZone;
  }

  async getSafetyZoneByLocation(lat: number, lng: number): Promise<SafetyZone | undefined> {
    // Simplified point-in-polygon check - in production, use PostGIS
    const zones = await this.getSafetyZones();
    // TODO: Implement proper geospatial query
    return zones[0] || undefined;
  }

  // Guardian responses
  async createGuardianResponse(response: InsertGuardianResponse): Promise<GuardianResponse> {
    const [guardianResponse] = await db
      .insert(guardianResponses)
      .values({
        ...response,
        createdAt: new Date(),
      })
      .returning();
    return guardianResponse;
  }

  async getAlertResponses(alertId: string): Promise<GuardianResponse[]> {
    return await db
      .select()
      .from(guardianResponses)
      .where(eq(guardianResponses.alertId, alertId))
      .orderBy(asc(guardianResponses.createdAt));
  }

  // AI interactions
  async addAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const [aiInteraction] = await db
      .insert(aiInteractions)
      .values({
        ...interaction,
        timestamp: new Date(),
      })
      .returning();
    return aiInteraction;
  }

  async getUserAiInteractions(userId: string, limit = 50): Promise<AiInteraction[]> {
    return await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.userId, userId))
      .orderBy(desc(aiInteractions.timestamp))
      .limit(limit);
  }

  // Evidence vault
  async addEvidence(evidence: InsertEvidenceVault): Promise<EvidenceVault> {
    const [evidenceRecord] = await db
      .insert(evidenceVault)
      .values({
        ...evidence,
        createdAt: new Date(),
      })
      .returning();
    return evidenceRecord;
  }

  async getAlertEvidence(alertId: string): Promise<EvidenceVault[]> {
    return await db
      .select()
      .from(evidenceVault)
      .where(eq(evidenceVault.alertId, alertId))
      .orderBy(desc(evidenceVault.createdAt));
  }

  // Utility method for distance calculation
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
}

export const storage = new DatabaseStorage();
