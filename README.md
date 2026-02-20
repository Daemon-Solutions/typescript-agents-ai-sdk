# Building AI Agents in TypeScript using the AI SDK

A multi-deck [Slidev](https://sli.dev) presentation repository with live AI agent demos. The talk covers how to build practical AI agents in TypeScript using the [Vercel AI SDK](https://sdk.vercel.ai), with two working agents: a **PR review agent** and a **brand compliance review agent**.

## Quick Start

```bash
# Install dependencies
npm install
cd demo && npm install

# Start the main presentation
npm run dev

# Run a demo agent (from demo/)
cd demo
npm run review           # PR review agent
npm run brand-review     # Brand compliance review
```

## Project Structure

```
.
├── decks/                    # Slidev presentation decks
│   ├── typescript-agents/    # Main talk deck
│   ├── my-talk/
│   └── test-deck/
├── demo/                     # AI agent implementations
│   ├── pr-review-agent.ts    # GitHub PR review agent
│   ├── brand-review-agent.ts # Slidev brand compliance agent
│   └── lib/                  # Shared agent libraries
│       ├── github-tools.ts   # Octokit-based GitHub tools
│       ├── claude-code.ts    # Claude Code provider setup
│       ├── openrouter.ts     # OpenRouter provider setup
│       ├── brand-constants.ts# Daemon brand rules
│       ├── brand-review.ts   # Brand review orchestration
│       ├── slide-parser.ts   # Slidev markdown parser
│       └── constants.ts      # PR review system prompt
├── shared/                   # Shared brand assets
│   ├── style.css             # Daemon brand CSS overrides
│   └── public/               # Logos, backgrounds, decorations
├── scripts/
│   ├── build-all.sh          # Build all decks to dist/
│   ├── new-deck.sh           # Scaffold a new branded deck
│   └── pptx-to-slidev.mjs   # Convert PPTX to Slidev markdown
└── .github/workflows/        # CI: auto PR & brand reviews
```

## Presentations

Each deck lives in `decks/<name>/` with a `slides.md` file and symlinks to shared brand assets.

```bash
npm run dev                     # Main deck (typescript-agents)
npm run dev:my-talk             # A specific deck
npm run build                   # Build all decks
npm run new-deck -- my-deck     # Create a new branded deck
```

## Agent Demos

Two agents built with the Vercel AI SDK (v6), runnable from the `demo/` directory.

### PR Review Agent

Reviews GitHub pull requests for code quality using a 3-phase analysis: understand intent, holistic assessment, then line-by-line review. Priorities: Security > Correctness > Data Integrity > Performance > Maintainability > Style.

```bash
npm run review                  # Default approach
npm run review:claude           # Claude Code provider
npm run review:custom           # OpenRouter provider
```

Supports two provider backends:
- **Claude Code** (`ai-sdk-provider-claude-code`) — uses MCP tools for GitHub access
- **OpenRouter** (`@openrouter/ai-sdk-provider`) — uses Octokit-based tool functions

### Brand Review Agent

Reviews Slidev decks against Daemon brand guidelines. Parses slide markdown into structured data, evaluates layout, colors, typography, tone, and decorations.

```bash
npm run brand-review            # Review a PR's deck changes
npm run brand-review:local      # Review a local deck
```

### Environment Variables

Copy `.env.example` to `.env` in the `demo/` directory:

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | API key for OpenRouter provider |
| `GITHUB_TOKEN` | GitHub token (falls back to `gh auth token`) |
| `APPROACH` | `claude-code` or `custom` (default) |
| `SCOPE` | `brand`, `brand+tone`, or `full` |
| `MODE` | `pr` (default) or `local` |
| `DECK` | Deck name for local brand review |

## CI/CD

Two GitHub Actions workflows run automatically on pull requests:

- **Code Review** — Runs the PR review agent on code changes (ignores docs)
- **Brand Review** — Runs the brand compliance agent when deck or shared assets change

## Creating a New Deck

```bash
npm run new-deck -- my-new-talk
```

This scaffolds `decks/my-new-talk/` with a starter `slides.md` and symlinks to shared brand assets and styling.

## Brand Guidelines

Decks follow Daemon brand rules enforced by the brand review agent:

- **Colors**: Vision Blue `#0064FF`, Spirit Fluro `#FF0069`, Cream `#EBE6D7`, Dark Text `#303030`
- **Typography**: Work Sans, lowercase headlines, bold (700) headings
- **Layouts**: title-slide, section, statement, content, code (no-decoration), closing-slide
- **Tone**: Confident not arrogant, warm not casual, clear not dumbed down, bold not reckless, human not robotic
