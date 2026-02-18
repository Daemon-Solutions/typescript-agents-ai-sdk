import { runClaudeCodeProvider } from './lib/claude-code.js';
import { runOpenrouterProvider } from './lib/openrouter.js'


const APPROACH = process.env.APPROACH ?? "claude-code"; // "custom" | "claude-code"
const prUrl = process.argv[2];

if (!prUrl) {
  console.error("Usage: APPROACH=custom|claude-code npx tsx pr-review-agent.ts <PR_URL>");
  process.exit(1);
}

async function main() {
  console.log(`PR Review Agent — ${prUrl}\n\n\n`);

  if (APPROACH === "claude-code") {
    await runClaudeCodeProvider(prUrl);
  } else {
    await runOpenrouterProvider(prUrl);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
