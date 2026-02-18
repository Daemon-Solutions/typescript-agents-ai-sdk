---
name: new-deck
description: Create a new Slidev presentation deck from scratch or by converting a PPTX file
allowed-tools: AskUserQuestion, Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[deck-name]"
---

# /new-deck — Create a New Slidev Deck

This skill creates a new Daemon-branded Slidev presentation deck. It supports two modes:
- **From scratch** — generates a starter template with branded slides
- **From PPTX** — converts an existing PowerPoint file into Slidev markdown

## Step 1: Gather Inputs

Use `AskUserQuestion` to collect the following. Ask them in sequence (each depends on the previous answer).

### 1a. Source Mode

Ask the user how they want to create the deck:

- **Options**: "From scratch" / "Convert from PPTX"

### 1b. Deck Name

If `$ARGUMENTS` is provided and non-empty, use that as the deck name. Otherwise, ask the user to type a deck name via the "Other" free-text option. Provide two example options like "my-talk" and "quarterly-review" to illustrate the format.

**Validation rules:**
- Must be lowercase with hyphens only (regex: `^[a-z][a-z0-9-]*$`)
- Must not already exist as `decks/<name>/`
- If validation fails, tell the user and ask again

### 1c. PPTX Path (only if "Convert from PPTX" was selected)

Ask for the path to the `.pptx` file. Provide the "Other" free-text option. Validate the file exists.

### 1d. Talk Title

Ask for the talk title via "Other" free-text. Provide two example options to illustrate.

### 1e. Talk Subtitle (optional)

Ask for an optional subtitle. Provide a "No subtitle" option and the "Other" free-text option.

## Step 2: Create the Deck Directory

Run these commands:

```bash
mkdir -p decks/<name>
ln -s ../../shared/public decks/<name>/public
ln -s ../../shared/style.css decks/<name>/style.css
```

## Step 3: Generate slides.md

### From Scratch

Create `decks/<name>/slides.md` with this Daemon-branded template. Replace `<TITLE>`, `<SUBTITLE>`, and `<DATE>` with the gathered inputs (use current month/year for date). If no subtitle, omit the subtitle `<p>` tag.

```markdown
---
theme: seriph
title: "<TITLE>"
transition: slide-left
mdc: true
fonts:
  sans: Work Sans
  mono: PT Mono
  weights: '400,700'
themeConfig:
  primary: '#0064FF'
layout: default
class: title-slide
---

<div class="title-slide-content">
  <div class="title-text">
    <h1><TITLE></h1>
    <p class="subtitle"><SUBTITLE></p>
    <p class="date"><DATE></p>
  </div>
</div>

---
layout: section
---

# Section 1

<img src="/daemon-scribble-hotpink.png" class="scribble-decoration" />

---

# First Slide

Your content here.

---
layout: center
class: closing-slide
---

# Thank You!

<img src="/daemon-scribble-purple.png" class="scribble-decoration" />
```

### From PPTX

Follow the PPTX Conversion Pipeline (Step 5) to generate the slides.md content.

## Step 4: Update package.json

Use `Edit` to add two new scripts to the `"scripts"` object in `package.json`:

```json
"dev:<name>": "slidev decks/<name>/slides.md",
"build:<name>": "slidev build decks/<name>/slides.md --out dist/<name>"
```

Insert them after the existing `build:*` entry to keep scripts organized.

## Step 5: PPTX Conversion Pipeline

Only run this when the user selected "Convert from PPTX".

### 5a. Install officeparser

```bash
npm install --save-dev officeparser
```

### 5b. Ensure pptx-to-slidev.mjs exists

Check if `scripts/pptx-to-slidev.mjs` exists. If not, inform the user it's missing and stop.

### 5c. Run the extraction script

```bash
node scripts/pptx-to-slidev.mjs "<pptx-path>" "decks/<name>"
```

This produces:
- `decks/<name>/slides-raw.md` — raw text content per slide
- Images saved to `shared/public/` with `<deckname>-img-<N>.<ext>` naming

### 5d. Read and transform the raw content

Read `decks/<name>/slides-raw.md` and transform it into proper Daemon-branded Slidev markdown:

1. **YAML frontmatter** — use the same frontmatter as the "From scratch" template with the user's title
2. **First slide** → title slide: use `layout: default` + `class: title-slide` with `title-slide-content` HTML structure
3. **Section divider slides** (slides with just a short heading, no bullets) → `layout: section` with `<img src="/daemon-scribble-hotpink.png" class="scribble-decoration" />`
4. **Last slide** → `layout: center` + `class: closing-slide` with `<img src="/daemon-scribble-purple.png" class="scribble-decoration" />`
5. **Content slides** — convert bullet points to markdown lists, keep headings as `# Heading`
6. **Images** — reference as `/<deckname>-img-N.ext` (they're in the shared public dir)
7. **Speaker notes** — if the raw content has notes, wrap them in `<!-- ... -->` blocks after the slide content

### 5e. Write the final slides.md

Write the transformed content to `decks/<name>/slides.md`.

### 5f. Clean up

Delete the intermediate `decks/<name>/slides-raw.md` file.

## Step 6: Print Summary

After everything is done, print:

```
Created deck '<name>' at decks/<name>/
  - slides.md (<mode>)
  - public -> shared/public (symlink)
  - style.css -> shared/style.css (symlink)
  - Added dev:<name> and build:<name> scripts to package.json

Start developing: npm run dev:<name>
```

## Slide Layout Reference

Use this reference when transforming PPTX content or when adding slides:

| Content Type        | Layout      | Class            | Decoration                                  |
|---------------------|-------------|------------------|---------------------------------------------|
| Title/cover         | `default`   | `title-slide`    | Hero bg via CSS                             |
| Section divider     | `section`   | —                | `daemon-scribble-hotpink.png`               |
| Statement/quote     | `statement` | —                | `daemon-scribble-lightpink.png`             |
| Regular content     | *(none)*    | —                | Paint splash via CSS (automatic)            |
| Code-heavy          | *(none)*    | `no-decoration`  | None                                        |
| Closing             | `center`    | `closing-slide`  | `daemon-scribble-purple.png`                |

### Decoration HTML snippets

Section slides:
```html
<img src="/daemon-scribble-hotpink.png" class="scribble-decoration" />
```

Statement slides:
```html
<img src="/daemon-scribble-lightpink.png" class="scribble-decoration" />
```

Closing slides:
```html
<img src="/daemon-scribble-purple.png" class="scribble-decoration" />
```
