// Parses Slidev markdown into structured data for reliable LLM evaluation.
// Pre-parsing means free-tier models can focus on evaluation rather than parsing.

export interface ParsedSlide {
  index: number;
  layout?: string;
  class?: string;
  rawContent: string;
  headings: string[];
  bodyText: string;
  imageRefs: string[];
  hasScribbleDecoration: boolean;
  scribbleFile?: string;
  speakerNotes?: string;
}

export interface DeckMetadata {
  theme?: string;
  title?: string;
  fontSans?: string;
  fontMono?: string;
  primaryColor?: string;
  slides: ParsedSlide[];
}

function parseYamlValue(yaml: string, key: string): string | undefined {
  const match = yaml.match(new RegExp(`^\\s*${key}:\\s*['"]?([^'"\n]+)['"]?`, "m"));
  return match?.[1]?.trim();
}

function parseNestedYamlValue(yaml: string, parent: string, child: string): string | undefined {
  const parentMatch = yaml.match(new RegExp(`^${parent}:\\s*\\n((?:\\s+.+\\n?)*)`, "m"));
  if (!parentMatch) return undefined;
  const block = parentMatch[1];
  const childMatch = block.match(new RegExp(`^\\s+${child}:\\s*['"]?([^'"\n]+)['"]?`, "m"));
  return childMatch?.[1]?.trim();
}

function parseSlideFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, body: content };

  const yaml = fmMatch[1];
  const body = fmMatch[2];
  const frontmatter: Record<string, string> = {};

  for (const line of yaml.split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) frontmatter[kv[1]] = kv[2].replace(/^['"]|['"]$/g, "");
  }

  return { frontmatter, body };
}

function extractSpeakerNotes(content: string): { clean: string; notes?: string } {
  const noteBlocks: string[] = [];
  const clean = content.replace(/<!--([\s\S]*?)-->/g, (_, note) => {
    noteBlocks.push(note.trim());
    return "";
  });
  return {
    clean: clean.trim(),
    notes: noteBlocks.length > 0 ? noteBlocks.join("\n\n") : undefined,
  };
}

function extractImageRefs(content: string): string[] {
  const refs: string[] = [];
  // Markdown images
  for (const m of content.matchAll(/!\[.*?\]\(([^)]+)\)/g)) refs.push(m[1]);
  // HTML src attributes
  for (const m of content.matchAll(/src=["']([^"']+)["']/g)) refs.push(m[1]);
  // CSS url() references
  for (const m of content.matchAll(/url\(['"]?([^'")\s]+)['"]?\)/g)) refs.push(m[1]);
  return [...new Set(refs)];
}

function extractHeadings(content: string): string[] {
  return [...content.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1]);
}

export function parseDeck(markdown: string): DeckMetadata {
  // Split on slide separators (--- on its own line)
  const rawSlides = markdown.split(/\n---\n/);

  // Parse global frontmatter from the first slide
  const firstSlideRaw = rawSlides[0] ?? "";
  const globalFmMatch = firstSlideRaw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let globalYaml = "";
  let firstSlideBody = firstSlideRaw;

  if (globalFmMatch) {
    globalYaml = globalFmMatch[1];
    firstSlideBody = globalFmMatch[2];
  }

  const metadata: DeckMetadata = {
    theme: parseYamlValue(globalYaml, "theme"),
    title: parseYamlValue(globalYaml, "title"),
    fontSans: parseNestedYamlValue(globalYaml, "fonts", "sans"),
    fontMono: parseNestedYamlValue(globalYaml, "fonts", "mono"),
    primaryColor: parseNestedYamlValue(globalYaml, "themeConfig", "primary"),
    slides: [],
  };

  // Process each slide
  const slideContents = [firstSlideBody, ...rawSlides.slice(1)];

  for (let i = 0; i < slideContents.length; i++) {
    const raw = slideContents[i].trim();
    if (!raw) continue;

    const { frontmatter, body } = parseSlideFrontmatter(
      raw.startsWith("---") ? raw : `---\n---\n${raw}`
    );
    const actualBody = raw.startsWith("---") ? body : raw;

    const { clean, notes } = extractSpeakerNotes(actualBody);
    const imageRefs = extractImageRefs(actualBody);
    const scribbleRef = imageRefs.find((r) => r.includes("scribble"));

    // Also check for scribble in frontmatter layout if first slide has global fm
    const layout = i === 0
      ? parseYamlValue(globalYaml, "layout")
      : frontmatter["layout"];
    const slideClass = i === 0
      ? parseYamlValue(globalYaml, "class")
      : frontmatter["class"];

    metadata.slides.push({
      index: i + 1,
      layout: layout,
      class: slideClass,
      rawContent: raw,
      headings: extractHeadings(clean),
      bodyText: clean.replace(/^#{1,3}\s+.+$/gm, "").trim(),
      imageRefs,
      hasScribbleDecoration: !!scribbleRef,
      scribbleFile: scribbleRef,
      speakerNotes: notes,
    });
  }

  return metadata;
}
