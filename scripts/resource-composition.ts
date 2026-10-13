import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { readSkillSidecar } from "./skill-activation.ts";
import { parseCanonicalResource, type CanonicalResourceContent } from "./resource-source.ts";
import type {
  DiscoveredResource,
  ResourceSection,
} from "./resource-discovery.ts";

export const COMPOSITION_RELATIONS = ["reference", "load"] as const;
export type CompositionRelation = (typeof COMPOSITION_RELATIONS)[number];

const COMPOSITION_TITLES = new Map<string, CompositionRelation>([
  ["composition:reference", "reference"],
  ["composition:load", "load"],
]);

export interface CompositionDiagnostic {
  file: string;
  line: number;
  message: string;
}

export interface CanonicalResource extends DiscoveredResource, CanonicalResourceContent {
  skillSidecar?: Record<string, unknown>;
}

export interface CompositionReference {
  source: CanonicalResource;
  target: CanonicalResource;
  relation: CompositionRelation;
  line: number;
  label: string;
  destination: string;
  destinationStart: number;
  destinationEnd: number;
}

export interface CanonicalComposition {
  root: string;
  resources: CanonicalResource[];
  bySourcePath: Map<string, CanonicalResource>;
  references: CompositionReference[];
}

interface ParsedLink {
  start: number;
  end: number;
  label: string;
  destination: string;
  destinationStart: number;
  destinationEnd: number;
  title?: string;
  line: number;
}

interface ParseResult {
  links: ParsedLink[];
  diagnostics: CompositionDiagnostic[];
}

function displayPath(root: string, path: string): string {
  const value = relative(root, path);
  return value === "" || value.startsWith(`..${sep}`) ? path : value;
}

function lineAt(content: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) {
    if (content.charCodeAt(index) === 10) line++;
  }
  return line;
}

function countRun(content: string, start: number, char: string): number {
  let end = start;
  while (content[end] === char) end++;
  return end - start;
}

function closingBracket(content: string, start: number): number | undefined {
  let depth = 1;
  for (let index = start + 1; index < content.length; index++) {
    const char = content[index];
    if (char === "\\") {
      index++;
    } else if (char === "[") {
      depth++;
    } else if (char === "]") {
      depth--;
      if (depth === 0) return index;
    } else if (char === "\n") {
      return undefined;
    }
  }
  return undefined;
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    let diagonal = previous[0];
    previous[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const prior = previous[rightIndex];
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = prior;
    }
  }
  return previous[right.length];
}

function looksLikeCompositionMarker(value: string): boolean {
  for (const match of value.toLowerCase().matchAll(/([a-z][a-z-]*):([a-z-]+)/g)) {
    const namespace = match[1];
    const relation = match[2];
    if (namespace === "composition") return true;
    if (
      (relation === "load" || relation === "reference") &&
      editDistance(namespace, "composition") <= 2
    ) {
      return true;
    }
  }
  return false;
}

function fenceMarkerAtLine(
  content: string,
  lineStart: number,
): { marker: number; char: string; length: number; quoteDepth: number } | undefined {
  let cursor = lineStart;
  let spaces = 0;
  while (spaces < 3 && content[cursor] === " ") {
    spaces++;
    cursor++;
  }

  let quoteDepth = 0;
  while (content[cursor] === ">") {
    quoteDepth++;
    cursor++;
    if (content[cursor] === " " || content[cursor] === "\t") cursor++;
    spaces = 0;
    while (spaces < 3 && content[cursor] === " ") {
      spaces++;
      cursor++;
    }
  }

  const char = content[cursor];
  if (char !== "`" && char !== "~") return undefined;
  const length = countRun(content, cursor, char);
  return length >= 3 ? { marker: cursor, char, length, quoteDepth } : undefined;
}

function parseInlineLink(
  content: string,
  linkStart: number,
  labelEnd: number,
): ParsedLink | undefined {
  const open = labelEnd + 1;
  if (content[open] !== "(") return undefined;

  let cursor = open + 1;
  while (content[cursor] === " " || content[cursor] === "\t") cursor++;
  const angleDestination = content[cursor] === "<";
  if (angleDestination) cursor++;
  const destinationStart = cursor;
  let nestedParens = 0;

  while (cursor < content.length) {
    const char = content[cursor];
    if (char === "\\") {
      cursor += 2;
      continue;
    }
    if (char === "\n") return undefined;
    if (angleDestination) {
      if (char === ">") break;
    } else {
      if (char === "(") nestedParens++;
      if (char === ")") {
        if (nestedParens === 0) break;
        nestedParens--;
      }
      if ((char === " " || char === "\t") && nestedParens === 0) break;
    }
    cursor++;
  }

  const destinationEnd = cursor;
  if (angleDestination) {
    if (content[cursor] !== ">") return undefined;
    cursor++;
  }

  let sawWhitespace = false;
  while (content[cursor] === " " || content[cursor] === "\t") {
    sawWhitespace = true;
    cursor++;
  }

  let title: string | undefined;
  if (content[cursor] !== ")") {
    if (!sawWhitespace) return undefined;
    const opener = content[cursor];
    const closer = opener === "(" ? ")" : opener;
    if (opener !== '"' && opener !== "'" && opener !== "(") return undefined;
    cursor++;
    const titleStart = cursor;
    while (cursor < content.length) {
      const char = content[cursor];
      if (char === "\\") {
        cursor += 2;
        continue;
      }
      if (char === "\n") return undefined;
      if (char === closer) break;
      cursor++;
    }
    if (content[cursor] !== closer) return undefined;
    title = content.slice(titleStart, cursor);
    cursor++;
    while (content[cursor] === " " || content[cursor] === "\t") cursor++;
  }

  if (content[cursor] !== ")") return undefined;
  return {
    start: linkStart,
    end: cursor + 1,
    label: content.slice(linkStart + 1, labelEnd),
    destination: content.slice(destinationStart, destinationEnd),
    destinationStart,
    destinationEnd,
    title,
    line: lineAt(content, linkStart),
  };
}

/**
 * Parses the deliberately constrained composition-link grammar while leaving
 * ordinary Markdown alone. Fenced code blocks and inline code spans are
 * excluded so documentation can show literal examples.
 */
export function parseCompositionLinks(
  content: string,
  file = "<content>",
): ParseResult {
  const links: ParsedLink[] = [];
  const diagnostics: CompositionDiagnostic[] = [];
  let fence:
    | { char: string; length: number; quoteDepth: number }
    | undefined;
  let atLineStart = true;

  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    if (atLineStart) {
      const marker = fenceMarkerAtLine(content, index);
      if (marker) {
        if (!fence) {
          fence = {
            char: marker.char,
            length: marker.length,
            quoteDepth: marker.quoteDepth,
          };
        } else if (
          fence.char === marker.char &&
          marker.length >= fence.length &&
          marker.quoteDepth === fence.quoteDepth
        ) {
          fence = undefined;
        }
        const newline = content.indexOf("\n", marker.marker + marker.length);
        if (newline === -1) break;
        index = newline;
        atLineStart = true;
        continue;
      }
    }

    atLineStart = char === "\n";
    if (fence) continue;

    if (char === "`") {
      const length = countRun(content, index, "`");
      const delimiter = "`".repeat(length);
      const close = content.indexOf(delimiter, index + length);
      if (close === -1) continue;
      index = close + length - 1;
      atLineStart = false;
      continue;
    }

    if (char === '"' || char === "'") {
      const quoteEnd = content.indexOf(char, index + 1);
      const lineEnd = content.indexOf("\n", index + 1);
      if (quoteEnd !== -1 && (lineEnd === -1 || quoteEnd < lineEnd)) {
        const quoted = content.slice(index + 1, quoteEnd);
        if (looksLikeCompositionMarker(quoted)) {
          diagnostics.push({
            file,
            line: lineAt(content, index),
            message:
              "composition marker must appear as the title of a supported inline Markdown link",
          });
          index = quoteEnd;
          continue;
        }
      }
    }

    if (char !== "[" || content[index - 1] === "!") continue;
    const labelEnd = closingBracket(content, index);
    if (labelEnd === undefined) continue;
    const parsed = parseInlineLink(content, index, labelEnd);
    if (parsed) {
      if (
        parsed.title !== undefined &&
        (COMPOSITION_TITLES.has(parsed.title) ||
          looksLikeCompositionMarker(parsed.title))
      ) {
        links.push(parsed);
      } else if (looksLikeCompositionMarker(parsed.destination)) {
        diagnostics.push({
          file,
          line: parsed.line,
          message:
            "malformed composition marker; put exactly 'composition:load' or 'composition:reference' in the link title",
        });
      }
      index = parsed.end - 1;
      continue;
    }

    const lineEnd = content.indexOf("\n", index);
    const candidate = content.slice(index, lineEnd === -1 ? content.length : lineEnd);
    if (looksLikeCompositionMarker(candidate)) {
      diagnostics.push({
        file,
        line: lineAt(content, index),
        message:
          "malformed composition link; use [label](relative/path \"composition:load\") or \"composition:reference\"",
      });
      if (lineEnd === -1) break;
      index = lineEnd;
      atLineStart = true;
    }
  }

  return { links, diagnostics };
}

function canonicalMarkdownResources(
  resources: Record<ResourceSection, DiscoveredResource[]>,
): DiscoveredResource[] {
  return [
    ...resources.agents,
    ...resources.skills,
    ...resources.stances,
    ...resources.instructions,
  ].filter((resource) => extname(resource.sourcePath) === ".md");
}

function pathIsInside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

/** Load and validate the canonical composition graph under an explicit root. */
export async function loadCanonicalComposition(
  root: string,
  discovered: Record<ResourceSection, DiscoveredResource[]>,
): Promise<{ composition?: CanonicalComposition; diagnostics: CompositionDiagnostic[] }> {
  const canonicalRoot = resolve(root);
  const diagnostics: CompositionDiagnostic[] = [];
  const indexed: CanonicalResource[] = [];
  const identities = new Map<string, CanonicalResource>();

  for (const resource of canonicalMarkdownResources(discovered)) {
    const sourcePath = resolve(resource.sourcePath);
    const content = await readFile(sourcePath, "utf-8");
    let entry: CanonicalResource;
    try {
      const parsed = parseCanonicalResource(resource, content);
      const skillSidecar = parsed.activation ? await readSkillSidecar(sourcePath) : undefined;
      entry = { ...resource, ...parsed, sourcePath, skillSidecar };
    } catch (error) {
      diagnostics.push({ file: displayPath(canonicalRoot, sourcePath), line: 1,
        message: error instanceof Error ? error.message : String(error) });
      continue;
    }
    const { identity } = entry;
    const prior = identities.get(identity);
    if (prior) {
      diagnostics.push({
        file: displayPath(canonicalRoot, sourcePath),
        line: 1,
        message: `canonical identity '${identity}' collides with ${displayPath(canonicalRoot, prior.sourcePath)}`,
      });
    } else {
      identities.set(identity, entry);
    }
    indexed.push(entry);
  }

  const bySourcePath = new Map(
    indexed.map((resource) => [resource.sourcePath, resource] as const),
  );
  const references: CompositionReference[] = [];

  for (const source of indexed) {
    const content = await readFile(source.sourcePath, "utf-8");
    const parsed = parseCompositionLinks(
      content,
      displayPath(canonicalRoot, source.sourcePath),
    );
    diagnostics.push(...parsed.diagnostics);

    for (const link of parsed.links) {
      const relation =
        link.title === undefined ? undefined : COMPOSITION_TITLES.get(link.title);
      if (!relation) {
        diagnostics.push({
          file: displayPath(canonicalRoot, source.sourcePath),
          line: link.line,
          message: `unsupported composition relationship title '${link.title ?? ""}'; expected exactly 'composition:load' or 'composition:reference'`,
        });
        continue;
      }
      if (link.destination === "") {
        diagnostics.push({
          file: displayPath(canonicalRoot, source.sourcePath),
          line: link.line,
          message: "composition link is missing a canonical target",
        });
        continue;
      }
      if (
        isAbsolute(link.destination) ||
        /^[a-z][a-z0-9+.-]*:/i.test(link.destination) ||
        link.destination.includes("#") ||
        link.destination.includes("?")
      ) {
        diagnostics.push({
          file: displayPath(canonicalRoot, source.sourcePath),
          line: link.line,
          message: `composition target '${link.destination}' must be an unqualified canonical relative Markdown path`,
        });
        continue;
      }

      const targetPath = resolve(dirname(source.sourcePath), link.destination);
      if (!pathIsInside(canonicalRoot, targetPath)) {
        diagnostics.push({
          file: displayPath(canonicalRoot, source.sourcePath),
          line: link.line,
          message: `composition target '${link.destination}' resolves outside the canonical root`,
        });
        continue;
      }
      const target = bySourcePath.get(targetPath);
      if (!target) {
        diagnostics.push({
          file: displayPath(canonicalRoot, source.sourcePath),
          line: link.line,
          message: `composition target '${link.destination}' does not resolve to a discovered canonical resource`,
        });
        continue;
      }

      if (relation === "load" && target.activation?.invocation === "explicit") {
        diagnostics.push({ file: displayPath(canonicalRoot, source.sourcePath), line: link.line,
          message: `composition:load cannot target explicit-only skill '${target.name}'; use composition:reference` });
        continue;
      }

      references.push({
        source,
        target,
        relation,
        line: link.line,
        label: link.label,
        destination: link.destination,
        destinationStart: link.destinationStart,
        destinationEnd: link.destinationEnd,
      });
    }
  }

  return diagnostics.length > 0
    ? { diagnostics }
    : {
        composition: {
          root: canonicalRoot,
          resources: indexed,
          bySourcePath,
          references,
        },
        diagnostics,
      };
}

function markdownRelativePath(fromFile: string, toFile: string): string {
  const result = relative(dirname(fromFile), toFile).split(sep).join("/");
  return result === "" ? "./" : result;
}

export function validateProjectionCompleteness(
  composition: CanonicalComposition,
  outputBySourcePath: ReadonlyMap<string, string>,
  target: string,
): CompositionDiagnostic[] {
  return composition.references.flatMap((reference) => {
    if (!outputBySourcePath.has(reference.source.sourcePath)) return [];
    if (outputBySourcePath.has(reference.target.sourcePath)) return [];
    return [
      {
        file: displayPath(composition.root, reference.source.sourcePath),
        line: reference.line,
        message: `composition target '${reference.target.pluginPath}' is not projected for target '${target}'`,
      },
    ];
  });
}

/** Rewrite only marked-link destinations; every other byte is preserved. */
export function projectCompositionLinks(
  content: string,
  sourcePath: string,
  sourceOutputPath: string,
  composition: CanonicalComposition,
  outputBySourcePath: ReadonlyMap<string, string>,
): string {
  const references = composition.references.filter(
    (reference) => reference.source.sourcePath === resolve(sourcePath),
  );
  const replacements = references.map((reference) => {
    const targetOutputPath = outputBySourcePath.get(reference.target.sourcePath);
    if (!targetOutputPath) {
      throw new Error(
        `No projected destination for ${reference.target.identity}, referenced by ${displayPath(composition.root, reference.source.sourcePath)}:${String(reference.line)}`,
      );
    }
    return {
      start: reference.destinationStart,
      end: reference.destinationEnd,
      value: markdownRelativePath(sourceOutputPath, targetOutputPath),
    };
  });

  let projected = content;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    projected =
      projected.slice(0, replacement.start) +
      replacement.value +
      projected.slice(replacement.end);
  }
  return projected;
}

export function formatCompositionDiagnostics(
  diagnostics: CompositionDiagnostic[],
): string {
  return diagnostics
    .map((diagnostic) => `${diagnostic.file}:${String(diagnostic.line)}: ${diagnostic.message}`)
    .join("\n");
}
