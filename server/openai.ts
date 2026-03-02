import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIArgument(
  topic: string,
  position: string,
  phase: string,
  round: number,
  history: Array<{ role: string; content: string }>,
  format: string
): Promise<string> {
  const systemPrompt = `You are a world-class competitive debater participating in a ${format} debate.
Your position is: ${position} on the topic "${topic}".
This is round ${round}, phase: ${phase}.

Your role:
- Deliver compelling, well-structured arguments specific to your assigned position
- Use real evidence, statistics, and examples
- Anticipate and preemptively counter opposing arguments
- Use rhetorical techniques appropriate to the debate format
- Be assertive but logical
- Keep responses between 150-250 words for clarity

Never break character. Never agree with the opposing position. Argue your assigned side forcefully.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages,
    max_completion_tokens: 400,
    temperature: 0.8,
  } as any);

  return response.choices[0]?.message?.content || "I maintain my position on this important debate topic.";
}

export async function analyzeArgument(
  argument: string,
  topic: string,
  position: string,
  phase: string
): Promise<{
  logicScore: number;
  evidenceScore: number;
  clarityScore: number;
  persuasivenessScore: number;
  overallScore: number;
  fallacies: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const systemPrompt = `You are an expert debate judge and rhetoric coach. Analyze the following argument for a debate on "${topic}".
The debater's position is: ${position}. Phase: ${phase}.

Provide a detailed JSON analysis with these exact fields:
{
  "logicScore": <0-100 integer>,
  "evidenceScore": <0-100 integer>,
  "clarityScore": <0-100 integer>,
  "persuasivenessScore": <0-100 integer>,
  "overallScore": <0-100 integer>,
  "fallacies": ["list of logical fallacies detected, empty array if none"],
  "strengths": ["list of 2-3 specific strengths"],
  "weaknesses": ["list of 2-3 specific weaknesses or gaps"],
  "suggestions": ["list of 2-3 concrete improvement suggestions"]
}

Be specific, educational, and constructive. Score honestly.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: argument },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 600,
  } as any);

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      logicScore: Math.min(100, Math.max(0, parsed.logicScore || 70)),
      evidenceScore: Math.min(100, Math.max(0, parsed.evidenceScore || 70)),
      clarityScore: Math.min(100, Math.max(0, parsed.clarityScore || 70)),
      persuasivenessScore: Math.min(100, Math.max(0, parsed.persuasivenessScore || 70)),
      overallScore: Math.min(100, Math.max(0, parsed.overallScore || 70)),
      fallacies: Array.isArray(parsed.fallacies) ? parsed.fallacies : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return {
      logicScore: 70, evidenceScore: 70, clarityScore: 70, persuasivenessScore: 70, overallScore: 70,
      fallacies: [], strengths: ["Argument presented"], weaknesses: ["Could be stronger"], suggestions: ["Add more evidence"],
    };
  }
}

export async function generateDebateFeedback(
  topic: string,
  userPosition: string,
  messages: Array<{ role: string; content: string }>,
  analyses: Array<{ overallScore: number }>
): Promise<{ feedback: string; score: number; winner: string }> {
  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length)
    : 60;

  const systemPrompt = `You are a debate judge providing final verdict and feedback.
Topic: "${topic}". User's position: ${userPosition}.

Based on the debate performance, provide a JSON response:
{
  "feedback": "detailed 3-4 sentence feedback covering overall performance, key strengths, and areas for improvement",
  "score": <final score 0-100 based on argumentation quality>,
  "winner": "user" or "ai" based on overall debate performance
}`;

  const userMessages = messages.filter(m => m.role === "user");
  const debateSummary = userMessages.map((m, i) => `Argument ${i + 1}: ${m.content}`).join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `User arguments:\n${debateSummary}\n\nAverage argument score: ${avgScore}/100` },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 400,
  } as any);

  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      feedback: parsed.feedback || "Great debate performance! Keep practicing to improve your argumentation skills.",
      score: Math.min(100, Math.max(0, parsed.score || avgScore)),
      winner: parsed.winner === "ai" ? "ai" : "user",
    };
  } catch {
    return { feedback: "Well-argued debate!", score: avgScore, winner: "user" };
  }
}

export async function generateDebateTopic(category: string, existingTitles: string[] = []): Promise<{
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
}> {
  const avoidList = existingTitles.length > 0
    ? `\n\nIMPORTANT: Do NOT generate any of these existing topics (or close variations):\n${existingTitles.map(t => `- "${t}"`).join("\n")}`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `Generate a compelling, specific debate topic for the category: ${category}. Return JSON:
{
  "title": "motion-style debate topic starting with 'This House Would/Believes/Should' or a direct statement",
  "description": "2-3 sentence context explaining why this is an important debate topic",
  "difficulty": "beginner" or "intermediate" or "advanced",
  "tags": ["3-5 relevant tags"]
}${avoidList}`
      },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 300,
  } as any);

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  return {
    title: parsed.title || `Debate on ${category}`,
    description: parsed.description || "An important topic for discussion.",
    difficulty: parsed.difficulty || "intermediate",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [category],
  };
}

export async function generateCounterArguments(
  argument: string,
  topic: string,
  position: string
): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a debate coach. Generate 3 strong counter-arguments against the provided argument on topic "${topic}". The opponent holds position: ${position}. Return JSON: {"counterArguments": ["arg1", "arg2", "arg3"]}`
      },
      { role: "user", content: argument },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 400,
  } as any);

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  return Array.isArray(parsed.counterArguments) ? parsed.counterArguments : [];
}
