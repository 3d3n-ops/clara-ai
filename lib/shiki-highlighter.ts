import { codeToHtml } from 'shiki'

export async function highlightCode(code: string, lang: string): Promise<string> {
  const highlighter = await codeToHtml(code, {
    lang: lang,
    theme: 'dracula', // You can choose any theme you like
  })
  return highlighter
}
