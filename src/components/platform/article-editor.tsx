'use client'

/**
 * Editor de artigos em blocos — estilo Notion, 100% leve (zero dependências:
 * contentEditable + document.execCommand + sanitizer próprio).
 *
 * Blocos: parágrafo (com negrito/itálico/sublinhado/riscado/link), Título 1/2/3,
 * lista, citação, destaque (info/dica/atenção), imagem, áudio, vídeo e botão CTA.
 *
 * O valor trafega como a MESMA string do campo `content` (JSON {"v":1,...});
 * texto legado é convertido para blocos ao abrir. O componente é não
 * controlado nos contentEditable (nunca re-renderiza o HTML sob o cursor).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Eye,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Music,
  Plus,
  Quote,
  Sparkles,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Unlink,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import {
  docWordCount,
  emptyDoc,
  legacyTextToBlocks,
  newBlockId,
  parseArticleDoc,
  serializeArticleDoc,
  stripInlineHtml,
  type ArticleBlock,
  type ArticleBlockType,
} from '@/lib/article-blocks'
import { sanitizeInlineHtml } from '@/lib/inline-sanitize'
import { AudioPlayer, VideoEmbed } from '@/components/platform/article-renderer'
import { cn } from '@/lib/utils'

/* ------------------------------ helpers --------------------------------- */

function placeCaret(el: HTMLElement, atEnd: boolean) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(!atEnd)
  sel.removeAllRanges()
  sel.addRange(range)
}

function docIsEmpty(blocks: ArticleBlock[]): boolean {
  return blocks.every((b) => {
    if (b.t === 'ul' || b.t === 'ol') return (b.items ?? []).every((i) => !stripInlineHtml(i))
    if (b.t === 'img' || b.t === 'aud' || b.t === 'vid') return !b.src
    if (b.t === 'btn') return !stripInlineHtml(b.label ?? '') && !b.href
    if (b.t === 'hr') return true
    return !stripInlineHtml(b.x ?? '')
  })
}

const TEXT_BLOCK_TYPES: ArticleBlockType[] = ['p', 'h1', 'h2', 'h3', 'quote', 'callout']

const BLOCK_TYPE_LABELS: Record<ArticleBlockType, string> = {
  p: 'Texto',
  h1: 'Título grande',
  h2: 'Seção',
  h3: 'Subseção',
  img: 'Imagem',
  aud: 'Áudio',
  vid: 'Vídeo',
  btn: 'Botão',
  quote: 'Citação',
  ul: 'Lista com marcadores',
  ol: 'Lista numerada',
  callout: 'Destaque',
  hr: 'Divisor',
}

const PLACEHOLDERS: Partial<Record<ArticleBlockType, string>> = {
  p: 'Escreva seu texto…',
  h1: 'Título grande',
  h2: 'Título da seção',
  h3: 'Subtítulo',
  quote: 'Citação memorável…',
  callout: 'Destaque uma informação importante…',
}

/* --------------------------- contentEditable ---------------------------- */

const EDITABLE_PLACEHOLDER_CLS =
  'empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-slate-400 dark:empty:before:text-slate-600'

interface EditableProps {
  html: string
  placeholder?: string
  className?: string
  ariaLabel: string
  register: (el: HTMLDivElement | null) => void
  onInput: (html: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onFocus?: () => void
  onPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void
}

function Editable({
  html,
  placeholder,
  className,
  ariaLabel,
  register,
  onInput,
  onKeyDown,
  onFocus,
  onPaste,
}: EditableProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerHTML !== html) {
      el.innerHTML = html
    }
  }, [html])

  return (
    <div
      ref={(el) => {
        ref.current = el
        register(el)
      }}
      contentEditable={!false}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      onInput={(e) => onInput(e.currentTarget.innerHTML)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onPaste={onPaste}
      className={cn('outline-none', EDITABLE_PLACEHOLDER_CLS, className)}
    />
  )
}

/* ------------------------------- editor --------------------------------- */

interface ArticleEditorProps {
  rawValue: string
  onChange: (raw: string) => void
  disabled?: boolean
}

export function ArticleEditor({ rawValue, onChange, disabled = false }: ArticleEditorProps) {
  const [blocks, setBlocks] = useState<ArticleBlock[]>(() => {
    const doc = parseArticleDoc(rawValue)
    if (doc) return doc.blocks
    if (rawValue && rawValue.trim()) return legacyTextToBlocks(rawValue)
    return emptyDoc()
  })
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, strike: false })
  const [uploadingKind, setUploadingKind] = useState<string | null>(null)

  const editables = useRef(new Map<string, HTMLDivElement>())
  const registers = useRef(new Map<string, (el: HTMLDivElement | null) => void>())
  const lastEmitted = useRef<string>('__init__')
  const savedRange = useRef<Range | null>(null)

  const emit = useCallback(
    (next: ArticleBlock[]) => {
      const raw = docIsEmpty(next) ? '' : serializeArticleDoc(next)
      lastEmitted.current = raw
      onChange(raw)
    },
    [onChange]
  )

  // Mudança EXTERNA no rawValue (ex.: abriu outro item) → re-parseia
  useEffect(() => {
    if (rawValue === lastEmitted.current) return
    const doc = parseArticleDoc(rawValue)
    const next = doc ? doc.blocks : rawValue && rawValue.trim() ? legacyTextToBlocks(rawValue) : emptyDoc()
    editables.current.clear()
    setBlocks(next)
    lastEmitted.current = rawValue
     
  }, [rawValue])

  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, 'false')
    } catch {
      /* noop */
    }
  }, [])

  // Estados B/I/U/S conforme a seleção
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection()
      if (!sel || sel.rangeCount === 0) return
      let node: Node | null = sel.anchorNode
      let inside = false
      while (node) {
        if (node instanceof HTMLElement && editables.current.has(node.dataset?.editorBlockId ?? '')) {
          inside = true
          break
        }
        node = node.parentNode
      }
      if (!inside) return
      let bold = false
      let italic = false
      let underline = false
      let strike = false
      try {
        bold = document.queryCommandState('bold')
        italic = document.queryCommandState('italic')
        underline = document.queryCommandState('underline')
        strike = document.queryCommandState('strikeThrough')
      } catch {
        /* noop */
      }
      setFormats({ bold, italic, underline, strike })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [])

  /* ------------------------------ mutações ------------------------------ */

  const mutate = useCallback(
    (fn: (prev: ArticleBlock[]) => ArticleBlock[]) => {
      setBlocks((prev) => {
        const next = fn(prev)
        emit(next)
        return next
      })
    },
    [emit]
  )

  const patchBlock = useCallback(
    (id: string, patch: Partial<ArticleBlock>) => {
      mutate((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    },
    [mutate]
  )

  const insertAfter = useCallback(
    (block: ArticleBlock, afterId?: string | null) => {
      mutate((prev) => {
        const idx = afterId ? prev.findIndex((b) => b.id === afterId) : prev.length - 1
        const at = idx >= 0 ? idx + 1 : prev.length
        return [...prev.slice(0, at), block, ...prev.slice(at)]
      })
      requestAnimationFrame(() => {
        const el = editables.current.get(block.id)
        if (el) {
          el.focus()
          placeCaret(el, true)
          setFocusedId(block.id)
        }
      })
    },
    [mutate]
  )

  const removeBlock = useCallback(
    (id: string) => {
      mutate((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        const next = prev.filter((b) => b.id !== id)
        const fallback = next[Math.max(0, idx - 1)]
        if (fallback && TEXT_BLOCK_TYPES.includes(fallback.t)) {
          requestAnimationFrame(() => {
            const el = editables.current.get(fallback.id)
            if (el) {
              el.focus()
              placeCaret(el, true)
              setFocusedId(fallback.id)
            }
          })
        }
        return next.length ? next : emptyDoc()
      })
    },
    [mutate]
  )

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) => {
      mutate((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        const to = idx + dir
        if (idx < 0 || to < 0 || to >= prev.length) return prev
        const next = [...prev]
        const [item] = next.splice(idx, 1)
        next.splice(to, 0, item)
        return next
      })
    },
    [mutate]
  )

  const duplicateBlock = useCallback(
    (id: string) => {
      mutate((prev) => {
        const idx = prev.findIndex((b) => b.id === id)
        if (idx < 0) return prev
        const clone: ArticleBlock = { ...prev[idx], id: newBlockId() }
        return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)]
      })
    },
    [mutate]
  )

  const convertFocused = useCallback(
    (type: ArticleBlockType) => {
      if (!focusedId) return
      mutate((prev) =>
        prev.map((b) => {
          if (b.id !== focusedId) return b
          if (b.t === type) return b
          if (type === 'ul' || type === 'ol') {
            const item = stripInlineHtml(b.x ?? '') ? b.x ?? '' : ''
            return { ...b, t: type, items: item ? [item] : [''] }
          }
          if (b.t === 'ul' || b.t === 'ol') {
            const text = (b.items ?? []).filter((i) => stripInlineHtml(i)).join('<br>')
            return { ...b, t: type, x: text }
          }
          return { ...b, t: type }
        })
      )
    },
    [focusedId, mutate]
  )

  /* --------------------------- formatação ------------------------------ */

  const ensureFocus = useCallback(() => {
    if (!focusedId) return null
    const el = editables.current.get(focusedId)
    if (!el) return null
    if (document.activeElement !== el) {
      el.focus()
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) placeCaret(el, true)
    }
    return el
  }, [focusedId])

  const exec = useCallback(
    (cmd: string, value?: string) => {
      const el = ensureFocus()
      if (!el || disabled) return
      document.execCommand(cmd, false, value)
      const html = sanitizeInlineHtml(el.innerHTML)
      patchBlock(el.dataset.editorBlockId ?? focusedId ?? '', { x: html })
    },
    [ensureFocus, disabled, patchBlock, focusedId]
  )

  const openLinkPopover = useCallback(() => {
    const el = ensureFocus()
    if (!el) return
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
      // Pré-preenche se o cursor está dentro de um link
      let node: Node | null = sel.anchorNode
      while (node && node !== el) {
        if (node instanceof HTMLAnchorElement) {
          setLinkUrl(node.getAttribute('href') ?? '')
          break
        }
        node = node.parentNode
      }
    }
    setLinkOpen(true)
  }, [ensureFocus])

  const applyLink = useCallback(() => {
    const url = linkUrl.trim()
    setLinkOpen(false)
    if (!savedRange.current || !url) return
    const el = editables.current.get(focusedId ?? '')
    if (!el) return
    const sel = window.getSelection()
    if (!sel) return
    sel.removeAllRanges()
    sel.addRange(savedRange.current)
    const safe = /^(https?:\/\/|mailto:|\/)/i.test(url) ? url : `https://${url}`
    document.execCommand('createLink', false, safe)
    patchBlock(focusedId ?? '', { x: sanitizeInlineHtml(el.innerHTML) })
    setLinkUrl('')
  }, [linkUrl, focusedId, patchBlock])

  const removeLink = useCallback(() => {
    setLinkOpen(false)
    const el = ensureFocus()
    if (!el) return
    document.execCommand('unlink')
    patchBlock(focusedId ?? '', { x: sanitizeInlineHtml(el.innerHTML) })
  }, [ensureFocus, focusedId, patchBlock])

  /* ------------------------------ teclado ------------------------------- */

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, block: ArticleBlock) => {
      const el = e.currentTarget
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const sel = window.getSelection()
        let afterHtml = ''
        if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0)
          const after = range.cloneRange()
          after.selectNodeContents(el)
          after.setStart(range.endContainer, range.endOffset)
          const frag = after.extractContents()
          const tmp = document.createElement('div')
          tmp.appendChild(frag)
          afterHtml = tmp.innerHTML
        }
        const nextType: ArticleBlockType = block.t === 'h1' || block.t === 'h2' || block.t === 'h3' ? 'p' : block.t
        const currentHtml = sanitizeInlineHtml(el.innerHTML)
        const newBlock: ArticleBlock =
          nextType === 'quote' || nextType === 'callout'
            ? { id: newBlockId(), t: 'p', x: afterHtml }
            : { id: newBlockId(), t: nextType, x: afterHtml }
        mutate((prev) => {
          const idx = prev.findIndex((b) => b.id === block.id)
          const patched = prev.map((b) => (b.id === block.id ? { ...b, x: currentHtml } : b))
          return [...patched.slice(0, idx + 1), newBlock, ...patched.slice(idx + 1)]
        })
        requestAnimationFrame(() => {
          const target = editables.current.get(newBlock.id)
          if (target) {
            target.focus()
            placeCaret(target, false)
            setFocusedId(newBlock.id)
          }
        })
        return
      }
      if (e.key === 'Backspace') {
        const isEmpty = el.textContent.trim() === '' && !el.querySelector('a, img')
        const sel = window.getSelection()
        const caretAtStart =
          sel && sel.rangeCount > 0 && sel.isCollapsed && (sel.anchorOffset === 0 || el.textContent.trim() === '')
        if (isEmpty && block.t !== 'p') {
          e.preventDefault()
          convertFocused('p')
          return
        }
        if (isEmpty && caretAtStart && blocks.length > 1) {
          e.preventDefault()
          removeBlock(block.id)
        }
      }
    },
    [blocks.length, convertFocused, mutate, removeBlock]
  )

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    if (html) {
      document.execCommand('insertHTML', false, sanitizeInlineHtml(html))
    } else {
      const text = e.clipboardData.getData('text/plain')
      if (text) document.execCommand('insertText', false, text)
    }
  }, [])

  /* ------------------------------ uploads ------------------------------- */

  const uploadMedia = useCallback(
    async (file: File, kind: 'img' | 'aud', id: string) => {
      setUploadingKind(kind)
      try {
        const result = kind === 'img' ? await api.uploadImage(file) : (await api.uploadAttachment(file)).url
        patchBlock(id, { src: result })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha no upload do arquivo.')
      } finally {
        setUploadingKind(null)
      }
    },
    [patchBlock]
  )

  /* ------------------------------- UI bits ------------------------------ */

  const focusedBlock = blocks.find((b) => b.id === focusedId) ?? null
  const focusedIsText = focusedBlock ? TEXT_BLOCK_TYPES.includes(focusedBlock.t) : false

  const registerEditable = useCallback(
    (id: string) => {
      let fn = registers.current.get(id)
      if (!fn) {
        fn = (el: HTMLDivElement | null) => {
          if (el) {
            el.dataset.editorBlockId = id
            editables.current.set(id, el)
          } else {
            editables.current.delete(id)
          }
        }
        registers.current.set(id, fn)
      }
      return fn
    },
    []
  )

  const insertMenu: { type: ArticleBlockType; icon: React.ReactNode; label: string }[] = useMemo(
    () => [
      { type: 'ul', icon: <List className="size-4" aria-hidden />, label: 'Lista com marcadores' },
      { type: 'ol', icon: <ListOrdered className="size-4" aria-hidden />, label: 'Lista numerada' },
      { type: 'quote', icon: <Quote className="size-4" aria-hidden />, label: 'Citação' },
      { type: 'callout', icon: <Sparkles className="size-4" aria-hidden />, label: 'Destaque' },
      { type: 'img', icon: <ImageIcon className="size-4" aria-hidden />, label: 'Imagem' },
      { type: 'aud', icon: <Music className="size-4" aria-hidden />, label: 'Áudio' },
      { type: 'vid', icon: <Video className="size-4" aria-hidden />, label: 'Vídeo' },
      { type: 'btn', icon: <MousePointer className="size-4" aria-hidden />, label: 'Botão' },
      { type: 'hr', icon: <Minus className="size-4" aria-hidden />, label: 'Divisor' },
    ],
    []
  )

  const insertBlockOfType = useCallback(
    (type: ArticleBlockType) => {
      let block: ArticleBlock
      switch (type) {
        case 'ul':
        case 'ol':
          block = { id: newBlockId(), t: type, items: [''] }
          break
        case 'quote':
          block = { id: newBlockId(), t: 'quote', x: '', by: '' }
          break
        case 'callout':
          block = { id: newBlockId(), t: 'callout', x: '', tone: 'info' }
          break
        case 'img':
          block = { id: newBlockId(), t: 'img', src: '', alt: '', cap: '' }
          break
        case 'aud':
          block = { id: newBlockId(), t: 'aud', src: '', title: '' }
          break
        case 'vid':
          block = { id: newBlockId(), t: 'vid', src: '', cap: '' }
          break
        case 'btn':
          block = { id: newBlockId(), t: 'btn', label: 'Quero saber mais', href: '', variant: 'solid' }
          break
        case 'hr':
          block = { id: newBlockId(), t: 'hr' }
          break
        default:
          block = { id: newBlockId(), t: 'p', x: '' }
      }
      insertAfter(block, focusedId)
    },
    [focusedId, insertAfter]
  )

  const toolbarBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'

  /* --------------------------- sub-renderers ---------------------------- */

  const renderMediaSourcePicker = (
    block: ArticleBlock,
    opts: { accept?: string; placeholder: string; icon: React.ReactNode; kind: 'img' | 'aud' }
  ) => (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:text-blue-300',
            uploadingKind && 'pointer-events-none opacity-50'
          )}
        >
          {opts.icon}
          {uploadingKind === opts.kind ? 'Enviando…' : 'Enviar arquivo'}
          <input
            type="file"
            accept={opts.accept}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadMedia(file, opts.kind, block.id)
              e.target.value = ''
            }}
          />
        </label>
        <span className="text-xs text-slate-400 dark:text-slate-500">ou</span>
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5">
          <Input
            value={block.src ?? ''}
            onChange={(e) => patchBlock(block.id, { src: e.target.value })}
            placeholder={opts.placeholder}
            className="h-8 text-xs"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )

  const renderBlock = (block: ArticleBlock) => {
    const controls = (
      <div
        className={cn(
          'absolute -right-1 top-1/2 flex -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900',
          disabled && 'hidden'
        )}
      >
        <button
          type="button"
          aria-label="Mover para cima"
          className={toolbarBtn}
          onClick={() => moveBlock(block.id, -1)}
        >
          <ArrowUp className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Mover para baixo"
          className={toolbarBtn}
          onClick={() => moveBlock(block.id, 1)}
        >
          <ArrowDown className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Duplicar bloco"
          className={toolbarBtn}
          onClick={() => duplicateBlock(block.id)}
        >
          <Copy className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Excluir bloco"
          className={cn(toolbarBtn, 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400')}
          onClick={() => removeBlock(block.id)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      </div>
    )

    return (
      <div key={block.id} className="group relative rounded-xl pr-8 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
        {block.t === 'p' && (
          <Editable
            html={block.x ?? ''}
            placeholder={PLACEHOLDERS.p}
            ariaLabel="Parágrafo"
            register={registerEditable(block.id)}
            onInput={(html) => patchBlock(block.id, { x: sanitizeInlineHtml(html) })}
            onKeyDown={(e) => handleTextKeyDown(e, block)}
            onFocus={() => setFocusedId(block.id)}
            onPaste={handlePaste}
            className="min-h-[2.5rem] py-1.5 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline dark:[&_a]:text-blue-300"
          />
        )}
        {(block.t === 'h1' || block.t === 'h2' || block.t === 'h3') && (
          <Editable
            html={block.x ?? ''}
            placeholder={PLACEHOLDERS[block.t]}
            ariaLabel={BLOCK_TYPE_LABELS[block.t]}
            register={registerEditable(block.id)}
            onInput={(html) => patchBlock(block.id, { x: sanitizeInlineHtml(html) })}
            onKeyDown={(e) => handleTextKeyDown(e, block)}
            onFocus={() => setFocusedId(block.id)}
            onPaste={handlePaste}
            className={cn(
              'min-h-[2.5rem] py-1.5 font-extrabold tracking-tight text-slate-900 dark:text-slate-50',
              block.t === 'h1' && 'text-2xl',
              block.t === 'h2' && 'text-xl',
              block.t === 'h3' && 'text-lg'
            )}
          />
        )}
        {block.t === 'quote' && (
          <div className="my-1 flex gap-3 border-l-4 border-blue-500 pl-4">
            <div className="min-w-0 flex-1">
              <Editable
                html={block.x ?? ''}
                placeholder={PLACEHOLDERS.quote}
                ariaLabel="Citação"
                register={registerEditable(block.id)}
                onInput={(html) => patchBlock(block.id, { x: sanitizeInlineHtml(html) })}
                onKeyDown={(e) => handleTextKeyDown(e, block)}
                onFocus={() => setFocusedId(block.id)}
                onPaste={handlePaste}
                className="min-h-[2rem] py-1 text-[15px] font-medium italic leading-relaxed text-slate-800 dark:text-slate-100"
              />
              <Input
                value={block.by ?? ''}
                onChange={(e) => patchBlock(block.id, { by: e.target.value })}
                placeholder="Autor (opcional)"
                className="mt-1 h-7 border-none bg-transparent px-0 text-xs text-slate-500 shadow-none focus-visible:ring-0 dark:text-slate-400"
                disabled={disabled}
              />
            </div>
          </div>
        )}
        {block.t === 'callout' && (
          <div
            className={cn(
              'my-1 flex items-start gap-3 rounded-2xl border-l-4 p-4',
              (block.tone ?? 'info') === 'tip' && 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30',
              (block.tone ?? 'info') === 'warn' && 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30',
              (block.tone ?? 'info') === 'info' && 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
            )}
          >
            <button
              type="button"
              aria-label="Alternar tom do destaque"
              className="mt-0.5 shrink-0 rounded-md p-0.5 transition-transform hover:scale-110"
              onClick={() =>
                patchBlock(block.id, {
                  tone: block.tone === 'info' ? 'tip' : block.tone === 'tip' ? 'warn' : 'info',
                })
              }
              disabled={disabled}
            >
              <Sparkles
                className={cn(
                  'size-5',
                  (block.tone ?? 'info') === 'tip' && 'text-amber-600 dark:text-amber-400',
                  (block.tone ?? 'info') === 'warn' && 'text-rose-600 dark:text-rose-400',
                  (block.tone ?? 'info') === 'info' && 'text-blue-600 dark:text-blue-400'
                )}
                aria-hidden
              />
            </button>
            <div className="min-w-0 flex-1">
              <Editable
                html={block.x ?? ''}
                placeholder={PLACEHOLDERS.callout}
                ariaLabel="Destaque"
                register={registerEditable(block.id)}
                onInput={(html) => patchBlock(block.id, { x: sanitizeInlineHtml(html) })}
                onKeyDown={(e) => handleTextKeyDown(e, block)}
                onFocus={() => setFocusedId(block.id)}
                onPaste={handlePaste}
                className="min-h-[2rem] py-0.5 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Clique no ícone p/ alternar: info → dica → atenção
              </p>
            </div>
          </div>
        )}
        {(block.t === 'ul' || block.t === 'ol') && (
          <div className="my-1 space-y-1.5 py-1">
            {(block.items ?? []).map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {block.t === 'ul' ? (
                  <span aria-hidden className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                ) : (
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {i + 1}
                  </span>
                )}
                <Editable
                  html={item}
                  placeholder="Item da lista…"
                  ariaLabel={`Item ${i + 1} da lista`}
                  register={(el) => {
                    // itens usam id composto — fora do mapa de blocos de texto
                    if (el) el.dataset.editorBlockId = `${block.id}:${i}`
                  }}
                  onInput={(html) => {
                    const items = [...(block.items ?? [])]
                    items[i] = html
                    patchBlock(block.id, { items })
                  }}
                  onKeyDown={(e) => {
                    const el = e.currentTarget
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const items = [...(block.items ?? [])]
                      items.splice(i + 1, 0, '')
                      patchBlock(block.id, { items })
                    } else if (e.key === 'Backspace' && el.textContent.trim() === '') {
                      e.preventDefault()
                      const items = [...(block.items ?? [])]
                      if (items.length > 1) {
                        items.splice(i, 1)
                        patchBlock(block.id, { items })
                      } else {
                        removeBlock(block.id)
                      }
                    }
                  }}
                  onPaste={handlePaste}
                  className="min-h-[2rem] flex-1 py-1 text-[15px] leading-relaxed text-slate-800 dark:text-slate-100"
                />
                {(block.items ?? []).length > 1 && (
                  <button
                    type="button"
                    aria-label="Remover item"
                    className="mt-1.5 rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100 dark:text-slate-600"
                    onClick={() => {
                      const items = [...(block.items ?? [])]
                      items.splice(i, 1)
                      patchBlock(block.id, { items })
                    }}
                    disabled={disabled}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {block.t === 'img' && (
          <div className="my-2">
            {block.src ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                { }
                <img src={block.src} alt={block.alt || ''} className="max-h-80 w-full object-cover" />
                <div className="flex flex-col gap-2 bg-white p-3 dark:bg-slate-900">
                  <Input
                    value={block.cap ?? ''}
                    onChange={(e) => patchBlock(block.id, { cap: e.target.value })}
                    placeholder="Legenda da imagem (opcional)"
                    className="h-8 text-xs"
                    disabled={disabled}
                  />
                </div>
              </div>
            ) : (
              renderMediaSourcePicker(block, {
                accept: 'image/*',
                placeholder: 'https://…/imagem.png',
                icon: <ImageIcon className="size-3.5" aria-hidden />,
                kind: 'img',
              })
            )}
          </div>
        )}
        {block.t === 'aud' && (
          <div className="my-2">
            {block.src ? (
              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <AudioPlayer src={block.src} title={block.title || 'Áudio do artigo'} compact />
                <Input
                  value={block.title ?? ''}
                  onChange={(e) => patchBlock(block.id, { title: e.target.value })}
                  placeholder="Título do áudio (ex.: Versão em áudio · capítulo 1)"
                  className="mt-2 h-8 text-xs"
                  disabled={disabled}
                />
              </div>
            ) : (
              renderMediaSourcePicker(block, {
                accept: 'audio/*',
                placeholder: 'https://…/audio.mp3',
                icon: <Music className="size-3.5" aria-hidden />,
                kind: 'aud',
              })
            )}
          </div>
        )}
        {block.t === 'vid' && (
          <div className="my-2 flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Video className="size-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <Input
                value={block.src ?? ''}
                onChange={(e) => patchBlock(block.id, { src: e.target.value })}
                placeholder="Cole o link do YouTube, Vimeo ou um arquivo .mp4"
                className="h-8 text-xs"
                disabled={disabled}
              />
            </div>
            {block.src ? <VideoEmbed src={block.src} /> : null}
            <Input
              value={block.cap ?? ''}
              onChange={(e) => patchBlock(block.id, { cap: e.target.value })}
              placeholder="Legenda do vídeo (opcional)"
              className="h-8 text-xs"
              disabled={disabled}
            />
          </div>
        )}
        {block.t === 'btn' && (
          <div className="my-2 flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={block.label ?? ''}
                onChange={(e) => patchBlock(block.id, { label: e.target.value })}
                placeholder="Texto do botão"
                className="h-8 flex-1 text-xs font-semibold"
                disabled={disabled}
              />
              <Input
                value={block.href ?? ''}
                onChange={(e) => patchBlock(block.id, { href: e.target.value })}
                placeholder="https://link-ao-clicar"
                className="h-8 flex-[2] text-xs"
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => patchBlock(block.id, { variant: 'solid' })}
                disabled={disabled}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-bold transition-all',
                  (block.variant ?? 'solid') === 'solid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                Sólido
              </button>
              <button
                type="button"
                onClick={() => patchBlock(block.id, { variant: 'outline' })}
                disabled={disabled}
                className={cn(
                  'rounded-full px-3 py-1 text-[11px] font-bold transition-all',
                  block.variant === 'outline'
                    ? 'border border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                Contorno
              </button>
              <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
                Prévia: <span className="font-semibold text-blue-700 dark:text-blue-300">{block.label || 'Botão'}</span>
              </span>
            </div>
          </div>
        )}
        {block.t === 'hr' && (
          <div className="flex items-center gap-3 py-4">
            <hr className="flex-1 border-slate-200 dark:border-slate-800" />
            <Minus className="size-4 text-slate-300 dark:text-slate-600" aria-hidden />
            <hr className="flex-1 border-slate-200 dark:border-slate-800" />
          </div>
        )}
        {controls}
      </div>
    )
  }

  /* -------------------------------- render ------------------------------ */

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Barra de ferramentas */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/95 px-2.5 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
        <Select
          value={focusedIsText && focusedBlock ? focusedBlock.t : 'p'}
          onValueChange={(v) => convertFocused(v as ArticleBlockType)}
          disabled={disabled || !focusedIsText}
        >
          <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Tipo do bloco">
            <Type className="mr-1 size-3.5 text-slate-400" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['p', 'h1', 'h2', 'h3', 'quote', 'callout'] as const).map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {BLOCK_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span aria-hidden className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <button
          type="button"
          aria-label="Negrito"
          aria-pressed={formats.bold}
          disabled={disabled || !focusedIsText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('bold')}
          className={cn(toolbarBtn, formats.bold && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}
        >
          <Bold className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Itálico"
          aria-pressed={formats.italic}
          disabled={disabled || !focusedIsText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('italic')}
          className={cn(toolbarBtn, formats.italic && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}
        >
          <Italic className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Sublinhado"
          aria-pressed={formats.underline}
          disabled={disabled || !focusedIsText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('underline')}
          className={cn(toolbarBtn, formats.underline && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}
        >
          <Underline className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Riscado"
          aria-pressed={formats.strike}
          disabled={disabled || !focusedIsText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec('strikeThrough')}
          className={cn(toolbarBtn, formats.strike && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}
        >
          <Strikethrough className="size-4" aria-hidden />
        </button>

        <span aria-hidden className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        <button
          type="button"
          aria-label="Inserir link"
          disabled={disabled || !focusedIsText}
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPopover}
          className={cn(toolbarBtn, linkOpen && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300')}
        >
          <Link2 className="size-4" aria-hidden />
        </button>
        {linkOpen && (
          <div className="absolute inset-x-2 top-full z-20 mt-1 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <Input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyLink()
                if (e.key === 'Escape') setLinkOpen(false)
              }}
              placeholder="https:// endereço do link"
              className="h-8 text-xs"
            />
            <Button type="button" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={applyLink} disabled={disabled}>
              Aplicar
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-xs" onClick={removeLink} disabled={disabled}>
              <Unlink className="size-3.5" aria-hidden /> Remover
            </Button>
          </div>
        )}

        <span aria-hidden className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Inserir blocos */}
        {insertMenu.map((item) => (
          <button
            key={item.type}
            type="button"
            aria-label={item.label}
            title={item.label}
            disabled={disabled}
            onClick={() => insertBlockOfType(item.type)}
            className={toolbarBtn}
          >
            {item.icon}
          </button>
        ))}

        <span className="ml-auto hidden pl-2 text-[11px] font-medium text-slate-400 sm:block dark:text-slate-500">
          {docWordCount(blocks)} palavras
        </span>
      </div>

      {/* Corpo dos blocos */}
      <div className="max-h-[52vh] overflow-y-auto px-4 py-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar]:w-1.5">
        {blocks.map((block) => renderBlock(block))}
        {!disabled && (
          <button
            type="button"
            onClick={() => insertBlockOfType('p')}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-blue-700 dark:hover:text-blue-400"
          >
            <Plus className="size-3.5" aria-hidden /> Adicionar bloco
          </button>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <Eye className="size-3" aria-hidden />
          É WYSIWYG: o que você vê aqui é como o aluno vai ler. Use os ícones no topo p/ inserir mídia
          e os controles laterais (aparecem ao passar o mouse) p/ mover/duplicar/excluir.
        </p>
      </div>
    </div>
  )
}

/* ícone extra p/ botão CTA no menu de inserção */
function MousePointer({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 9l10.5 3.5-4.6 2.1a2 2 0 0 0-1 1L11.5 20 9 9z" fill="currentColor" stroke="none" />
      <rect x="3" y="3" width="18" height="18" rx="5" />
    </svg>
  )
}
