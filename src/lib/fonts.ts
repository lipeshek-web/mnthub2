import {
  Archivo,
  Bebas_Neue,
  Caveat,
  Crimson_Pro,
  Dancing_Script,
  DM_Serif_Display,
  Fraunces,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Manrope,
  Merriweather,
  Montserrat,
  Nunito,
  Outfit,
  Patrick_Hand,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Sora,
  Space_Grotesk,
  Work_Sans,
} from 'next/font/google'

/* ==================== TIPOGRAFIA DO CRIADOR ====================
   Catálogo de fontes que o mentor/criador pode escolher para o
   NOME + TÍTULOS e para as DESCRIÇÕES da sua página pública.

   Como é leve:
   - next/font/google baixa cada arquivo woff2 UMA vez no build
     (dev) e auto-hospeda — nada de CDN externo em runtime.
   - As regras @font-face ficam no CSS da página, mas o navegador
     só baixa de fato os arquivos das fontes realmente usadas
     (font-display: swap). Quem não personaliza nada não baixa
     nada além do padrão.
   - Aplicação via font.style (fontFamily real) — sem depender de
     variáveis CSS geradas (nomes mudam entre versões do Next).
   - Peso pequeno por fonte (2–4 cortes), subsets latinos apenas.

   IMPORTANTE: cada loader next/font/google precisa ser chamado
   direto no escopo do módulo e atribuído a uma const (exigência
   do transform do Next) — por isso as declarações explícitas. */

export type MentorFontCategory = 'sans' | 'serif' | 'display' | 'handwriting' | 'mono'

/** Tipo estrutural mínimo do objeto retornado por next/font/google */
interface NextFontModule {
  style: React.CSSProperties
  className: string
}

export interface MentorFont {
  /** ID estável salvo no banco (MentorProfile.fontHeading / fontBody) */
  id: string
  /** Nome comercial exibido no seletor */
  label: string
  category: MentorFontCategory
  /** style="font-family" pronto (com fallback ajustado pelo next/font) */
  style: React.CSSProperties
  /** Prévia "Aa" no card — fallback genérico da família */
  fallback: string
}

// ---- Sans (modernas e limpas) ----
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap' })
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const sora = Sora({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap' })

// ---- Serif (elegantes e editoriais) ----
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700', '900'], display: 'swap' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', display: 'swap' })
const lora = Lora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })
const crimsonPro = Crimson_Pro({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap' })
const libreBaskerville = Libre_Baskerville({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600', '700', '900'], display: 'swap' })

// ---- Display (personalidade forte) ----
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap' })
const archivo = Archivo({ subsets: ['latin'], weight: ['400', '600', '700', '900'], display: 'swap' })
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap' })

// ---- Manuscritas (toque humano) ----
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })
const patrickHand = Patrick_Hand({ subsets: ['latin'], weight: '400', display: 'swap' })

// ---- Mono (código e tecnologia) ----
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '600'], display: 'swap' })

// A ordem define a exibição no seletor. IDs nunca mudam (estão no banco).
type MentorFontSeed = Omit<MentorFont, 'style'> & { font: NextFontModule }

const FONT_SEEDS: MentorFontSeed[] = [
  { id: 'inter', label: 'Inter', category: 'sans', font: inter, fallback: 'sans-serif' },
  { id: 'poppins', label: 'Poppins', category: 'sans', font: poppins, fallback: 'sans-serif' },
  { id: 'montserrat', label: 'Montserrat', category: 'sans', font: montserrat, fallback: 'sans-serif' },
  { id: 'nunito', label: 'Nunito', category: 'sans', font: nunito, fallback: 'sans-serif' },
  { id: 'work-sans', label: 'Work Sans', category: 'sans', font: workSans, fallback: 'sans-serif' },
  { id: 'outfit', label: 'Outfit', category: 'sans', font: outfit, fallback: 'sans-serif' },
  { id: 'sora', label: 'Sora', category: 'sans', font: sora, fallback: 'sans-serif' },
  { id: 'manrope', label: 'Manrope', category: 'sans', font: manrope, fallback: 'sans-serif' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans', category: 'sans', font: plusJakarta, fallback: 'sans-serif' },
  { id: 'playfair', label: 'Playfair Display', category: 'serif', font: playfair, fallback: 'serif' },
  { id: 'dm-serif', label: 'DM Serif Display', category: 'serif', font: dmSerif, fallback: 'serif' },
  { id: 'lora', label: 'Lora', category: 'serif', font: lora, fallback: 'serif' },
  { id: 'merriweather', label: 'Merriweather', category: 'serif', font: merriweather, fallback: 'serif' },
  { id: 'crimson-pro', label: 'Crimson Pro', category: 'serif', font: crimsonPro, fallback: 'serif' },
  { id: 'libre-baskerville', label: 'Libre Baskerville', category: 'serif', font: libreBaskerville, fallback: 'serif' },
  { id: 'fraunces', label: 'Fraunces', category: 'serif', font: fraunces, fallback: 'serif' },
  { id: 'space-grotesk', label: 'Space Grotesk', category: 'display', font: spaceGrotesk, fallback: 'sans-serif' },
  { id: 'archivo', label: 'Archivo', category: 'display', font: archivo, fallback: 'sans-serif' },
  { id: 'bebas-neue', label: 'Bebas Neue', category: 'display', font: bebasNeue, fallback: 'sans-serif' },
  { id: 'caveat', label: 'Caveat', category: 'handwriting', font: caveat, fallback: 'cursive' },
  { id: 'dancing-script', label: 'Dancing Script', category: 'handwriting', font: dancingScript, fallback: 'cursive' },
  { id: 'patrick-hand', label: 'Patrick Hand', category: 'handwriting', font: patrickHand, fallback: 'cursive' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', category: 'mono', font: jetbrainsMono, fallback: 'monospace' },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', category: 'mono', font: ibmPlexMono, fallback: 'monospace' },
]

export const MENTOR_FONTS: MentorFont[] = FONT_SEEDS.map((f) => ({
  id: f.id,
  label: f.label,
  category: f.category,
  fallback: f.fallback,
  style: f.font.style,
}))

export const MENTOR_FONT_IDS = new Set(MENTOR_FONTS.map((f) => f.id))

export const MENTOR_FONT_CATEGORIES: { value: MentorFontCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Manuscrita' },
  { value: 'mono', label: 'Mono' },
]

/** Busca uma fonte do catálogo por id (ou null p/ padrão/desconhecido) */
export function getMentorFont(id: string | null | undefined): MentorFont | null {
  if (!id) return null
  return MENTOR_FONTS.find((f) => f.id === id) ?? null
}

/** style="font-family" para o slot heading (nome + títulos); undefined = herda padrão */
export function headingFontStyle(fontHeading: string | null | undefined): React.CSSProperties | undefined {
  const f = getMentorFont(fontHeading)
  return f?.style
}

/** style="font-family" para o slot body (descrições e texto corrido) */
export function bodyFontStyle(fontBody: string | null | undefined): React.CSSProperties | undefined {
  const f = getMentorFont(fontBody)
  return f?.style
}

/** style para prévia em cards do seletor (usa a própria fonte) */
export function fontPreviewStyle(f: MentorFont): React.CSSProperties {
  return f.style
}
