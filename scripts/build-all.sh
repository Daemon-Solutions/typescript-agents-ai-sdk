#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$REPO_ROOT/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

DECKS=()

for slides in "$REPO_ROOT"/decks/*/slides.md; do
  DECK_DIR="$(dirname "$slides")"
  DECK_NAME="$(basename "$DECK_DIR")"
  DECKS+=("$DECK_NAME")

  echo "Building deck: $DECK_NAME"
  npx slidev build "$slides" --out "$DIST_DIR/$DECK_NAME" --base "/$DECK_NAME/"
  echo "  -> dist/$DECK_NAME/"
done

# Generate landing page
cat > "$DIST_DIR/index.html" << 'HTML_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Decks</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Work Sans', system-ui, sans-serif;
      background: #EBE6D7;
      color: #303030;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
    }
    h1 { color: #0064FF; margin-bottom: 2rem; }
    .decks { list-style: none; width: 100%; max-width: 600px; }
    .decks li { margin-bottom: 0.75rem; }
    .decks a {
      display: block;
      padding: 1rem 1.5rem;
      background: white;
      border: 1px solid #D5D0C4;
      border-radius: 8px;
      color: #0064FF;
      text-decoration: none;
      font-weight: 600;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .decks a:hover {
      border-color: #0064FF;
      box-shadow: 0 2px 8px rgba(0,100,255,0.1);
    }
  </style>
</head>
<body>
  <h1>Slide Decks</h1>
  <ul class="decks">
HTML_HEAD

for DECK_NAME in "${DECKS[@]}"; do
  DISPLAY_NAME="${DECK_NAME//-/ }"
  echo "    <li><a href=\"/$DECK_NAME/\">$DISPLAY_NAME</a></li>" >> "$DIST_DIR/index.html"
done

cat >> "$DIST_DIR/index.html" << 'HTML_FOOT'
  </ul>
</body>
</html>
HTML_FOOT

echo ""
echo "All decks built to dist/"
echo "Landing page: dist/index.html"
