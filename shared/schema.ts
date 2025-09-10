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

// Advanced AI and Safety Features Tables

export const cctvFeeds = pgTable("cctv_feeds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  feedId: text("feed_id").notNull().unique(),
  location: jsonb("location").notNull(), // { lat, lng, address, area }
  status: text("status").notNull().default("active"), // active, offline, maintenance
  feedUrl: text("feed_url"),
  aiAnalysisEnabled: boolean("ai_analysis_enabled").default(true),
  crowdDensityCapable: boolean("crowd_density_capable").default(true),
  faceDetectionCapable: boolean("face_detection_capable").default(false),
  lastAnalysis: timestamp("last_analysis"),
  authority: text("authority"), // police, municipality, private
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const crowdAnalysis = pgTable("crowd_analysis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cctvFeedId: uuid("cctv_feed_id").references(() => cctvFeeds.id),
  location: jsonb("location").notNull(),
  crowdDensity: text("crowd_density").notNull(), // low, medium, high, critical
  crowdSize: integer("crowd_size"),
  movementPattern: text("movement_pattern"), // normal, agitated, panic, dispersing, gathering
  aggressionLevel: text("aggression_level").default("none"), // none, low, medium, high, dangerous
  emotionalState: text("emotional_state"), // calm, excited, tense, fearful, angry
  riskScore: real("risk_score").notNull(), // 0-100
  threatIndicators: jsonb("threat_indicators"), // array of detected threats
  recommendations: jsonb("recommendations"),
  aiConfidence: real("ai_confidence").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const threatDetections = pgTable("threat_detections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  crowdAnalysisId: uuid("crowd_analysis_id").references(() => crowdAnalysis.id),
  location: jsonb("location").notNull(),
  threatType: text("threat_type").notNull(), // suspicious_behavior, weapon_detected, fight, harassment, stalking
  severity: text("severity").notNull(), // low, medium, high, critical
  confidence: real("confidence").notNull(),
  description: text("description"),
  evidenceUrls: jsonb("evidence_urls"), // array of URLs to evidence
  targetGender: text("target_gender"), // male, female, unknown
  isWomenTargeted: boolean("is_women_targeted").default(false),
  alertGenerated: boolean("alert_generated").default(false),
  responseStatus: text("response_status").default("pending"), // pending, investigating, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

export const satelliteBackup = pgTable("satellite_backup", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  alertId: uuid("alert_id").references(() => emergencyAlerts.id),
  messageType: text("message_type").notNull(), // emergency_alert, status_update, location_share
  messageContent: jsonb("message_content").notNull(),
  satelliteProvider: text("satellite_provider"), // starlink, iridium, globalstar
  transmissionStatus: text("transmission_status").default("pending"), // pending, sent, delivered, failed
  location: jsonb("location"),
  batteryLevel: integer("battery_level"),
  signalStrength: integer("signal_strength"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const arSafetyData = pgTable("ar_safety_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  location: jsonb("location").notNull(),
  arFeature: text("ar_feature").notNull(), // path_highlight, threat_overlay, safe_zone_guide, guardian_indicator
  arData: jsonb("ar_data").notNull(),
  visibilityRadius: real("visibility_radius").default(100), // meters
  priority: text("priority").default("medium"), // low, medium, high, critical
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quantumBlockchain = pgTable("quantum_blockchain", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceId: uuid("evidence_id").references(() => evidenceVault.id).notNull(),
  blockHash: text("block_hash").notNull().unique(),
  previousBlockHash: text("previous_block_hash"),
  merkleRoot: text("merkle_root").notNull(),
  quantumSignature: text("quantum_signature").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  validatorNodes: jsonb("validator_nodes"),
  consensusProof: text("consensus_proof"),
  isQuantumResistant: boolean("is_quantum_resistant").default(true),
  chainVerified: boolean("chain_verified").default(false),
});

export const predictiveAnalytics = pgTable("predictive_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  predictionType: text("prediction_type").notNull(), // route_safety, time_risk, location_risk, behavior_pattern
  location: jsonb("location"),
  timeframe: text("timeframe"), // next_hour, next_day, next_week
  riskProbability: real("risk_probability").notNull(), // 0-1
  riskFactors: jsonb("risk_factors"),
  recommendations: jsonb("recommendations"),
  accuracyScore: real("accuracy_score"),
  modelVersion: text("model_version"),
  createdAt: timestamp("created_at").defaultNow(),
  validatedAt: timestamp("validated_at"),
});

export const smartWearables = pgTable("smart_wearables", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  deviceType: text("device_type").notNull(), // smart_fabric, panic_jewelry, fitness_tracker, smartwatch
  deviceId: text("device_id").notNull().unique(),
  isActive: boolean("is_active").default(true),
  batteryLevel: integer("battery_level"),
  lastHeartbeat: timestamp("last_heartbeat"),
  capabilities: jsonb("capabilities"), // array of supported features
  firmwareVersion: text("firmware_version"),
  encryptionKey: text("encryption_key"),
  emergencyProtocol: jsonb("emergency_protocol"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const evidenceVaultRelations = relations(evidenceVault, ({ one, many }) => ({
  alert: one(emergencyAlerts, { fields: [evidenceVault.alertId], references: [emergencyAlerts.id] }),
  user: one(users, { fields: [evidenceVault.userId], references: [users.id] }),
  quantumBlocks: many(quantumBlockchain),
}));

export const crowdAnalysisRelations = relations(crowdAnalysis, ({ one, many }) => ({
  cctvFeed: one(cctvFeeds, { fields: [crowdAnalysis.cctvFeedId], references: [cctvFeeds.id] }),
  threatDetections: many(threatDetections),
}));

export const threatDetectionsRelations = relations(threatDetections, ({ one }) => ({
  crowdAnalysis: one(crowdAnalysis, { fields: [threatDetections.crowdAnalysisId], references: [crowdAnalysis.id] }),
}));

export const satelliteBackupRelations = relations(satelliteBackup, ({ one }) => ({
  user: one(users, { fields: [satelliteBackup.userId], references: [users.id] }),
  alert: one(emergencyAlerts, { fields: [satelliteBackup.alertId], references: [emergencyAlerts.id] }),
}));

export const arSafetyDataRelations = relations(arSafetyData, ({ one }) => ({
  user: one(users, { fields: [arSafetyData.userId], references: [users.id] }),
}));

export const quantumBlockchainRelations = relations(quantumBlockchain, ({ one }) => ({
  evidence: one(evidenceVault, { fields: [quantumBlockchain.evidenceId], references: [evidenceVault.id] }),
}));

export const predictiveAnalyticsRelations = relations(predictiveAnalytics, ({ one }) => ({
  user: one(users, { fields: [predictiveAnalytics.userId], references: [users.id] }),
}));

export const smartWearablesRelations = relations(smartWearables, ({ one }) => ({
  user: one(users, { fields: [smartWearables.userId], references: [users.id] }),
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

// Advanced features insert schemas
export const insertCctvFeedSchema = createInsertSchema(cctvFeeds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrowdAnalysisSchema = createInsertSchema(crowdAnalysis).omit({
  id: true,
  timestamp: true,
});

export const insertThreatDetectionSchema = createInsertSchema(threatDetections).omit({
  id: true,
  createdAt: true,
});

export const insertSatelliteBackupSchema = createInsertSchema(satelliteBackup).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
});

export const insertArSafetyDataSchema = createInsertSchema(arSafetyData).omit({
  id: true,
  createdAt: true,
});

export const insertQuantumBlockchainSchema = createInsertSchema(quantumBlockchain).omit({
  id: true,
  timestamp: true,
});

export const insertPredictiveAnalyticsSchema = createInsertSchema(predictiveAnalytics).omit({
  id: true,
  createdAt: true,
  validatedAt: true,
});

export const insertSmartWearableSchema = createInsertSchema(smartWearables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Advanced features types
export type CctvFeed = typeof cctvFeeds.$inferSelect;
export type InsertCctvFeed = z.infer<typeof insertCctvFeedSchema>;
export type CrowdAnalysis = typeof crowdAnalysis.$inferSelect;
export type InsertCrowdAnalysis = z.infer<typeof insertCrowdAnalysisSchema>;
export type ThreatDetection = typeof threatDetections.$inferSelect;
export type InsertThreatDetection = z.infer<typeof insertThreatDetectionSchema>;
export type SatelliteBackup = typeof satelliteBackup.$inferSelect;
export type InsertSatelliteBackup = z.infer<typeof insertSatelliteBackupSchema>;
export type ArSafetyData = typeof arSafetyData.$inferSelect;
export type InsertArSafetyData = z.infer<typeof insertArSafetyDataSchema>;
export type QuantumBlockchain = typeof quantumBlockchain.$inferSelect;
export type InsertQuantumBlockchain = z.infer<typeof insertQuantumBlockchainSchema>;
export type PredictiveAnalytics = typeof predictiveAnalytics.$inferSelect;
export type InsertPredictiveAnalytics = z.infer<typeof insertPredictiveAnalyticsSchema>;
export type SmartWearable = typeof smartWearables.$inferSelect;
export type InsertSmartWearable = z.infer<typeof insertSmartWearableSchema>;
