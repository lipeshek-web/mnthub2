// Gerador mínimo de PDF 1.4 (Helvetica) — extraído de prisma/gen-seed-pdfs.ts
import fs from 'fs'
import path from 'path'

const A4 = [595, 842]
const LINE = 15.5

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function wrap(text: string, maxChars: number): string[] {
  const out: string[] = []
  for (const para of text.split(/\n/)) {
    if (!para.trim()) {
      out.push('')
      continue
    }
    if (para.startsWith('## ')) {
      out.push(`## ${para.slice(3)}`)
      continue
    }
    let line = ''
    for (const word of para.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > maxChars) {
        out.push(line.trim())
        line = word
      } else {
        line = (line + ' ' + word).trim()
      }
    }
    if (line) out.push(line)
  }
  return out
}

export type PageInput = { heading: string; body: string }

export function makePdf(title: string, subtitle: string, author: string, pages: PageInput[]): Buffer {
  const streams: string[] = []

  const cover: string[] = []
  cover.push('0.059 0.42 0.478 rg')
  cover.push('0 792 595 50 re f')
  cover.push('0 0 595 12 re f')
  cover.push('BT')
  cover.push('/F2 26 Tf 1 1 1 rg')
  cover.push(`64 760 Td (${esc('MentorHub · Biblioteca')}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F2 30 Tf 0.12 0.12 0.12 rg')
  cover.push(`64 560 Td 34 TL (${esc(title.length > 34 ? title.slice(0, 34) : title)}) Tj T*`)
  if (title.length > 34) cover.push(`(${esc(title.slice(34, 68))}) Tj T*`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 14 Tf 0.35 0.35 0.35 rg')
  cover.push(`64 500 Td (${esc(subtitle)}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 12 Tf 0.4 0.4 0.4 rg')
  cover.push(`64 90 Td (${esc('por ' + author)}) Tj`)
  cover.push('ET')
  cover.push('BT')
  cover.push('/F1 10 Tf 0.55 0.55 0.55 rg')
  cover.push(`64 70 Td (${esc('Material de estudo da plataforma MentorHub — mentorhub.demo')}) Tj`)
  cover.push('ET')
  streams.push(cover.join('\n'))

  for (const page of pages) {
    const maxChars = 86
    const lines = wrap(page.body, maxChars)
    const cmds: string[] = []
    cmds.push('BT')
    cmds.push('/F2 18 Tf 0.059 0.35 0.31 rg')
    cmds.push(`64 780 Td (${esc(page.heading)}) Tj`)
    cmds.push('ET')
    cmds.push('0.898 0.898 0.898 RG 1 w 64 764 m 531 764 l S')
    cmds.push('BT')
    cmds.push('/F1 11 Tf 0.22 0.22 0.22 rg')
    cmds.push(`64 740 Td ${LINE} TL`)
    lines.forEach((ln, idx) => {
      if (idx === lines.length - 1) {
        if (ln) cmds.push(`(${esc(ln)}) Tj`)
      } else if (ln.startsWith('## ')) {
        cmds.push('0.059 0.35 0.31 rg')
        cmds.push(`(${esc(ln.slice(3))}) Tj T*`)
        cmds.push('0.22 0.22 0.22 rg')
      } else if (ln === '') {
        cmds.push('T*')
      } else {
        cmds.push(`(${esc(ln)}) Tj T*`)
      }
    })
    cmds.push('ET')
    cmds.push('BT')
    cmds.push('/F1 9 Tf 0.55 0.55 0.55 rg')
    cmds.push(`64 40 Td (${esc(title + ' · ' + author)}) Tj`)
    cmds.push('ET')
    streams.push(cmds.join('\n'))
  }

  const nPages = streams.length
  const objs: string[] = []
  const pageObjNums: number[] = []
  const contentObjNums: number[] = []
  let next = 5
  for (let i = 0; i < nPages; i++) {
    pageObjNums.push(next++)
    contentObjNums.push(next++)
  }

  objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`
  objs[2] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${nPages} >>`
  objs[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`
  objs[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`

  for (let i = 0; i < nPages; i++) {
    objs[pageObjNums[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNums[i]} 0 R >>`
    objs[contentObjNums[i]] = `<< /Length ${Buffer.byteLength(streams[i], 'latin1')} >>\nstream\n${streams[i]}\nendstream`
  }

  const chunks: Buffer[] = []
  let offset = 0
  const offsets: number[] = []
  const push = (s: string) => {
    const b = Buffer.from(s, 'latin1')
    chunks.push(b)
    offset += b.length
  }

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = offset
    push(`${i} 0 obj\n${objs[i]}\nendobj\n`)
  }
  const xrefStart = offset
  const total = objs.length
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`
  for (let i = 1; i < total; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  push(xref)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)

  return Buffer.concat(chunks)
}

export function writePdf(outPath: string, title: string, subtitle: string, author: string, pages: PageInput[]) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, makePdf(title, subtitle, author, pages))
  return outPath
}
