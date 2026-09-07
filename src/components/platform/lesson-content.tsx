'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renderizador de conteúdo de aula/apostila em markdown leve — o mesmo formato
 * usado pelo seed de conteúdo e pelo RichText do app Expo (Órbita):
 *  - "## " → h2 · "### " → h3
 *  - linhas "- " → lista com marcador accent
 *  - **negrito** · *itálico* · `código` inline
 *  - blocos separados por linha em branco
 *
 * Compartilhado pela sala de aula (web) para que os 36 cursos do catálogo
 * renderizem como material de produto (Apple Books style), não texto cru.
 */

/** Inline: **bold**, *italic*, `code` — retorna spans sem dangerouslySetInnerHTML */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Regex única: code primeiro (protegido), depois bold, depois italic
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const token = m[0]
    const key = `${keyPrefix}-${i++}`
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-slate-900 dark:text-slate-50">
          {token.slice(2, -2)}
        </strong>
      )
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul'; items: string[] }

/**
 * Parser linha a linha: dentro de um bloco sem linha em branco pode existir
 * um "## Título" seguido de "- itens" (formato usado pelo seed de conteúdo).
 */
function parseBlocks(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let list: string[] = []

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join('\n') })
    para = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ type: 'ul', items: [...list] })
    list = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushPara()
      flushList()
      continue
    }
    if (/^[-•]\s+/.test(line)) {
      flushPara()
      list.push(line.replace(/^[-•]\s+/, '').trim())
      continue
    }
    if (line.startsWith('#### ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h3', text: line.slice(5).trim() })
      continue
    }
    if (line.startsWith('### ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      continue
    }
    if (line.startsWith('## ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      continue
    }
    if (line.startsWith('# ')) {
      flushPara()
      flushList()
      blocks.push({ type: 'h2', text: line.slice(2).trim() })
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}

export function LessonContent({ content, className }: { content: string; className?: string }) {
  const blocks = parseBlocks(content)

  return (
    <div className={cn('max-w-prose space-y-1', className)}>
      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          return (
            <h2
              key={i}
              className="mt-7 text-lg font-bold tracking-tight text-slate-900 first:mt-0 sm:text-xl dark:text-slate-50"
            >
              {renderInline(block.text, `h${i}`)}
            </h2>
          )
        }
        if (block.type === 'h3') {
          return (
            <h3
              key={i}
              className="mt-6 text-base font-bold tracking-tight text-slate-900 first:mt-0 sm:text-lg dark:text-slate-50"
            >
              {renderInline(block.text, `h${i}`)}
            </h3>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="space-y-1.5 py-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  <span className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {renderInline(item, `l${i}-${j}`)}
                  </span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="whitespace-pre-line py-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
            {renderInline(block.text, `p${i}`)}
          </p>
        )
      })}
    </div>
  )
}

/** Mantém a export padrão compatível para imports dinâmicos futuros */
export default LessonContent
