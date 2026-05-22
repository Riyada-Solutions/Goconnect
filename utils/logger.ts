const LINE_WIDTH = 80

/**
 * Flip to `true` to pretty-print JSON in logs (indented, multi-line).
 * Flip to `false` for compact single-line JSON.
 */
export const PRETTY_JSON = false

/** JSON.stringify that honours `PRETTY_JSON`. Returns `'{}'` for null/undefined. */
export function fmtJson(value: unknown): string {
  if (value == null) return '{}'
  try {
    return JSON.stringify(value, null, PRETTY_JSON ? 2 : 0)
  } catch {
    return String(value)
  }
}

function wrapLine(text: string, width: number): string[] {
  if (text.length <= width) return [text]
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += width) {
    chunks.push(text.substring(i, Math.min(i + width, text.length)))
  }
  return chunks
}

export function log(tag: string, content: string): void {
  if (!__DEV__) return

  const sep = '-'.repeat(LINE_WIDTH)
  const lines: string[] = [`[${tag}]`, sep]

  for (const line of content.trim().split('\n')) {
    // Don't chunk-wrap when pretty-printing — long indented JSON lines stay
    // intact so the structure remains readable.
    if (PRETTY_JSON) {
      lines.push(line)
    } else {
      for (const chunk of wrapLine(line, LINE_WIDTH)) {
        lines.push(chunk)
      }
    }
  }

  lines.push(sep)
  console.log(lines.join('\n'))
}
