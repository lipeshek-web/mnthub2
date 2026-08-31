/**
 * Helpers de formatação pt-BR — sem dependências externas.
 *
 * IMPORTANTE: datas de mentorias/aulas ao vivo ("startsAt") são naive local
 * "YYYY-MM-DDTHH:mm", então são formatadas manualmente (sem new Date),
 * evitando qualquer conversão de fuso horário.
 */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DECIMAL = new Intl.NumberFormat("pt-BR");

export function formatPrice(price: number): string {
  if (!price || price <= 0) return "Gratuito";
  return BRL.format(price);
}

/** creditCents vem em centavos. */
export function formatCents(cents: number): string {
  return BRL.format((cents ?? 0) / 100);
}

export function formatNumber(n: number): string {
  return DECIMAL.format(n ?? 0);
}

export function formatXp(xp: number): string {
  return `${DECIMAL.format(xp ?? 0)} XP`;
}

/** 45 → "45min"; 90 → "1h 30min"; 120 → "2h" */
export function formatDuration(min: number): string {
  const total = Math.max(0, Math.round(min ?? 0));
  if (total < 60) return `${total}min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/* ------------------------- datas naive ---------------------------- */

export interface NaiveParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

export function parseNaive(value: string | null | undefined): NaiveParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value ?? "");
  if (!match) return null;
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3]),
    hh: match[4] ? Number(match[4]) : 0,
    mm: match[5] ? Number(match[5]) : 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEKDAYS_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function weekdayIndex(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "2025-03-12T14:30" → "12/03 14:30" */
export function formatNaiveDateTime(value: string | null | undefined): string {
  const p = parseNaive(value);
  if (!p) return value ?? "";
  return `${pad(p.d)}/${pad(p.m)} ${pad(p.hh)}:${pad(p.mm)}`;
}

/** "2025-03-12T14:30" → "quarta, 12/03 às 14:30" */
export function formatNaiveLong(value: string | null | undefined): string {
  const p = parseNaive(value);
  if (!p) return value ?? "";
  const wd = WEEKDAYS_LONG[weekdayIndex(p.y, p.m, p.d)];
  return `${wd}, ${pad(p.d)}/${pad(p.m)} às ${pad(p.hh)}:${pad(p.mm)}`;
}

/* -------------------- dias para agendamento ----------------------- */

/** Data local de hoje como "YYYY-MM-DD" (sem envolver fuso). */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const p = parseNaive(iso);
  if (!p) return iso;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export interface DayChip {
  iso: string;
  weekday: string;
  label: string;
}

/** Próximos `count` dias (hoje incluso) para os chips de agendamento. */
export function upcomingDays(count = 14): DayChip[] {
  const start = todayISO();
  const out: DayChip[] = [];
  for (let i = 0; i < count; i += 1) {
    const iso = addDaysISO(start, i);
    const p = parseNaive(iso);
    if (!p) continue;
    out.push({
      iso,
      weekday: i === 0 ? "hoje" : i === 1 ? "amanhã" : WEEKDAYS_SHORT[weekdayIndex(p.y, p.m, p.d)],
      label: `${pad(p.d)}/${pad(p.m)}`,
    });
  }
  return out;
}

/* ------------------ datas absolutas (ISO com fuso) ---------------- */

/** Timestamps absolutos (createdAt de notificações/avaliações) — formatados com Intl. */
export function formatIsoDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* -------------------- tempo relativo (notificações) ---------------- */

/** "2025-03-12T14:30Z" → "agora", "12 min", "3 h", "2 d" ou data/dd/mm hh:mm. */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "agora";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return formatIsoDateTime(value);
}

/* ----------------------------- rótulos ---------------------------- */

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  BEGINNER: "Iniciante",
  BASIC: "Básico",
  INTERMEDIARIO: "Intermediário",
  INTERMEDIATE: "Intermediário",
  AVANCADO: "Avançado",
  ADVANCED: "Avançado",
};

export function levelLabel(level: string | null | undefined): string {
  const raw = (level ?? "").trim();
  if (!raw) return "";
  const key = raw.toUpperCase();
  if (LEVEL_LABELS[key]) return LEVEL_LABELS[key];
  const lower = raw.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
