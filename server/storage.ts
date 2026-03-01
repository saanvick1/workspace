import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  type User, type InsertUser,
  type DebateTopic, type InsertDebateTopic,
  type DebateSession, type InsertDebateSession,
  type DebateMessage, type InsertDebateMessage,
  type ArgumentAnalysis, type InsertArgumentAnalysis,
  type UserStats,
  users, debateTopics, debateSessions, debateMessages, argumentAnalyses, userStats
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTopics(): Promise<DebateTopic[]>;
  getTopic(id: number): Promise<DebateTopic | undefined>;
  createTopic(topic: InsertDebateTopic): Promise<DebateTopic>;

  getSessions(): Promise<DebateSession[]>;
  getSession(id: number): Promise<DebateSession | undefined>;
  createSession(session: InsertDebateSession): Promise<DebateSession>;
  updateSession(id: number, updates: Partial<DebateSession>): Promise<DebateSession | undefined>;
  deleteSession(id: number): Promise<void>;

  getSessionMessages(sessionId: number): Promise<DebateMessage[]>;
  createMessage(message: InsertDebateMessage): Promise<DebateMessage>;

  createAnalysis(analysis: InsertArgumentAnalysis): Promise<ArgumentAnalysis>;
  getSessionAnalyses(sessionId: number): Promise<ArgumentAnalysis[]>;

  getUserStats(): Promise<UserStats | undefined>;
  upsertUserStats(stats: Partial<UserStats>): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTopics(): Promise<DebateTopic[]> {
    return db.select().from(debateTopics).orderBy(debateTopics.createdAt);
  }

  async getTopic(id: number): Promise<DebateTopic | undefined> {
    const [topic] = await db.select().from(debateTopics).where(eq(debateTopics.id, id));
    return topic;
  }

  async createTopic(topic: InsertDebateTopic): Promise<DebateTopic> {
    const [created] = await db.insert(debateTopics).values(topic).returning();
    return created;
  }

  async getSessions(): Promise<DebateSession[]> {
    return db.select().from(debateSessions).orderBy(desc(debateSessions.createdAt));
  }

  async getSession(id: number): Promise<DebateSession | undefined> {
    const [session] = await db.select().from(debateSessions).where(eq(debateSessions.id, id));
    return session;
  }

  async createSession(session: InsertDebateSession): Promise<DebateSession> {
    const [created] = await db.insert(debateSessions).values(session).returning();
    return created;
  }

  async updateSession(id: number, updates: Partial<DebateSession>): Promise<DebateSession | undefined> {
    const [updated] = await db.update(debateSessions).set(updates).where(eq(debateSessions.id, id)).returning();
    return updated;
  }

  async deleteSession(id: number): Promise<void> {
    await db.delete(debateMessages).where(eq(debateMessages.sessionId, id));
    await db.delete(argumentAnalyses).where(eq(argumentAnalyses.sessionId, id));
    await db.delete(debateSessions).where(eq(debateSessions.id, id));
  }

  async getSessionMessages(sessionId: number): Promise<DebateMessage[]> {
    return db.select().from(debateMessages).where(eq(debateMessages.sessionId, sessionId)).orderBy(debateMessages.createdAt);
  }

  async createMessage(message: InsertDebateMessage): Promise<DebateMessage> {
    const [created] = await db.insert(debateMessages).values(message).returning();
    return created;
  }

  async createAnalysis(analysis: InsertArgumentAnalysis): Promise<ArgumentAnalysis> {
    const [created] = await db.insert(argumentAnalyses).values(analysis).returning();
    return created;
  }

  async getSessionAnalyses(sessionId: number): Promise<ArgumentAnalysis[]> {
    return db.select().from(argumentAnalyses).where(eq(argumentAnalyses.sessionId, sessionId)).orderBy(desc(argumentAnalyses.createdAt));
  }

  async getUserStats(): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).limit(1);
    return stats;
  }

  async upsertUserStats(stats: Partial<UserStats>): Promise<UserStats> {
    const existing = await this.getUserStats();
    if (existing) {
      const [updated] = await db.update(userStats).set({ ...stats, updatedAt: new Date() }).where(eq(userStats.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(userStats).values({
        totalDebates: 0,
        wonDebates: 0,
        avgScore: 0,
        totalArguments: 0,
        streak: 0,
        ...stats,
      }).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
