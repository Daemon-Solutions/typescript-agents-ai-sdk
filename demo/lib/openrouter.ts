import { generateText, stepCountIs } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { fetchPRTool, postReviewTool } from "./github-tools.js";
import { SYSTEM_PROMPT } from "./constants.js";

export async function runOpenrouterProvider(prUrl: string) {
  console.log("🔧 Approach A: Custom tools + OpenRouter\n");

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const { text, steps } = await generateText({
    model: openrouter("z-ai/glm-4.5-air:free"),
    system: SYSTEM_PROMPT,
    prompt: `
    
    Review this pull request: ${prUrl}

    First, fetch the PR context using the fetchPR tool.
    Then analyze the changes and post a review using the postReview tool.
    
    `,
    tools: { fetchPR: fetchPRTool, postReview: postReviewTool },
    stopWhen: stepCountIs(5),
  });

  console.log(`✅ Completed in ${steps.length} step(s)\n`);
  console.log(text);
}