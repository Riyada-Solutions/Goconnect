const LINE_WIDTH = 80

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
    for (const chunk of wrapLine(line, LINE_WIDTH)) {
      lines.push(chunk)
    }
  }

  lines.push(sep)
  console.log(lines.join('\n'))
}
