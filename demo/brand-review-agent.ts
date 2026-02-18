import { runBrandReview } from "./lib/brand-review.js";
import type { ReviewScope } from "./lib/brand-constants.js";

const scope = (process.env.SCOPE ?? "brand") as ReviewScope;
const mode = (process.env.MODE ?? "pr") as "pr" | "local";
const deckName = process.env.DECK;
const prUrl = process.argv[2];

if (mode === "pr" && !prUrl) {
  console.error("Usage: SCOPE=brand|brand+tone|full npx tsx brand-review-agent.ts <PR_URL>");
  console.error("       SCOPE=brand MODE=local DECK=<name> npx tsx brand-review-agent.ts");
  process.exit(1);
}

async function main() {
  console.log(`Brand Review Agent — scope: ${scope}, mode: ${mode}\n`);
  await runBrandReview({ mode, scope, prUrl, deckName });
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
