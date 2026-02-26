import { generateText } from "ai";
import { createClaudeCode, createCustomMcpServer } from "ai-sdk-provider-claude-code";
import { z } from "zod";
import { parsePRUrl, getPRContext, postReview } from "./github-tools.js";
import { SYSTEM_PROMPT } from "./constants.js";

const githubMcpServer = createCustomMcpServer({
  name: "github",
  tools: {
    fetchPR: {
      description:
        "Fetch full context for a GitHub pull request including files changed and existing comments",
      inputSchema: z.object({
        prUrl: z.string().describe("Full GitHub PR URL, e.g. https://github.com/owner/repo/pull/123"),
      }),
      handler: async (args) => {
        const { prUrl } = args as { prUrl: string };
        const { owner, repo, pull_number } = parsePRUrl(prUrl);
        const context = await getPRContext(owner, repo, pull_number);
        return { content: [{ type: "text" as const, text: JSON.stringify(context, null, 2) }] };
      },
    },
    postReview: {
      description: "Post a review on a GitHub pull request",
      inputSchema: z.object({
        prUrl: z.string().describe("Full GitHub PR URL"),
        body: z.string().describe("Review body in markdown"),
        event: z
          .enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"])
          .default("COMMENT")
          .describe("Review action"),
      }),
      handler: async (args) => {
        const { prUrl, body, event } = args as { prUrl: string; body: string; event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" };
        const { owner, repo, pull_number } = parsePRUrl(prUrl);
        const result = await postReview(owner, repo, pull_number, body, event);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      },
    },
  },
});

export async function runClaudeCodeProvider(prUrl: string) {
  console.log("🤖 Approach B: Claude Code provider\n");

  const model = createClaudeCode({
    defaultSettings: {
      mcpServers: { github: githubMcpServer },
      allowedTools: ["mcp__github__fetchPR", "mcp__github__postReview"],
      disallowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "NotebookEdit", "Task", "WebFetch", "WebSearch"],
      maxTurns: 5,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      persistSession: false,
      env: { CLAUDECODE: undefined },
    },
  })("sonnet");

  const { text, steps } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `
    Review this pull request: ${prUrl}

    First, fetch the PR context using the fetchPR tool.
    Then analyze the changes and post a review using the postReview tool.
    `,
  });

  console.log(`✅ Completed in ${steps.length} step(s)\n`);
  console.log(text);
}
