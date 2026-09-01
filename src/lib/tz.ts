/**
 * Fuso horário — o MentorHub armazena datas de sessão como naive local
 * "YYYY-MM-DDTHH:mm" no fuso CANÔNICO da plataforma (America/Bahia, padrão
 * dos mentores brasileiros). Quem acessa de outro fuso vê a conversão
 * automática ao lado do horário original — sem mudar o modelo de dados.
 */

export const PLATFORM_TZ = 'America/Bahia'

/** Fuso do navegador (client-side; seguro para SSR pois só usamos em handlers/eventos) */
export function browserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || PLATFORM_TZ
  } catch {
    return PLATFORM_TZ
  }
}

/** Offset (ms) do fuso em um instante UTC dado */
function zoneOffsetMs(instant: Date, zone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(instant)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  return asUtc - instant.getTime()
}

/**
 * Converte naive "YYYY-MM-DDTHH:mm" interpretado em `fromZone` para o mesmo
 * instante expressado em `toZone`. Retorna "HH:mm".
 */
export function convertNaiveAcrossZones(naive: string, fromZone: string, toZone: string): string | null {
  try {
    // Interpreta o naive como UTC, corrige pelo offset do fuso de origem
    const asIfUtc = new Date(`${naive}:00Z`)
    if (Number.isNaN(asIfUtc.getTime())) return null
    const instant = new Date(asIfUtc.getTime() - zoneOffsetMs(asIfUtc, fromZone))
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: toZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return fmt.format(instant)
  } catch {
    return null
  }
}

/** Nome curto do fuso no formato pt-BR (ex.: "GMT-3", "BRT") */
export function zoneShortLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: zone, timeZoneName: 'short' }).formatToParts(new Date())
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? zone
  } catch {
    return zone
  }
}

/**
 * Frase de conversão quando o navegador do usuário está em fuso DIFERENTE do
 * canônico da plataforma. Ex.: "18:00 no seu fuso (GMT+1)" — null quando
 * desnecessária (mesmo fuso, conversão impossível ou horário idêntico).
 */
export function crossZoneHint(naive: string): string | null {
  if (typeof window === 'undefined') return null
  const local = browserTz()
  if (!local || local === PLATFORM_TZ) return null
  const converted = convertNaiveAcrossZones(naive, PLATFORM_TZ, local)
  if (!converted) return null
  const [hh, mm] = converted.split(':').map(Number)
  const naiveHm = naive.slice(11, 16)
  if (naiveHm === `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`) return null
  return `${converted} no seu fuso (${zoneShortLabel(local)})`
}
