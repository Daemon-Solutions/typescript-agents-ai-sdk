import { Octokit } from "@octokit/rest";
import { tool } from "ai";
import { z } from "zod";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parsePRUrl(url: string) {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) throw new Error(`Invalid PR URL: ${url}`);
  return { owner: match[1], repo: match[2], pull_number: Number(match[3]) };
}

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  return new Octokit({ auth: token });
}

// ─── Raw functions (used by Approach B / direct calls) ───────────────────────

export async function getPRContext(owner: string, repo: string, pull_number: number) {
  const octokit = getOctokit();

  const [pr, files, comments] = await Promise.all([
    octokit.pulls.get({ owner, repo, pull_number }),
    octokit.pulls.listFiles({ owner, repo, pull_number, per_page: 100 }),
    octokit.pulls.listReviewComments({ owner, repo, pull_number, per_page: 50 }),
  ]);

  return {
    title: pr.data.title,
    body: pr.data.body,
    author: pr.data.user?.login,
    base: pr.data.base.ref,
    head: pr.data.head.ref,
    files: files.data.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch?.slice(0, 3000),
    })),
    existingComments: comments.data.map((c) => ({
      path: c.path,
      body: c.body,
      author: c.user?.login,
    })),
  };
}

export async function postReview(
  owner: string,
  repo: string,
  pull_number: number,
  body: string,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT"
) {
  const octokit = getOctokit();
  const review = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    body,
    event,
  });
  return { id: review.data.id, state: review.data.state };
}

// ─── AI-SDK tool wrappers (used by Approach A) ──────────────────────────────

export const fetchPRTool = tool({
  description:
    "Fetch full context for a GitHub pull request including files changed and existing comments",
  inputSchema: z.object({
    prUrl: z.string().describe("Full GitHub PR URL, e.g. https://github.com/owner/repo/pull/123"),
  }),
  execute: async ({ prUrl }) => {
    const { owner, repo, pull_number } = parsePRUrl(prUrl);
    return getPRContext(owner, repo, pull_number);
  },
});

export const postReviewTool = tool({
  description: "Post a review on a GitHub pull request",
  inputSchema: z.object({
    prUrl: z.string().describe("Full GitHub PR URL"),
    body: z.string().describe("Review body in markdown"),
    event: z
      .enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"])
      .default("COMMENT")
      .describe("Review action"),
  }),
  execute: async ({ prUrl, body, event }) => {
    const { owner, repo, pull_number } = parsePRUrl(prUrl);
    return postReview(owner, repo, pull_number, body, event);
  },
});
