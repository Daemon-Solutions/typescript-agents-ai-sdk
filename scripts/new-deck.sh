#!/usr/bin/env bash
set -euo pipefail

DECK_NAME="${1:-}"

if [ -z "$DECK_NAME" ]; then
  echo "Usage: bash scripts/new-deck.sh <deck-name>"
  echo "Example: npm run new-deck -- my-talk"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DECK_DIR="$REPO_ROOT/decks/$DECK_NAME"

if [ -d "$DECK_DIR" ]; then
  echo "Error: Deck '$DECK_NAME' already exists at $DECK_DIR"
  exit 1
fi

mkdir -p "$DECK_DIR"

# Create symlinks to shared assets
ln -s ../../shared/public "$DECK_DIR/public"
ln -s ../../shared/style.css "$DECK_DIR/style.css"

# Create starter slides.md
cat > "$DECK_DIR/slides.md" << 'SLIDES'
---
theme: seriph
title: "Untitled Talk"
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
    <h1>Untitled Talk</h1>
    <p class="subtitle">Your subtitle here</p>
    <p class="date">February 2026</p>
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
SLIDES

echo "Created deck '$DECK_NAME' at decks/$DECK_NAME/"
echo "  - slides.md (starter template)"
echo "  - public -> shared/public (symlink)"
echo "  - style.css -> shared/style.css (symlink)"
echo ""
echo "Start developing: npx slidev decks/$DECK_NAME/slides.md"
