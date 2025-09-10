import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer, 
  real, 
  jsonb,
  uuid
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  dateOfBirth: text("date_of_birth"),
  medicalInfo: jsonb("medical_info"),
  emergencyContacts: jsonb("emergency_contacts"),
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, verified, rejected
  location: jsonb("location"), // { lat, lng, address }
  availabilityRadius: real("availability_radius").default(5.0), // km
  isActive: boolean("is_active").default(false),
  responseTime: integer("response_time"), // average response time in seconds
  rating: real("rating").default(5.0),
  totalResponses: integer("total_responses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  alertType: text("alert_type").notNull(), // manual, voice_stress, biometric, fall_detection, panic_gesture
  priority: text("priority").notNull().default("high"), // low, medium, high, critical
  status: text("status").notNull().default("active"), // active, responded, resolved, false_alarm
  location: jsonb("location").notNull(), // { lat, lng, address, accuracy }
  biometricData: jsonb("biometric_data"), // { heartRate, stressLevel, motionPattern }
  voiceAnalysis: jsonb("voice_analysis"), // { stressScore, confidence, transcript }
  evidenceData: jsonb("evidence_data"), // { audioUrl, videoUrl, photos, blockchainHash }
  contactsNotified: jsonb("contacts_notified"), // array of contact IDs and notification status
  guardiansAlerted: jsonb("guardians_alerted"), // array of guardian IDs and response status
  responseTime: integer("response_time"), // time to first response in seconds
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const biometricData = pgTable("biometric_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  heartRate: integer("heart_rate"),
  stressLevel: text("stress_level"), // low, normal, elevated, high, critical
  bloodPressure: text("blood_pressure"),
  temperature: real("temperature"),
  motionPattern: text("motion_pattern"), // normal, agitated, fall_detected, running
  location: jsonb("location"),
  isAnomalous: boolean("is_anomalous").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const safetyZones = pgTable("safety_zones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // safe, caution, danger, restricted
  coordinates: jsonb("coordinates").notNull(), // polygon coordinates
  description: text("description"),
  safetyScore: real("safety_score").default(5.0), // 1-10 scale
  crowdDensity: text("crowd_density").default("low"), // low, medium, high, critical
  lightingLevel: text("lighting_level").default("good"), // poor, fair, good, excellent
  policePresence: boolean("police_presence").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guardianResponses = pgTable("guardian_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: uuid("alert_id").references(() => emergencyAlerts.id).notNull(),
  guardianId: uuid("guardian_id").references(() => guardians.id).notNull(),
  responseType: text("response_type").notNull(), // accepted, declined, arrived, completed
  responseTime: integer("response_time"), // seconds from alert to response
  estimatedArrival: integer("estimated_arrival"), // seconds
  actualArrival: timestamp("actual_arrival"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInteractions = pgTable("ai_interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  interactionType: text("interaction_type").notNull(), // voice_analysis, chat, prediction, recommendation
  inputData: jsonb("input_data"),
  aiResponse: jsonb("ai_response"),
  confidence: real("confidence"),
  actionTaken: text("action_taken"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const evidenceVault = pgTable("evidence_vault", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: uuid("alert_id").references(() => emergencyAlerts.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  evidenceType: text("evidence_type").notNull(), // audio, video, photo, text, location_trace
  fileUrl: text("file_url"),
  fileHash: text("file_hash").notNull(), // for blockchain verification
  blockchainTxId: text("blockchain_tx_id"),
  metadata: jsonb("metadata"),
  isVerified: boolean("is_verified").default(false),
  accessLevel: text("access_level").default("restricted"), // public, restricted, confidential
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  guardianProfile: many(guardians),
  emergencyAlerts: many(emergencyAlerts),
  biometricData: many(biometricData),
  aiInteractions: many(aiInteractions),
  evidenceVault: many(evidenceVault),
}));

export const guardiansRelations = relations(guardians, ({ one, many }) => ({
  user: one(users, { fields: [guardians.userId], references: [users.id] }),
  responses: many(guardianResponses),
}));

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one, many }) => ({
  user: one(users, { fields: [emergencyAlerts.userId], references: [users.id] }),
  guardianResponses: many(guardianResponses),
  evidence: many(evidenceVault),
}));

export const guardianResponsesRelations = relations(guardianResponses, ({ one }) => ({
  alert: one(emergencyAlerts, { fields: [guardianResponses.alertId], references: [emergencyAlerts.id] }),
  guardian: one(guardians, { fields: [guardianResponses.guardianId], references: [guardians.id] }),
}));

export const biometricDataRelations = relations(biometricData, ({ one }) => ({
  user: one(users, { fields: [biometricData.userId], references: [users.id] }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, { fields: [aiInteractions.userId], references: [users.id] }),
}));

export const evidenceVaultRelations = relations(evidenceVault, ({ one }) => ({
  alert: one(emergencyAlerts, { fields: [evidenceVault.alertId], references: [emergencyAlerts.id] }),
  user: one(users, { fields: [evidenceVault.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBiometricDataSchema = createInsertSchema(biometricData).omit({
  id: true,
  timestamp: true,
});

export const insertSafetyZoneSchema = createInsertSchema(safetyZones).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertGuardianResponseSchema = createInsertSchema(guardianResponses).omit({
  id: true,
  createdAt: true,
});

export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  timestamp: true,
});

export const insertEvidenceVaultSchema = createInsertSchema(evidenceVault).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type BiometricData = typeof biometricData.$inferSelect;
export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type SafetyZone = typeof safetyZones.$inferSelect;
export type InsertSafetyZone = z.infer<typeof insertSafetyZoneSchema>;
export type GuardianResponse = typeof guardianResponses.$inferSelect;
export type InsertGuardianResponse = z.infer<typeof insertGuardianResponseSchema>;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;
export type EvidenceVault = typeof evidenceVault.$inferSelect;
export type InsertEvidenceVault = z.infer<typeof insertEvidenceVaultSchema>;
