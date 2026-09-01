'use client'

import { useCallback, useEffect, useSyncExternalStore, useRef } from 'react'
import dynamic from 'next/dynamic'
import { GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/platform/navbar'
import { MobileTabbar } from '@/components/platform/mobile-tabbar'
import { PromoBar } from '@/components/platform/promo-bar'
import { PlatformFooter } from '@/components/platform/footer'
import { MarketplaceView } from '@/components/platform/marketplace'
import { AuthView } from '@/components/platform/auth-view'
import { LandingMenteeView } from '@/components/platform/landing-mentee'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { captureAttributionFromUrl, cleanUrlParams, loadTrackingScripts, trackEvent } from '@/lib/tracking'
import { captureRefCodeFromUrl } from '@/lib/referral'

/** Fallback enxuto enquanto um view pesado é baixado sob demanda */
function ViewLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3" aria-busy="true">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-700/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <GraduationCap className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-stone-400 dark:text-stone-500">carregando…</p>
    </div>
  )
}

/**
 * Views pesadas (vídeo, PDF, WebRTC, formulários, fontes) são code-split:
 * entram no bundle só quando o usuário acessa a tela correspondente.
 */
const MentorProfileView = dynamic(
  () => import('@/components/platform/mentor-profile').then((m) => m.MentorProfileView),
  { ssr: false, loading: ViewLoading }
)
const CourseView = dynamic(
  () => import('@/components/platform/course-view').then((m) => m.CourseView),
  { ssr: false, loading: ViewLoading }
)
const ClassroomView = dynamic(
  () => import('@/components/platform/classroom').then((m) => m.ClassroomView),
  { ssr: false, loading: ViewLoading }
)
const TrackView = dynamic(
  () => import('@/components/platform/track-view').then((m) => m.TrackView),
  { ssr: false, loading: ViewLoading }
)
const ReaderView = dynamic(
  () => import('@/components/platform/reader-view').then((m) => m.ReaderView),
  { ssr: false, loading: ViewLoading }
)
const MeetingRoomView = dynamic(
  () => import('@/components/platform/meeting-room').then((m) => m.MeetingRoomView),
  { ssr: false, loading: ViewLoading }
)
const DashboardView = dynamic(() => import('@/components/platform/dashboard'), {
  ssr: false,
  loading: ViewLoading,
})
const OnboardingView = dynamic(() => import('@/components/platform/onboarding'), {
  ssr: false,
  loading: ViewLoading,
})
const MentorLpView = dynamic(
  () => import('@/components/platform/mentor-lp').then((m) => m.MentorLpView),
  { ssr: false, loading: ViewLoading }
)
const CheckoutView = dynamic(
  () => import('@/components/platform/checkout').then((m) => m.CheckoutView),
  { ssr: false, loading: ViewLoading }
)
const CertificateView = dynamic(
  () => import('@/components/platform/certificate-view').then((m) => m.CertificateView),
  { ssr: false, loading: ViewLoading }
)
const MessagesView = dynamic(
  () => import('@/components/platform/messages-view').then((m) => m.MessagesView),
  { ssr: false, loading: ViewLoading }
)
const ReferralsView = dynamic(
  () => import('@/components/platform/referrals-view').then((m) => m.ReferralsView),
  { ssr: false, loading: ViewLoading }
)
const AdminPanel = dynamic(
  () => import('@/components/platform/admin-panel').then((m) => m.AdminPanel),
  { ssr: false, loading: ViewLoading }
)
const LandingMentor = dynamic(() => import('@/components/platform/landing-mentor'), {
  ssr: false,
  loading: ViewLoading,
})

/** Views que exigem sessão ativa — convidado é levado ao login/cadastro */
const AUTH_REQUIRED: AppViewNames[] = ['dashboard', 'onboarding', 'checkout', 'meeting', 'messages', 'referrals', 'admin']
type AppViewNames = 'dashboard' | 'onboarding' | 'checkout' | 'meeting' | 'messages' | 'referrals' | 'admin'

/** Título da aba por view — renderizado como <title> hoisted no shell */
function docTitleFor(viewName: string): string {
  const titles: Record<string, string> = {
    home: 'MentorHub — Aprenda com quem vive o que ensina',
    'for-mentors': 'MentorHub — Para mentores e criadores',
    marketplace: 'Explorar — MentorHub',
    mentor: 'Perfil do mentor — MentorHub',
    course: 'Curso — MentorHub',
    classroom: 'Sala de aula — MentorHub',
    track: 'Trilha de aprendizado — MentorHub',
    reader: 'Leitor — MentorHub',
    dashboard: 'Minhas mentorias — MentorHub',
    meeting: 'Sala de reunião — MentorHub',
    onboarding: 'Painel do mentor — MentorHub',
    'mentor-lp': 'MentorHub',
    checkout: 'Checkout — MentorHub',
    certificate: 'Certificado — MentorHub',
    messages: 'Mensagens — MentorHub',
    referrals: 'Indique e ganhe — MentorHub',
    admin: 'Administração — MentorHub',
    auth: 'Entrar — MentorHub',
  }
  return titles[viewName] ?? 'MentorHub — Plataforma de Mentorias 1:1'
}

/**
 * #7 Lembretes automáticos: guard de módulo — executa 1x por sessão do navegador
 * para cada userId (não repete em remounts/HMR). Falha sempre silenciosa.
 */
let remindersRunFor: string | null = null

/** Toaster também é carregado sob demanda (sonner entra no bundle só quando usado) */
const LazyToaster = dynamic(
  () => import('@/components/ui/sonner').then((m) => m.Toaster),
  {
    ssr: false,
    loading: () => null,
  }
)

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useAppStore((s) => s.navigate)
  const bootstrapped = useRef(false)
  const mainScrollRef = useRef<HTMLElement | null>(null)

  // Detecta montagem no cliente sem setState em effect (hidratação segura
  // com o estado persistido do zustand: no servidor, false).
  const emptySubscribe = useCallback(() => () => {}, [])
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // Bootstrap de tráfego: captura utm_*/gclid/fbclid, aplica links rastreáveis
  // (?mentor=slug | ?course=id) e carrega os pixels da plataforma (GA4/Meta).
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const sp = new URLSearchParams(window.location.search)
    const mentorSlug = sp.get('mentor')?.trim()
    const courseId = sp.get('course')?.trim()
    const certCode = sp.get('cert')?.trim()
    const resetToken = sp.get('reset')?.trim()

    // 1. Atribuição (last non-direct click, janela de 7 dias)
    captureAttributionFromUrl(mentorSlug)
    captureRefCodeFromUrl()

    // 2. Pixels da plataforma (IDs via env) — pixels dos mentores são
    //    carregados dentro das telas correspondentes (LP, curso, checkout).
    loadTrackingScripts()

    // 3. Roteia por link compartilhável e registra a page_view
    if (mentorSlug) {
      navigate({ name: 'mentor-lp', slug: mentorSlug })
    } else if (courseId) {
      navigate({ name: 'course', courseId })
    } else if (certCode) {
      navigate({ name: 'certificate', code: certCode })
    } else if (resetToken) {
      navigate({ name: 'auth', mode: 'reset', resetToken })
    }
    trackEvent('page_view')

    // 4. Limpa utms da barra de endereço (preserva mentor/course/cert p/ refresh)
    cleanUrlParams()
  }, [])

  // Valida a sessão persistida: se a conta não existir mais, desloga.
  useEffect(() => {
    if (!user) return
    api
      .me(user.id)
      .then(({ user: fresh }) => {
        if (!fresh) setUser(null)
        else if (fresh.name !== user.name || (fresh.isMentor ?? false) !== (user.isMentor ?? false)) {
          setUser({ ...user, ...fresh })
        }
      })
      .catch(() => {})
  }, [])

  // Sessão expirada no servidor (401 de rota protegida): limpa e pede login
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      toast.error('Sua sessão expirou. Entre novamente para continuar.')
      navigate({ name: 'auth', mode: 'login' })
    }
    window.addEventListener('mentorhub:session-expired', onExpired)
    return () => window.removeEventListener('mentorhub:session-expired', onExpired)
  }, [setUser, navigate])

  // #7 Lembretes automáticos: após carga/login bem-sucedido do usuário, dispara
  // api.runReminders 1x por sessão de navegador (guard de módulo). Nunca bloqueia a UI.
  useEffect(() => {
    const uid = user?.id
    if (!uid || remindersRunFor === uid) return
    remindersRunFor = uid
    api.runReminders(uid).catch(() => {})
  }, [user?.id])

  // Volta ao topo ao trocar de view (a rolagem vive no container <main>,
  // isolado do header — o conteúdo nunca passa por baixo dele).
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0 })
  }, [view])

  // Guard central: convidado não acessa views pessoais.
  const needsAuth = mounted && !user && AUTH_REQUIRED.includes(view.name as AppViewNames)

  // Título da aba por view (SEO leve, histórico e abas compartilhadas).
  // Reafirma por ~3s após cada troca: na carga inicial com navegação por URL
  // (?course=/?cert=), a reconciliação de metadados do Next/React 19 reverte
  // o document.title de forma assíncrona logo após o efeito.
  useEffect(() => {
    const want = docTitleFor(view.name)
    const apply = () => {
      if (document.title !== want) document.title = want
    }
    apply()
    const iv = window.setInterval(apply, 500)
    const stop = () => window.clearInterval(iv)
    const t = window.setTimeout(stop, 3000)
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [view])

  // Sala de aula e leitor: overlay tela cheia (imersão) cobrindo header/footer.
  const immersive = view.name === 'classroom' || view.name === 'reader'

  if (!mounted) {
    // Evita mismatch de hidratação com o estado persistido (usuário/logado)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-white dark:bg-stone-950">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <GraduationCap className="h-7 w-7" />
        </span>
        <p className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          Mentor<span className="text-emerald-700 dark:text-emerald-400">Hub</span>
        </p>
        <p aria-hidden className="text-xs text-stone-400 dark:text-stone-500">
          preparando sua experiência...
        </p>
      </div>
    )
  }

  return (
    /* Shell tipo app: header e rodapé fora do fluxo de rolagem. O <main> é o
       ÚNICO container de rolagem — o corpo nunca entra por baixo do header. */
    <div className="flex h-dvh flex-col overflow-hidden bg-white dark:bg-stone-950">
      {!immersive && <PromoBar />}

      {!immersive && <Navbar />}

      <main
        ref={mainScrollRef}
        key={user?.id ?? 'guest'}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {/* Wrapper interno garante o footer colado no fundo em páginas curtas */}
        <div className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {needsAuth ? (
            <AuthView />
          ) : (
            <>
              {view.name === 'home' && <LandingMenteeView />}
              {view.name === 'auth' && (
                <AuthView initialMode={view.mode} resetToken={view.resetToken} />
              )}
              {view.name === 'for-mentors' && <LandingMentor />}
              {view.name === 'marketplace' && <MarketplaceView />}
              {view.name === 'mentor' && <MentorProfileView mentorId={view.mentorId} />}
              {view.name === 'course' && <CourseView courseId={view.courseId} />}
              {view.name === 'track' && <TrackView trackId={view.trackId} />}
              {view.name === 'dashboard' && <DashboardView />}
              {view.name === 'meeting' && <MeetingRoomView bookingId={view.bookingId} />}
              {view.name === 'onboarding' && <OnboardingView />}
              {view.name === 'mentor-lp' && <MentorLpView slug={view.slug} />}
              {view.name === 'checkout' && (
                <CheckoutView
                  courseId={view.courseId}
                  trackId={view.trackId}
                  bundleId={view.bundleId}
                  membershipId={view.membershipId}
                  bookingId={view.bookingId}
                />
              )}
              {view.name === 'certificate' && <CertificateView code={view.code} />}
              {view.name === 'messages' && <MessagesView initialPeerId={view.peerId} />}
              {view.name === 'referrals' && <ReferralsView />}
              {view.name === 'admin' && user?.role === 'ADMIN' && <AdminPanel />}
            </>
          )}

          {/* Footer no fim da página (gruda no fundo quando o conteúdo é curto) */}
          {!immersive && <PlatformFooter />}
        </div>
      </main>

      {/* Imersão: sala de aula e leitor em overlay tela cheia sobre tudo */}
      {view.name === 'classroom' && (
        <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950">
          <ClassroomView courseId={view.courseId} />
        </div>
      )}
      {view.name === 'reader' && (
        <div className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950">
          <ReaderView itemId={view.itemId} />
        </div>
      )}

      {/* Tab bar mobile (<md): navegação inferior estilo app — some em telas
          imersivas (classroom/reader), na LP pública e na autenticação */}
      {!immersive && view.name !== 'mentor-lp' && view.name !== 'auth' && <MobileTabbar />}

      <LazyToaster />
    </div>
  )
}
