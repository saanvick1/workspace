import { db } from "./db";
import { debateTopics, userStats } from "@shared/schema";
import { sql } from "drizzle-orm";

const seedTopics = [
  {
    title: "This House Would ban social media for children under 16",
    category: "Technology & Society",
    difficulty: "intermediate",
    description: "Social media platforms have profoundly changed how young people interact and develop. This debate explores whether government intervention to restrict access is justified to protect mental health and development.",
    tags: ["social media", "children", "regulation", "mental health", "technology"],
  },
  {
    title: "This House Believes that artificial intelligence will do more harm than good",
    category: "Technology & Society",
    difficulty: "advanced",
    description: "AI is reshaping every industry and human endeavor. This critical debate examines whether the benefits of AI development outweigh the existential risks, job displacement, and loss of human autonomy it may bring.",
    tags: ["AI", "technology", "ethics", "employment", "future"],
  },
  {
    title: "This House Would implement a Universal Basic Income",
    category: "Economics & Policy",
    difficulty: "intermediate",
    description: "As automation threatens traditional employment, UBI has emerged as a bold policy proposal. This debate weighs the economic benefits of guaranteed income against concerns about cost, work incentives, and social impact.",
    tags: ["UBI", "economics", "poverty", "automation", "welfare"],
  },
  {
    title: "This House Believes climate change should be addressed through carbon taxes rather than regulations",
    category: "Environment",
    difficulty: "advanced",
    description: "Two major approaches dominate climate policy debates: market-based mechanisms like carbon taxes versus direct regulations. This debate explores which approach more effectively reduces emissions while minimizing economic disruption.",
    tags: ["climate change", "carbon tax", "environment", "policy", "economics"],
  },
  {
    title: "This House Would legalize all recreational drugs",
    category: "Health & Society",
    difficulty: "advanced",
    description: "Drug prohibition has been challenged as ineffective and harmful. This debate examines whether full legalization would reduce crime, improve public health outcomes, and respect individual liberty compared to the current prohibitionist approach.",
    tags: ["drugs", "legalization", "public health", "crime", "liberty"],
  },
  {
    title: "This House Believes nuclear power is essential for combating climate change",
    category: "Environment",
    difficulty: "intermediate",
    description: "Nuclear power offers low-carbon baseload electricity but carries concerns about safety, waste, and cost. This debate explores whether nuclear must be part of a realistic clean energy transition strategy.",
    tags: ["nuclear", "energy", "climate", "safety", "environment"],
  },
  {
    title: "This House Would make voting mandatory in democracies",
    category: "Politics & Governance",
    difficulty: "beginner",
    description: "Low voter turnout threatens democratic legitimacy in many countries. Compulsory voting laws exist in over 20 countries. This debate explores whether the state should compel civic participation or respect the right not to vote.",
    tags: ["voting", "democracy", "governance", "civic duty", "rights"],
  },
  {
    title: "This House Would abolish all animal agriculture",
    category: "Health & Society",
    difficulty: "advanced",
    description: "Animal agriculture contributes significantly to greenhouse emissions, uses vast land resources, and raises serious animal welfare concerns. This debate examines whether a complete transition away from animal products is desirable and feasible.",
    tags: ["veganism", "animal rights", "environment", "food", "ethics"],
  },
  {
    title: "This House Believes that space exploration should be left to private companies",
    category: "Technology & Society",
    difficulty: "beginner",
    description: "Companies like SpaceX and Blue Origin have dramatically changed the space industry. This debate explores whether privatizing space exploration accelerates progress and innovation or undermines the public interest in peaceful scientific discovery.",
    tags: ["space", "private sector", "government", "innovation", "technology"],
  },
  {
    title: "This House Would require rich countries to accept unlimited climate refugees",
    category: "Politics & Governance",
    difficulty: "advanced",
    description: "Climate change is already displacing millions of people. This debate examines wealthy nations' moral obligations to those displaced by climate events they disproportionately caused, weighed against sovereignty and capacity concerns.",
    tags: ["climate refugees", "immigration", "global justice", "sovereignty", "climate"],
  },
];

export async function seedDatabase() {
  try {
    const existing = await db.select().from(debateTopics).limit(1);
    if (existing.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding debate topics...");
    for (const topic of seedTopics) {
      await db.insert(debateTopics).values(topic).onConflictDoNothing();
    }

    console.log("Seeding user stats...");
    await db.insert(userStats).values({
      totalDebates: 0,
      wonDebates: 0,
      avgScore: 0,
      totalArguments: 0,
      streak: 0,
    }).onConflictDoNothing();

    console.log("Seed complete!");
  } catch (e) {
    console.error("Seed error:", e);
  }
}
