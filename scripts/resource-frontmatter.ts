import { parse, stringify } from "yaml";

export function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** YAML retains value types and rejects duplicate keys before normalization. */
export function parseYamlMapping(source: string): Record<string, unknown> {
  const value: unknown = parse(source, { uniqueKeys: true, stringKeys: true });
  if (!isMapping(value)) throw new Error("expected a YAML mapping");
  return value;
}

export interface ResourceFrontmatter {
  data: Record<string, unknown>;
  /** Exact text following the closing delimiter's line ending. */
  body: string;
}

export function parseResourceFrontmatter(source: string): ResourceFrontmatter {
  const envelope = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  if (!envelope) throw new Error("expected YAML frontmatter between --- lines");
  return { data: parseYamlMapping(envelope[1]), body: source.slice(envelope[0].length) };
}

export function serializeResourceFrontmatter(data: Record<string, unknown>, body: string): string {
  return `---\n${stringify(data)}---\n${body}`;
}
