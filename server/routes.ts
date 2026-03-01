import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIArgument, analyzeArgument, generateDebateFeedback, generateDebateTopic, generateCounterArguments } from "./openai";
import { insertDebateSessionSchema, insertDebateTopicSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Topics ──────────────────────────────────────────────
  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await storage.getTopics();
      res.json(topics);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req, res) => {
    try {
      const topic = await storage.getTopic(Number(req.params.id));
      if (!topic) return res.status(404).json({ error: "Topic not found" });
      res.json(topic);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch topic" });
    }
  });

  app.post("/api/topics/generate", async (req, res) => {
    try {
      const { category } = req.body;
      if (!category) return res.status(400).json({ error: "Category required" });
      const existingTopics = await storage.getTopics();
      const existingTitles = existingTopics.map(t => t.title);
      const generated = await generateDebateTopic(category, existingTitles);
      if (existingTitles.some(t => t.toLowerCase() === generated.title.toLowerCase())) {
        return res.status(409).json({ error: "Generated topic already exists. Try again." });
      }
      const topic = await storage.createTopic({ ...generated, category });
      res.json(topic);
    } catch (e) {
      res.status(500).json({ error: "Failed to generate topic" });
    }
  });

  app.post("/api/topics/custom", async (req, res) => {
    try {
      const { title, category, difficulty } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: "Title required" });
      const existingTopics = await storage.getTopics();
      if (existingTopics.some(t => t.title.toLowerCase() === title.trim().toLowerCase())) {
        return res.status(409).json({ error: "A topic with this title already exists" });
      }
      const topic = await storage.createTopic({
        title: title.trim(),
        description: `Custom debate topic in ${category || "General"}`,
        category: category || "Ethics & Philosophy",
        difficulty: difficulty || "intermediate",
        tags: [category || "Custom"],
      });
      res.json(topic);
    } catch (e) {
      res.status(500).json({ error: "Failed to create custom topic" });
    }
  });

  // ── Sessions ─────────────────────────────────────────────
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getSession(Number(req.params.id));
      if (!session) return res.status(404).json({ error: "Session not found" });
      const messages = await storage.getSessionMessages(session.id);
      const analyses = await storage.getSessionAnalyses(session.id);
      res.json({ ...session, messages, analyses });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const data = insertDebateSessionSchema.parse(req.body);
      const session = await storage.createSession(data);

      // Generate AI opening statement
      const aiOpening = await generateAIArgument(
        session.topicTitle,
        session.aiPosition,
        "opening",
        1,
        [],
        session.format
      );

      await storage.createMessage({
        sessionId: session.id,
        role: "assistant",
        content: aiOpening,
        round: 1,
        phase: "opening",
      });

      res.json(session);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      await storage.deleteSession(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // ── Debate Messages ───────────────────────────────────────
  app.post("/api/sessions/:id/argue", async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      const { argument, phase } = req.body;

      if (!argument?.trim()) return res.status(400).json({ error: "Argument required" });

      const session = await storage.getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.status !== "active") return res.status(400).json({ error: "Session is not active" });

      // Save user argument
      const userMessage = await storage.createMessage({
        sessionId,
        role: "user",
        content: argument,
        round: session.round,
        phase: phase || "rebuttal",
      });

      // Analyze user argument
      const analysis = await analyzeArgument(argument, session.topicTitle, session.userPosition, phase || "rebuttal");
      await storage.createAnalysis({
        sessionId,
        messageId: userMessage.id,
        ...analysis,
      });

      // Get conversation history
      const messages = await storage.getSessionMessages(sessionId);
      const history = messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

      // Generate AI response
      const aiResponse = await generateAIArgument(
        session.topicTitle,
        session.aiPosition,
        phase || "rebuttal",
        session.round,
        history,
        session.format
      );

      const aiMessage = await storage.createMessage({
        sessionId,
        role: "assistant",
        content: aiResponse,
        round: session.round,
        phase: phase || "rebuttal",
      });

      // Update stats
      const stats = await storage.getUserStats();
      await storage.upsertUserStats({
        totalArguments: (stats?.totalArguments || 0) + 1,
      });

      res.json({
        userMessage,
        aiMessage,
        analysis,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to process argument" });
    }
  });

  // ── Complete Session ─────────────────────────────────────
  app.post("/api/sessions/:id/complete", async (req, res) => {
    try {
      const sessionId = Number(req.params.id);
      const session = await storage.getSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const messages = await storage.getSessionMessages(sessionId);
      const analyses = await storage.getSessionAnalyses(sessionId);

      const { feedback, score, winner } = await generateDebateFeedback(
        session.topicTitle,
        session.userPosition,
        messages.map(m => ({ role: m.role, content: m.content })),
        analyses
      );

      const updated = await storage.updateSession(sessionId, {
        status: "completed",
        feedback,
        score,
        completedAt: new Date(),
      });

      // Update user stats
      const stats = await storage.getUserStats();
      const totalDebates = (stats?.totalDebates || 0) + 1;
      const wonDebates = (stats?.wonDebates || 0) + (winner === "user" ? 1 : 0);
      const avgScore = stats?.avgScore
        ? Math.round((stats.avgScore * (totalDebates - 1) + score) / totalDebates)
        : score;

      await storage.upsertUserStats({
        totalDebates,
        wonDebates,
        avgScore,
        streak: winner === "user" ? (stats?.streak || 0) + 1 : 0,
      });

      res.json({ session: updated, feedback, score, winner });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to complete session" });
    }
  });

  // ── Standalone Argument Analysis (for Practice Mode) ─────
  app.post("/api/analyze-argument", async (req, res) => {
    try {
      const { argument, topic, position, phase } = req.body;
      if (!argument?.trim()) return res.status(400).json({ error: "Argument required" });

      const analysis = await analyzeArgument(
        argument,
        topic || "General debate topic",
        position || "proposition",
        phase || "rebuttal"
      );

      res.json({ analysis });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to analyze argument" });
    }
  });

  // ── Counter Arguments ────────────────────────────────────
  app.post("/api/counter-arguments", async (req, res) => {
    try {
      const { argument, topic, position } = req.body;
      if (!argument || !topic || !position) return res.status(400).json({ error: "Missing fields" });

      const counterArguments = await generateCounterArguments(argument, topic, position);
      res.json({ counterArguments });
    } catch (e) {
      res.status(500).json({ error: "Failed to generate counter arguments" });
    }
  });

  // ── User Stats ───────────────────────────────────────────
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats || { totalDebates: 0, wonDebates: 0, avgScore: 0, totalArguments: 0, streak: 0 });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
