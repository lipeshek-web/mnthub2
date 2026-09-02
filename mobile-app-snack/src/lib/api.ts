/**
 * Cliente da API REST do MentorHub (v1) — edição Snack.
 *
 * - URL do servidor: constante DEFAULT_SERVER_URL abaixo (ou trocada em
 *   runtime no campo "Servidor da API" da tela de login); rotas ficam sob /api/v1.
 * - Token JWT é guardado com expo-secure-store e enviado como "Authorization: Bearer".
 * - Erros da API chegam como { "error": "mensagem em pt-BR" } → convertidos em ApiError.
 * - 401 em chamada autenticada → limpa o token e dispara logout automático.
 */
import * as SecureStore from "expo-secure-store";

/* ------------------------------------------------------------------ */
/* Configuração                                                        */
/* ------------------------------------------------------------------ */

/**
 * URL de produção do MentorHub (sem /api/v1 no final).
 * Já vem configurada — se um dia mudar, troque aqui OU no campo
 * “Servidor da API” da tela de login (o valor digitado lá fica salvo no aparelho).
 */
export const DEFAULT_SERVER_URL = "https://mentorhub.space-z.ai";

const TOKEN_KEY = "mentorhub.auth.token";
const SERVER_KEY = "mentorhub.server.url";

function normalizeServer(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

// Servidor em uso — pode ser trocado em runtime pela tela de login.
let memoryServer = DEFAULT_SERVER_URL;

// Token em memória (cache) + persistência segura via SecureStore.
// Se o SecureStore não estiver disponível (ex.: web), caímos para o cache em memória.
let memoryToken: string | null = null;
let storageLoaded = false;

async function ensureStorageLoaded(): Promise<void> {
  if (storageLoaded) return;
  try {
    const [token, server] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(SERVER_KEY),
    ]);
    if (token) memoryToken = token;
    if (server) memoryServer = normalizeServer(server);
  } catch {
    // Sem persistência disponível (ex.: preview web do Snack) — só memória.
  }
  storageLoaded = true;
}

export async function getToken(): Promise<string | null> {
  await ensureStorageLoaded();
  return memoryToken;
}

/** URL do servidor atual (sem /api/v1) — para abrir o site no navegador. */
export function siteUrl(): string {
  return memoryServer;
}

/**
 * Normaliza URLs de imagens (capas, avatars, anexos) para o servidor atual.
 *
 * A API pode retornar coverUrl/avatarUrl apontando para um domínio antigo/morto
 * (ex.: "http://...fcapp.run/uploads/seed/x.webp"). Extraímos apenas o path a
 * partir da primeira ocorrência de /uploads/ (ou /api/) e reconstruímos com o
 * servidor em uso — isso mata o domínio morto e o http inseguro de uma vez.
 *
 * Síncrona de propósito: as respostas da API só chegam depois de um request(),
 * que já garantiu o carregamento do servidor salvo (ensureStorageLoaded).
 */
export function assetUrl(url?: string | null): string | undefined {
  const raw = (url ?? "").trim();
  if (!raw) return undefined;
  const match = /\/(?:uploads|api)\/\S*/.exec(raw);
  if (match) return siteUrl() + match[0];
  if (raw.startsWith("/")) return siteUrl() + raw;
  return raw; // URL externa completa (data:, https://...) — devolve como veio
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  storageLoaded = true;
  try {
    if (token === null) await SecureStore.deleteItemAsync(TOKEN_KEY);
    else await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Sem persistência disponível — o token segue válido só em memória.
  }
}

/** Troca o servidor em uso e persiste no aparelho (tela de login). */
export async function setServerUrl(url: string): Promise<void> {
  const next = normalizeServer(url);
  memoryServer = next || DEFAULT_SERVER_URL;
  storageLoaded = true;
  try {
    await SecureStore.setItemAsync(SERVER_KEY, memoryServer);
  } catch {
    // Sem persistência — segue em memória.
  }
}

/** URL do servidor atual (assíncrona — lê do SecureStore na 1ª chamada). */
export async function getServerUrl(): Promise<string> {
  await ensureStorageLoaded();
  return memoryServer;
}

/* ------------------------------------------------------------------ */
/* Erros                                                               */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  /** Status HTTP (0 = falha de rede). */
  status: number;
  /** Corpo bruto da resposta, quando existir (ex.: { error, price } num 402). */
  payload?: Record<string, unknown>;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Mensagem amigável para qualquer erro capturado nas telas. */
export function errMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return "Algo deu errado. Tente novamente.";
}

/* ------------------------------------------------------------------ */
/* Logout automático em 401                                            */
/* ------------------------------------------------------------------ */

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** Registrado pelo AuthProvider: dispara quando um 401 ocorre numa chamada autenticada. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/* ------------------------------------------------------------------ */
/* Motor de requisições                                                */
/* ------------------------------------------------------------------ */

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** true (padrão) → anexa o token e trata 401 como sessão inválida. */
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

const STATUS_MESSAGES: Record<number, string> = {
  0: "Não foi possível conectar ao servidor. Verifique sua internet e o endereço do servidor (campo “Servidor da API” no login).",
  400: "Requisição inválida. Verifique os dados e tente novamente.",
  401: "Sessão expirada. Faça login novamente.",
  402: "Este curso é pago. A compra é feita pelo site do MentorHub.",
  403: "Você não tem permissão para isso.",
  404: "Conteúdo não encontrado.",
  409: "Este horário ficou indisponível. Escolha outro, por favor.",
  500: "Erro interno do servidor. Tente novamente em instantes.",
};

// RN/Hermes não tem URLSearchParams — montamos a query na mão (com encode seguro).
function buildUrl(path: string, query?: RequestOptions["query"]): string {
  let url = `${memoryServer}/api/v1${path}`;
  if (query) {
    const parts = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    if (parts.length > 0) url += `?${parts.join("&")}`;
  }
  return url;
}

function extractErrorMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, query } = options;

  // Garante que token e servidor salvos já foram lidos do SecureStore.
  await ensureStorageLoaded();

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let hadToken = false;
  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      hadToken = true;
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(STATUS_MESSAGES[0], 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // 401 numa chamada autenticada → token inválido/expirado: logout automático.
    if (res.status === 401 && hadToken) {
      await setToken(null);
      onUnauthorized?.();
    }
    const error = new ApiError(
      extractErrorMessage(data) ?? STATUS_MESSAGES[res.status] ?? "Não foi possível concluir a operação.",
      res.status
    );
    if (data && typeof data === "object" && !Array.isArray(data)) {
      error.payload = data as Record<string, unknown>;
    }
    throw error;
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/* Tipos das respostas da API                                          */
/* ------------------------------------------------------------------ */

/** Usuário retornado no login (campos básicos). */
export interface User {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  xp: number;
  studyStreak: number;
  longestStreak: number;
  role: string;
  isMentor: boolean;
}

/** /auth/me devolve o usuário completo + créditos e contadores. */
export interface MeUser extends User {
  creditCents: number;
  unreadNotifications: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: MeUser;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/* Biblioteca (livros e artigos) */

export type LibraryKind = "BOOK" | "ARTICLE";

export interface LibraryItemSummary {
  id: string;
  kind: LibraryKind;
  title: string;
  description: string | null;
  category: string;
  level: string;
  coverUrl: string | null;
  readingMin: number | null;
  createdAt: string;
  mentor: { id: string; name: string; avatarUrl: string | null };
}

export interface LibraryItemDetail extends Omit<LibraryItemSummary, "mentor"> {
  pdfUrl: string | null;
  content: string | null;
  updatedAt: string | null;
  mentor: { id: string; name: string; headline: string | null; avatarUrl: string | null };
}

/* Cursos */

export interface CourseMentorRef {
  id: string;
  name: string;
  headline: string | null;
  rating?: number;
  avatarUrl: string | null;
}

export interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  price: number;
  coverUrl: string | null;
  lessonCount: number;
  totalDurationMin: number;
  liveCount: number;
  mentorshipCount: number;
  studentCount: number;
  rating: number;
  reviewCount: number;
  mentor: CourseMentorRef;
  enrolled: boolean;
}

export type LessonKind = "RECORDED" | "TEXT" | "LIVE";

export interface LessonAttachment {
  name: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  kind: LessonKind;
  durationMin: number;
  order: number;
  videoUrl: string | null;
  content: string | null;
  startsAt: string | null;
  meetingUrl: string | null;
  attachments: LessonAttachment[];
  libraryItemId: string | null;
  /** true quando o aluno não está inscrito (conteúdo veio nulo da API). */
  locked: boolean;
}

export interface CourseTheme {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

export interface CourseEnrollment {
  completedLessonIds: string[];
  completedAt: string | null;
}

export interface CourseDetailResponse {
  course: CourseItem;
  themes: CourseTheme[];
  /** Aulas sem tema vêm no topo. */
  lessons: Lesson[];
  enrollment: CourseEnrollment | null;
}

export interface EnrollResponse {
  ok: boolean;
  alreadyEnrolled?: boolean;
}

export interface ToggleLessonResponse {
  completedLessonIds: string[];
  xpAwarded: number;
  courseCompleted: boolean;
}

/* Mentores */

export interface MentorListItem {
  id: string;
  name: string;
  headline: string | null;
  avatarUrl: string | null;
  hourlyRate: number;
  categories: string[];
  rating: number;
  reviewCount: number;
  experienceYears: number;
}

export interface MentorDetail extends MentorListItem {
  /** Id do USUÁRIO do mentor (para abrir conversa em /messages). */
  userId?: string;
  description: string | null;
  languages: string[];
  instagram: string | null;
  linkedin: string | null;
  website: string | null;
}

export interface MentorReview {
  id: string;
  rating: number;
  comment: string | null;
  author: string;
  createdAt: string;
}

export interface MentorDetailResponse {
  mentor: MentorDetail;
  reviews: MentorReview[];
}

export interface SlotsResponse {
  slots: string[];
}

/* Mentorias (agendamentos) */

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Booking {
  id: string;
  /** Naive local "YYYY-MM-DDTHH:mm". */
  startsAt: string;
  durationMin: number;
  topic: string;
  notes: string | null;
  status: BookingStatus;
  meetingRoom: string | null;
  price: number;
  createdAt: string;
  mentor: { id: string; name: string; headline: string | null; avatarUrl: string | null };
  reviewed: boolean;
}

export interface BookingInput {
  mentorId: string;
  /** "YYYY-MM-DDTHH:mm" (naive local). */
  startsAt: string;
  durationMin: number;
  topic: string;
  notes?: string;
}

export interface BookingCreated {
  id: string;
  status: BookingStatus;
  meetingRoom: string | null;
  price: number;
}

/* Dashboard */

export interface DashboardEnrolledCourse {
  id: string;
  title: string;
  coverUrl: string | null;
  category: string;
  progressPct: number;
  completedLessons: number;
  totalLessons: number;
}

export interface DashboardResponse {
  user: { xp: number; studyStreak: number; longestStreak: number };
  enrolledCourses: DashboardEnrolledCourse[];
  upcomingBookings: Booking[];
  newBooks: LibraryItemSummary[];
  recommendedCourses: CourseItem[];
  weeklyGoal: { targetLessons: number; doneLessons: number } | null;
}

/* Notificações */

export interface NotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unread: number;
}

/* ------------------------------------------------------------------ */
/* Endpoints (17 rotas)                                                */
/* ------------------------------------------------------------------ */

/* 1) Auth */

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  await setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await setToken(null);
}

/* 2) /auth/me */

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me");
}

/* 3) Biblioteca (lista) */

export interface LibraryQuery {
  kind?: LibraryKind;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export async function listLibrary(query: LibraryQuery = {}): Promise<Paged<LibraryItemSummary>> {
  return request<Paged<LibraryItemSummary>>("/library", { query });
}

/* 4) Biblioteca (detalhe) */

export async function getLibraryItem(id: string): Promise<{ item: LibraryItemDetail }> {
  return request<{ item: LibraryItemDetail }>(`/library/${encodeURIComponent(id)}`);
}

/* 4-b) Leitor de PDF nativo — manifesto de páginas renderizadas no servidor */

export interface ReaderPage {
  /** Número da página (1-based). */
  n: number;
  /** URL absoluta do PNG da página (/api/v1/library/:id/pages/:n). */
  url: string;
}

export interface LibraryReader {
  itemId: string;
  title: string;
  totalPages: number;
  pages: ReaderPage[];
}

export async function getLibraryReader(id: string): Promise<{ reader: LibraryReader }> {
  return request<{ reader: LibraryReader }>(`/library/${encodeURIComponent(id)}/reader`);
}

/* 5) Cursos (lista) */

export interface CoursesQuery {
  q?: string;
  category?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}

export async function listCourses(query: CoursesQuery = {}): Promise<Paged<CourseItem>> {
  return request<Paged<CourseItem>>("/courses", { query });
}

/* 6) Curso (detalhe com temas/aulas/inscrição) */

export async function getCourse(id: string): Promise<CourseDetailResponse> {
  return request<CourseDetailResponse>(`/courses/${encodeURIComponent(id)}`);
}

/* 7) Inscrever-se em curso (402 = curso pago, comprar pela web) */

export async function enrollCourse(id: string): Promise<EnrollResponse> {
  return request<EnrollResponse>(`/courses/${encodeURIComponent(id)}/enroll`, {
    method: "POST",
    body: {},
  });
}

/* 8) Concluir/desmarcar aula (toggle) */

export async function toggleLessonCompletion(courseId: string, lessonId: string): Promise<ToggleLessonResponse> {
  return request<ToggleLessonResponse>(`/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: "PATCH",
    body: { lessonId },
  });
}

/* 9) Mentores (lista) */

export interface MentorsQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listMentors(query: MentorsQuery = {}): Promise<Paged<MentorListItem>> {
  return request<Paged<MentorListItem>>("/mentors", { query });
}

/* 10) Mentor (detalhe + avaliações) */

export async function getMentor(id: string): Promise<MentorDetailResponse> {
  return request<MentorDetailResponse>(`/mentors/${encodeURIComponent(id)}`);
}

/* 11) Horários livres do mentor numa data (YYYY-MM-DD) */

export async function listMentorSlots(mentorId: string, date: string): Promise<SlotsResponse> {
  return request<SlotsResponse>(`/mentors/${encodeURIComponent(mentorId)}/slots`, {
    query: { date },
  });
}

/* 12) Minhas sessões (como aluno) */

export async function listBookings(): Promise<{ items: Booking[] }> {
  return request<{ items: Booking[] }>("/bookings");
}

/* 13) Agendar sessão */

export async function createBooking(input: BookingInput): Promise<BookingCreated> {
  return request<BookingCreated>("/bookings", { method: "POST", body: input });
}

/* 14) Cancelar a própria sessão */

export async function cancelBooking(id: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { action: "cancel" },
  });
}

/* 15) Dashboard do aluno */

export async function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/dashboard");
}

/* 16) Notificações */

export async function listNotifications(): Promise<NotificationsResponse> {
  return request<NotificationsResponse>("/notifications");
}

/* 17) Marcar todas as notificações como lidas */

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>("/notifications", {
    method: "POST",
    body: { action: "read-all" },
  });
}

/* 18) Checkout no app (curso pago via gateway/demonstração) */

export type CheckoutBillingType = "PIX" | "CREDIT_CARD" | "BOLETO";

export interface CheckoutOrderInfo {
  id: string;
  itemKind: string;
  itemTitle: string;
  amount: number;
  paymentMethod: CheckoutBillingType;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
}

export interface CheckoutPaymentInfo {
  id: string;
  gatewayPaymentId: string | null;
  billingType: CheckoutBillingType;
  status: string;
  value: number;
  invoiceUrl: string | null;
  env?: string;
  /** Presente quando billingType = PIX (QR + copia e cola). */
  pix?: { payload: string; encodedImage: string };
}

export interface CheckoutInput {
  courseId: string;
  paymentMethod: CheckoutBillingType;
  /** Obrigatório quando o gateway está ativo (exigido pelo Asaas). */
  cpfCnpj?: string;
  couponCode?: string;
  useCredits?: boolean;
}

export type CheckoutResponse =
  | { order: CheckoutOrderInfo }
  | { pending: true; order: CheckoutOrderInfo; payment: CheckoutPaymentInfo };

export async function checkoutCourse(input: CheckoutInput): Promise<CheckoutResponse> {
  return request<CheckoutResponse>("/checkout", { method: "POST", body: input });
}

/* 19) Status de pagamento (polling do checkout) */

export interface PaymentStatusResponse {
  status: string;
  orderStatus: string;
  billingType: CheckoutBillingType;
  invoiceUrl: string | null;
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  return request<PaymentStatusResponse>("/payments/status", { query: { paymentId } });
}

/* 20) Mensagens — caixa de entrada (threads) */

export interface MessagePeer {
  id: string;
  name: string;
  avatarUrl: string | null;
  isMentor: boolean;
  headline?: string | null;
}

export interface ThreadItem {
  peer: MessagePeer;
  lastBody: string;
  lastAt: string;
  lastMine: boolean;
  unread: number;
}

export interface ThreadsResponse {
  unreadTotal: number;
  threads: ThreadItem[];
}

export async function listThreads(): Promise<ThreadsResponse> {
  return request<ThreadsResponse>("/messages/threads");
}

/* 21) Mensagens — conversa com um par */

export interface ChatMessage {
  id: string;
  body: string;
  mine: boolean;
  read: boolean;
  createdAt: string;
}

export interface ChatResponse {
  peer: MessagePeer;
  items: ChatMessage[];
}

export async function getConversation(peerId: string): Promise<ChatResponse> {
  return request<ChatResponse>(`/messages`, { query: { peerId } });
}

export async function sendMessage(peerId: string, body: string): Promise<ChatMessage> {
  return request<ChatMessage>("/messages", { method: "POST", body: { peerId, body } });
}
