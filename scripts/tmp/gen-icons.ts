/**
 * Gera os ícones PWA da Órbita a partir de um SVG (marca: planeta âmbar +
 * anel orbital, fundo stone escuro estilo Apple). Rode: bun scripts/tmp/gen-icons.ts
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const SVG = String.raw`<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#292524"/>
      <stop offset="1" stop-color="#1C1917"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#F59E0B" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="planet" x1="0.25" y1="0.15" x2="0.75" y2="0.9">
      <stop offset="0" stop-color="#FCD34D"/>
      <stop offset="0.55" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="228" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="228" fill="url(#glow)"/>
  <g transform="translate(512 512)">
    <g transform="rotate(-18)">
      <ellipse rx="330" ry="118" fill="none" stroke="#F5F5F4" stroke-width="30" stroke-opacity="0.95"/>
    </g>
    <circle r="158" fill="url(#planet)"/>
    <circle cx="-46" cy="-58" r="34" fill="#FEF3C7" fill-opacity="0.55"/>
    <g transform="rotate(-18)">
      <circle cx="330" cy="0" r="46" fill="#F5F5F4"/>
    </g>
  </g>
</svg>`

const outDir = 'public/icons'
mkdirSync(outDir, { recursive: true })

const base = sharp(Buffer.from(SVG)).resize(1024, 1024)
await base.clone().toFile(`${outDir}/icon-1024.png`)
await base.clone().resize(512, 512).toFile(`${outDir}/icon-512.png`)
await base.clone().resize(192, 192).toFile(`${outDir}/icon-192.png`)
await base.clone().resize(180, 180).toFile(`${outDir}/apple-touch-icon.png`)
console.log('Ícones Órbita gerados em public/icons')
