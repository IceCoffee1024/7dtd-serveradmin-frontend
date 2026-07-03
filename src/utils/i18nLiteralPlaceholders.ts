type Translate = (key: string, named?: Record<string, string>) => string;

export function literalPlaceholderParams(placeholders: readonly string[]): Record<string, string> {
  return Object.fromEntries(placeholders.map(placeholder => [placeholder, `{${placeholder}}`]));
}

export function translateLiteralPlaceholders(
  t: Translate,
  key: string,
  placeholders: readonly string[],
): string {
  return t(key, literalPlaceholderParams(placeholders));
}
