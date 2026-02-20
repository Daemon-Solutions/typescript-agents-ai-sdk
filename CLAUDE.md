# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-deck Slidev presentation repository with AI agent demos. The main deck covers "Building AI Agents in TypeScript using the AI-SDK." Includes tooling for creating new branded decks, reviewing brand compliance, and running live agent demonstrations.

## Commands

### Presentations (root)
- `npm run dev` — Dev server for main deck (typescript-agents)
- `npm run dev:<deck-name>` — Dev server for a specific deck
- `npm run build` — Build all decks to `dist/` (runs `scripts/build-all.sh`)
- `npm run build:<deck-name>` — Build a specific deck
- `npm run new-deck -- <name>` — Create a new deck from template

### Agent Demos (run from `demo/`)
- `npm run review` — PR review agent (default: custom approach)
- `npm run review:claude` — PR review using Claude Code provider
- `npm run review:custom` — PR review using OpenRouter
- `npm run brand-review` — Brand compliance review (PR mode)
- `npm run brand-review:local` — Brand compliance review (local mode)

Demo env vars: `OPENROUTER_API_KEY`, `GITHUB_TOKEN`, `APPROACH` (claude-code|custom), `SCOPE` (brand|brand+tone|full), `MODE` (pr|local), `DECK` (deck name for local review).

## Architecture

### Multi-Deck Structure
```
decks/<name>/slides.md      — Each deck is self-contained
decks/<name>/public -> shared/public   — Symlinks to shared assets
decks/<name>/style.css -> shared/style.css
```

New decks are created via `scripts/new-deck.sh` or the `/new-deck` skill. Each deck gets symlinks to `shared/` for brand assets and styling.

### Shared Assets (`shared/`)
- `style.css` — Daemon brand CSS overrides for Slidev seriph theme
- `public/` — Brand images (logos, hero bg, paint splashes, scribble decorations)

### Agent Demos (`demo/`)
Two agents built with the Vercel AI SDK (`ai` package v6):

**PR Review Agent** (`pr-review-agent.ts`) — Reviews GitHub PRs for code quality. Two provider modes: Claude Code (`ai-sdk-provider-claude-code`) or OpenRouter (`@openrouter/ai-sdk-provider`). Uses GitHub tools from `lib/github-tools.ts` via Octokit.

**Brand Review Agent** (`brand-review-agent.ts`) — Reviews Slidev decks against Daemon brand rules. Parses slides with `lib/slide-parser.ts`, evaluates against rules in `lib/brand-constants.ts`. Supports PR (GitHub) and local file modes.

### Scripts (`scripts/`)
- `build-all.sh` — Iterates decks, builds each, generates landing `dist/index.html`
- `new-deck.sh` — Scaffolds new deck directory with symlinks and starter template
- `pptx-to-slidev.mjs` — Converts PPTX files to Slidev markdown (uses `officeparser`)

## Daemon Brand Rules

Slides must follow Daemon brand guidelines. Key rules enforced by the brand review agent:

- **Colors**: Vision Blue `#0064FF`, Spirit Fluro `#FF0069`, Cream `#EBE6D7`, Dark Text `#303030`
- **Typography**: Rustica Bold for headlines (lowercase, no title case), Work Sans as web substitute
- **Layouts**: title-slide, section (hotpink scribble), statement (lightpink scribble), content (paint splash), code (no-decoration), closing-slide (purple scribble)
- **Tone**: Confident not arrogant, warm not casual, clear not dumbed down, bold not reckless, human not robotic

## Commit Guidelines

- Do not include "Co-Authored-By" lines in commits
- Break changes into small, self-contained commits that don't break things
