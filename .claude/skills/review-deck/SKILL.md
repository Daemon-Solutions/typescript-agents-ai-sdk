---
name: review-deck
description: Run a Daemon brand compliance review on a Slidev deck (PR or local)
allowed-tools: AskUserQuestion, Bash, Read, Glob, Grep
argument-hint: "[PR_URL or deck-name]"
---

# /review-deck — Daemon Brand Compliance Review

This skill runs a brand compliance review on a Slidev deck using the ai-sdk + OpenRouter. It can review a deck from a GitHub PR or a local deck directory.

## Step 1: Determine Target

Check `$ARGUMENTS`:

- **GitHub PR URL** (matches `github.com/.*/pull/\d+`): use PR mode
- **Deck name** (non-empty string that isn't a URL): use local mode
- **Empty**: use `AskUserQuestion` to ask the user. Glob `decks/*/slides.md` to list available local decks. Offer each deck name as an option plus a "GitHub PR URL" free-text option via "Other".

## Step 2: Choose Review Scope

Use `AskUserQuestion` to ask the user which scope to use:

- **"Structure + brand" (Recommended)** — Layouts, colors, fonts, decorations, logo, assets
- **"Structure + brand + tone"** — Above + Daemon's 5 tone-of-voice values
- **"Full review"** — Above + content quality, readability, density

Map the selection:
- "Structure + brand" → `brand`
- "Structure + brand + tone" → `brand+tone`
- "Full review" → `full`

## Step 3: Run the Review Script

### PR mode
```bash
cd demo && SCOPE=<scope> npx tsx brand-review-agent.ts <PR_URL>
```

### Local mode
```bash
cd demo && SCOPE=<scope> MODE=local DECK=<deck-name> npx tsx brand-review-agent.ts
```

Set a timeout of 120000ms for the command (LLM inference on free tier can be slow).

## Step 4: Display Results

The script outputs the review to stdout. Display the full output to the user.

If the command fails, show the error and suggest:
- Check that `OPENROUTER_API_KEY` is set in `demo/.env` or environment
- For PR mode: check that `GITHUB_TOKEN` is set
- Try again (free-tier models can be rate-limited)

## Brand Rules Reference

This section is for Claude Code's own context when helping users interpret results or make fixes.

### Typography
- Required font: Rustica (Bold headlines lowercase, Regular subheadlines lowercase, Light body sentence case)
- Acceptable Slidev substitute: Work Sans
- No title case in headlines, no full stops in headlines
- Body text ~40% of headline size

### Logo
- White or original colourway only
- Min 100px primary lockup, clearspace = height of 'D'
- Bottom-right preferred, never stretch/compress/add effects
- CSS ::after pseudo-element logo counts as valid

### Colors
| Token         | Hex       | Usage                          |
|---------------|-----------|--------------------------------|
| Vision Blue   | #0064FF   | Primary, headlines, CTAs       |
| Spirit Fluro  | #FF0069   | Accents, links, bullet markers |
| Cream         | #EBE6D7   | Default slide background       |
| Energy Yellow | —         | Accent only                    |
| White         | #FFFFFF   | Text on dark backgrounds       |
| Near-black    | #212121   | Body text                      |

### Slide Layout Map
| Content Type    | Layout      | Class           | Decoration                      |
|-----------------|-------------|-----------------|---------------------------------|
| Title/cover     | default     | title-slide     | Hero bg via CSS                 |
| Section divider | section     | —               | daemon-scribble-hotpink.png     |
| Statement/quote | statement   | —               | daemon-scribble-lightpink.png   |
| Regular content | (none)      | —               | Paint splash via CSS (auto)     |
| Code-heavy      | (none)      | no-decoration   | None                            |
| Closing         | center      | closing-slide   | daemon-scribble-purple.png      |

### Tone Values
1. Confident, not arrogant
2. Warm, not casual
3. Clear, not dumbed down
4. Bold, not reckless
5. Human, not robotic
