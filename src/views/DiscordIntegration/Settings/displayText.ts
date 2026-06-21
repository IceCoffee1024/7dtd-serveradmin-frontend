function shouldStripControlCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return code === 0x7F || (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D);
}

export function sanitizeDisplayText(value: string | null | undefined): string {
  return Array.from(value ?? '').filter(char => !shouldStripControlCharacter(char)).join('');
}
