import { generateText, stepCountIs } from "ai";
import { createClaudeCode } from "ai-sdk-provider-claude-code";
import { getPRContext, parsePRUrl } from "./github-tools.js";
import { SYSTEM_PROMPT } from "./constants.js";


export async function runClaudeCodeProvider(prUrl: string) {
    console.log("🤖 Approach B: Claude Code provider\n");

    const { owner, repo, pull_number } = parsePRUrl(prUrl);
    const context = await getPRContext(owner, repo, pull_number);

    const model = createClaudeCode({
        defaultSettings: {
            allowedTools: ["Read", "Bash", "Glob", "Grep"],
            permissionMode: "bypassPermissions",
        },
    })("sonnet");

    const { text, steps } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: `
        
        Review this pull request.

        PR: ${context.title} by ${context.author}
        Branch: ${context.head} → ${context.base}
        Description: ${context.body ?? "No description provided"}

        Files changed:
        ${context.files.map((f) => `### ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n\`\`\`diff\n${f.patch ?? "binary"}\n\`\`\``).join("\n\n")}

        Existing review comments:
        ${context.existingComments.map((c) => `- ${c.author} on ${c.path}: ${c.body}`).join("\n") || "None"}

        Provide a thorough code review.
        
        `,
        stopWhen: stepCountIs(10),
    });

    console.log(`✅ Completed in ${steps.length} step(s)\n`);
    console.log(text);
}

