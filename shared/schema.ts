import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const debateTopics = pgTable("debate_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const debateSessions = pgTable("debate_sessions", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").references(() => debateTopics.id),
  topicTitle: text("topic_title").notNull(),
  format: text("format").notNull(),
  userPosition: text("user_position").notNull(),
  aiPosition: text("ai_position").notNull(),
  status: text("status").notNull().default("active"),
  round: integer("round").notNull().default(1),
  totalRounds: integer("total_rounds").notNull().default(3),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

export const debateMessages = pgTable("debate_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => debateSessions.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  round: integer("round").notNull().default(1),
  phase: text("phase").notNull().default("opening"),
  analysisData: jsonb("analysis_data"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const argumentAnalyses = pgTable("argument_analyses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => debateSessions.id),
  messageId: integer("message_id").references(() => debateMessages.id),
  logicScore: integer("logic_score"),
  evidenceScore: integer("evidence_score"),
  clarityScore: integer("clarity_score"),
  persuasivenessScore: integer("persuasiveness_score"),
  overallScore: integer("overall_score"),
  fallacies: text("fallacies").array().default(sql`ARRAY[]::text[]`),
  strengths: text("strengths").array().default(sql`ARRAY[]::text[]`),
  weaknesses: text("weaknesses").array().default(sql`ARRAY[]::text[]`),
  suggestions: text("suggestions").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  totalDebates: integer("total_debates").notNull().default(0),
  wonDebates: integer("won_debates").notNull().default(0),
  avgScore: integer("avg_score").notNull().default(0),
  totalArguments: integer("total_arguments").notNull().default(0),
  favoriteCategory: text("favorite_category"),
  streak: integer("streak").notNull().default(0),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDebateTopicSchema = createInsertSchema(debateTopics).omit({ id: true, createdAt: true });
export const insertDebateSessionSchema = createInsertSchema(debateSessions).omit({ id: true, createdAt: true, completedAt: true });
export const insertDebateMessageSchema = createInsertSchema(debateMessages).omit({ id: true, createdAt: true });
export const insertArgumentAnalysisSchema = createInsertSchema(argumentAnalyses).omit({ id: true, createdAt: true });

export type DebateTopic = typeof debateTopics.$inferSelect;
export type InsertDebateTopic = z.infer<typeof insertDebateTopicSchema>;
export type DebateSession = typeof debateSessions.$inferSelect;
export type InsertDebateSession = z.infer<typeof insertDebateSessionSchema>;
export type DebateMessage = typeof debateMessages.$inferSelect;
export type InsertDebateMessage = z.infer<typeof insertDebateMessageSchema>;
export type ArgumentAnalysis = typeof argumentAnalyses.$inferSelect;
export type InsertArgumentAnalysis = z.infer<typeof insertArgumentAnalysisSchema>;
export type UserStats = typeof userStats.$inferSelect;
