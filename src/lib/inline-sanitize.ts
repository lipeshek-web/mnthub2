/**
 * Sanitização leve de HTML inline (negrito/itálico/sublinhado/riscado/link)
 * usada pelos blocos de texto do editor e do leitor de artigos.
 *
 * Filosofia "não fique pesado": sem dependências — DOMParser + whitelist de
 * ~8 tags. Tudo que não está na lista é "desembrulhado" (o texto permanece),
 * script/style são removidos de vez e links só saem com href seguro.
 */

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'A', 'BR'])

function safeHref(href: string): string | null {
  const value = href.trim()
  if (!value) return null
  const lower = value.toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null
  }
  return value
}

export function sanitizeInlineHtml(html: string): string {
  if (!html || !html.trim()) return ''
  if (typeof DOMParser === 'undefined') return html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.body

  const walk = (node: Element) => {
    const children = Array.from(node.children)
    for (const child of children) {
      const tag = child.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE') {
        child.remove()
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) {
        // Desembrulha: mantém o conteúdo, descarta a tag desconhecida
        const fragment = doc.createDocumentFragment()
        while (child.firstChild) fragment.appendChild(child.firstChild)
        child.replaceWith(fragment)
        // Re-processa o nível atual (os filhos subiram para este nó)
        walk(node)
        return
      }
      if (tag === 'A') {
        const href = child.getAttribute('href')
        const safe = href ? safeHref(href) : null
        if (!safe) {
          const fragment = doc.createDocumentFragment()
          while (child.firstChild) fragment.appendChild(child.firstChild)
          child.replaceWith(fragment)
          walk(node)
          return
        }
        child.setAttribute('href', safe)
        for (const attr of Array.from(child.attributes)) {
          if (attr.name !== 'href') child.removeAttribute(attr.name)
        }
      } else {
        for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name)
      }
      walk(child)
    }
  }

  walk(root)
  return root.innerHTML
}
