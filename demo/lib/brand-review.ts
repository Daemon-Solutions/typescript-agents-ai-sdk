import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { parsePRUrl, getPRContext, getFileContent, postReview } from "./github-tools.js";
import { parseDeck } from "./slide-parser.js";
import { buildSystemPrompt, type ReviewScope } from "./brand-constants.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function reviewDeck(markdown: string, scope: ReviewScope, deckName: string): Promise<string> {
  const deckData = parseDeck(markdown);
  const systemPrompt = buildSystemPrompt(scope);

  console.log(`\n📊 Parsed ${deckData.slides.length} slides from "${deckName}"`);
  console.log(`🔍 Review scope: ${scope}\n`);

  const { text } = await generateText({
    model: openrouter("openai/gpt-oss-120b:free"),
    system: systemPrompt,
    prompt: `Review this Slidev deck for Daemon brand compliance.

Deck name: ${deckName}
Deck metadata:
${JSON.stringify({ theme: deckData.theme, title: deckData.title, fontSans: deckData.fontSans, fontMono: deckData.fontMono, primaryColor: deckData.primaryColor }, null, 2)}

Slides:
${JSON.stringify(deckData.slides.map((s) => ({
  index: s.index,
  layout: s.layout,
  class: s.class,
  headings: s.headings,
  bodyText: s.bodyText.slice(0, 500),
  imageRefs: s.imageRefs,
  hasScribbleDecoration: s.hasScribbleDecoration,
  scribbleFile: s.scribbleFile,
  hasSpeakerNotes: !!s.speakerNotes,
})), null, 2)}`,
  });

  return text;
}

export async function runBrandReview(options: {
  mode: "pr" | "local";
  scope: ReviewScope;
  prUrl?: string;
  deckName?: string;
}) {
  const { mode, scope, prUrl, deckName } = options;

  if (mode === "pr") {
    if (!prUrl) throw new Error("PR URL is required in PR mode");

    const { owner, repo, pull_number } = parsePRUrl(prUrl);
    const context = await getPRContext(owner, repo, pull_number);

    // Find slides.md files in the PR
    const slideFiles = context.files.filter((f) =>
      /decks\/[^/]+\/slides\.md$/.test(f.filename)
    );

    if (slideFiles.length === 0) {
      console.log("No deck files (decks/*/slides.md) found in this PR.");
      return;
    }

    console.log(`Found ${slideFiles.length} deck file(s) in PR #${pull_number}`);

    const reviews: string[] = [];

    for (const file of slideFiles) {
      const name = file.filename.match(/decks\/([^/]+)\//)?.[1] ?? file.filename;
      console.log(`\n--- Reviewing: ${file.filename} ---`);

      // Fetch full file content from the PR's head branch
      const markdown = await getFileContent(owner, repo, context.head, file.filename);
      const result = await reviewDeck(markdown, scope, name);

      console.log(result);
      reviews.push(`## ${file.filename}\n\n${result}`);
    }

    // Post combined review to the PR
    const body = `# Daemon Brand Compliance Review\n\n${reviews.join("\n\n---\n\n")}`;
    const reviewResult = await postReview(owner, repo, pull_number, body);
    console.log(`\n✅ Posted review to PR #${pull_number} (review ID: ${reviewResult.id})`);
  } else {
    // Local mode
    if (!deckName) throw new Error("DECK name is required in local mode");

    const slidesPath = path.resolve(process.cwd(), "..", "decks", deckName, "slides.md");
    const markdown = await fs.readFile(slidesPath, "utf-8");

    console.log(`--- Reviewing local deck: ${deckName} ---`);
    const result = await reviewDeck(markdown, scope, deckName);
    console.log(result);
  }
}
