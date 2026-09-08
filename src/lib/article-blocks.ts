/**
 * Artigos em blocos (formato JSON) — a "alma" do editor e do leitor rico.
 *
 * O LibraryItem.content armazena UMA string. Dois formatos convivem:
 *  - Doc JSON: `{"v":1,"blocks":[...]}` — novo, criado pelo editor rico;
 *  - Texto legado: parágrafos separados por linhas em branco, "## " p/ subtítulo
 *    e "- " p/ listas — os artigos antigos continuam renderizando como sempre.
 *
 * Tudo aqui é puro e roda em servidor e cliente (sem DOM): sanitização com
 * whitelist leve é feita no cliente (article-renderer/editor) via DOMParser;
 * no servidor usamos apenas stripInlineHtml p/ derivar texto puro (busca/app).
 */

export type ArticleBlockType =
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'img'
  | 'aud'
  | 'vid'
  | 'btn'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'callout'
  | 'hr'

export interface ArticleBlock {
  /** id estável p/ o editor (React keys, foco). O leitor ignora. */
  id: string
  t: ArticleBlockType
  /** HTML inline já sanitizado (p/h1/h2/h3/quote/callout) */
  x?: string
  /** itens de lista (ul/ol) — cada item é HTML inline sanitizado */
  items?: string[]
  /** URL de mídia (img/aud/vid) */
  src?: string
  /** alt da imagem */
  alt?: string
  /** legenda (img/vid) */
  cap?: string
  /** título do áudio */
  title?: string
  /** rótulo do botão CTA */
  label?: string
  /** link do botão CTA */
  href?: string
  /** variante do botão */
  variant?: 'solid' | 'outline'
  /** autor da citação */
  by?: string
  /** tom do destaque (callout) */
  tone?: 'info' | 'tip' | 'warn'
}

export interface ArticleDoc {
  v: 1
  blocks: ArticleBlock[]
}

const BLOCK_TYPES: ArticleBlockType[] = [
  'p',
  'h1',
  'h2',
  'h3',
  'img',
  'aud',
  'vid',
  'btn',
  'quote',
  'ul',
  'ol',
  'callout',
  'hr',
]

const TEXT_TYPES: ArticleBlockType[] = ['p', 'h1', 'h2', 'h3', 'quote', 'callout']

let idSeed = 0
export function newBlockId(): string {
  idSeed += 1
  return `b${Date.now().toString(36)}${idSeed.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Remove TODA tag HTML (server-safe) — usado p/ texto puro em busca/app mobile */
export function stripInlineHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
}

/** Detecta se a string do content é um doc JSON de blocos */
export function isArticleDocJson(raw: string | null | undefined): boolean {
  if (!raw) return false
  const t = raw.trimStart()
  if (!t.startsWith('{')) return false
  try {
    const parsed = JSON.parse(t) as { v?: unknown; blocks?: unknown }
    return parsed?.v === 1 && Array.isArray(parsed?.blocks)
  } catch {
    return false
  }
}

/** Parse defensivo: descarta blocos inválidos, normaliza campos */
export function parseArticleDoc(raw: string | null | undefined): ArticleDoc | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw.trimStart()) as { v?: unknown; blocks?: unknown[] }
    if (parsed?.v !== 1 || !Array.isArray(parsed?.blocks)) return null
    const blocks: ArticleBlock[] = []
    for (const b of parsed.blocks as Record<string, unknown>[]) {
      if (!b || typeof b !== 'object') continue
      const t = b.t as ArticleBlockType
      if (!BLOCK_TYPES.includes(t)) continue
      const block: ArticleBlock = { id: typeof b.id === 'string' && b.id ? b.id : newBlockId(), t }
      if (typeof b.x === 'string') block.x = b.x
      if (Array.isArray(b.items)) {
        block.items = (b.items as unknown[]).filter((i): i is string => typeof i === 'string')
      }
      for (const k of ['src', 'alt', 'cap', 'title', 'label', 'href', 'by'] as const) {
        if (typeof b[k] === 'string') block[k] = b[k] as string
      }
      if (b.variant === 'outline') block.variant = 'outline'
      if (b.tone === 'tip' || b.tone === 'warn') block.tone = b.tone
      // Validação mínima por tipo: blocos sem conteúdo essencial caem fora
      if (TEXT_TYPES.includes(t) && !block.x) continue
      if ((t === 'img' || t === 'aud' || t === 'vid') && !block.src) continue
      if (t === 'btn' && (!block.label || !block.href)) continue
      if ((t === 'ul' || t === 'ol') && (!block.items || block.items.length === 0)) continue
      blocks.push(block)
    }
    return { v: 1, blocks }
  } catch {
    return null
  }
}

export function serializeArticleDoc(blocks: ArticleBlock[]): string {
  return JSON.stringify({ v: 1, blocks })
}

/** Texto puro do artigo (busca, compartilhamento, fallback do app mobile) */
export function articleToPlainText(raw: string | null | undefined): string {
  if (!raw) return ''
  if (!isArticleDocJson(raw)) return raw
  const doc = parseArticleDoc(raw)
  if (!doc) return ''
  const out: string[] = []
  for (const b of doc.blocks) {
    switch (b.t) {
      case 'h1':
      case 'h2':
      case 'h3':
        out.push(stripInlineHtml(b.x ?? ''))
        out.push('')
        break
      case 'p':
        out.push(stripInlineHtml(b.x ?? ''))
        out.push('')
        break
      case 'ul':
      case 'ol':
        for (const item of b.items ?? []) out.push(`• ${stripInlineHtml(item)}`)
        out.push('')
        break
      case 'quote':
        out.push(`“${stripInlineHtml(b.x ?? '')}”${b.by ? ` — ${b.by}` : ''}`)
        out.push('')
        break
      case 'callout':
        out.push(stripInlineHtml(b.x ?? ''))
        out.push('')
        break
      case 'img':
        if (b.cap) {
          out.push(`[imagem] ${b.cap}`)
          out.push('')
        }
        break
      case 'aud':
        out.push(`[áudio] ${b.title ?? 'Ouvir'}`)
        out.push('')
        break
      case 'vid':
        if (b.cap) {
          out.push(`[vídeo] ${b.cap}`)
          out.push('')
        }
        break
      case 'btn':
        out.push(`[${stripInlineHtml(b.label ?? '')}] ${b.href ?? ''}`)
        out.push('')
        break
      case 'hr':
        out.push('')
        break
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Converte texto legado (parágrafos, "## ", "- ") em blocos — permite abrir
 * artigos antigos no editor rico sem perder nada.
 */
export function legacyTextToBlocks(text: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = []
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean)
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
      blocks.push({
        id: newBlockId(),
        t: 'ul',
        items: lines.map((l) => `<b>${escapeHtml(l.slice(2).trim())}</b>`),
      })
      continue
    }
    if (lines.length === 1 && lines[0].startsWith('## ')) {
      blocks.push({ id: newBlockId(), t: 'h2', x: escapeHtml(lines[0].slice(3).trim()) })
      continue
    }
    if (lines.length === 1 && lines[0].startsWith('# ')) {
      blocks.push({ id: newBlockId(), t: 'h1', x: escapeHtml(lines[0].slice(2).trim()) })
      continue
    }
    blocks.push({ id: newBlockId(), t: 'p', x: escapeHtml(chunk).replace(/\n/g, '<br>') })
  }
  return blocks
}

/** Doc vazio com um parágrafo pronto p/ digitar */
export function emptyDoc(): ArticleBlock[] {
  return [{ id: newBlockId(), t: 'p', x: '' }]
}

/** Contagem aproximada de palavras (p/ estimar leitura no editor) */
export function docWordCount(blocks: ArticleBlock[]): number {
  let words = 0
  for (const b of blocks) {
    const text =
      b.x ??
      (b.items ?? []).join(' ') ??
      ''
    words += stripInlineHtml(text).split(/\s+/).filter(Boolean).length
    if (b.t === 'img') words += stripInlineHtml(b.cap ?? '').split(/\s+/).filter(Boolean).length
    if (b.t === 'btn') words += 3
  }
  return words
}
