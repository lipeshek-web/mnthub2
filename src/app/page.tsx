'use client'

import { useCallback, useEffect, useSyncExternalStore, useRef } from 'react'
import dynamic from 'next/dynamic'
import { GraduationCap } from 'lucide-react'
import { Navbar } from '@/components/platform/navbar'
import { PlatformFooter } from '@/components/platform/footer'
import { MarketplaceView } from '@/components/platform/marketplace'
import { AuthView } from '@/components/platform/auth-view'
import { LandingMenteeView } from '@/components/platform/landing-mentee'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { captureAttributionFromUrl, cleanUrlParams, loadTrackingScripts, trackEvent } from '@/lib/tracking'

/** Fallback enxuto enquanto um view pesado é baixado sob demanda */
function ViewLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3" aria-busy="true">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-emerald-700/10 text-emerald-700">
        <GraduationCap className="h-6 w-6" />
      </span>
      <p className="text-sm font-medium text-stone-400">carregando…</p>
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
const LandingMentor = dynamic(() => import('@/components/platform/landing-mentor'), {
  ssr: false,
  loading: ViewLoading,
})

/** Views que exigem sessão ativa — convidado é levado ao login/cadastro */
const AUTH_REQUIRED: AppViewNames[] = ['dashboard', 'onboarding', 'checkout', 'meeting']
type AppViewNames = 'dashboard' | 'onboarding' | 'checkout' | 'meeting'

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

    // 1. Atribuição (last non-direct click, janela de 7 dias)
    captureAttributionFromUrl(mentorSlug)

    // 2. Pixels da plataforma (IDs via env) — pixels dos mentores são
    //    carregados dentro das telas correspondentes (LP, curso, checkout).
    loadTrackingScripts()

    // 3. Roteia por link compartilhável e registra a page_view
    if (mentorSlug) {
      navigate({ name: 'mentor-lp', slug: mentorSlug })
    } else if (courseId) {
      navigate({ name: 'course', courseId })
    }
    trackEvent('page_view')

    // 4. Limpa utms da barra de endereço (preserva mentor/course p/ refresh)
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

  // Volta ao topo do documento ao trocar de view (rolagem normal da página).
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  // Guard central: convidado não acessa views pessoais.
  const needsAuth = mounted && !user && AUTH_REQUIRED.includes(view.name as AppViewNames)

  // Sala de aula e leitor: overlay tela cheia (imersão) cobrindo header/footer.
  const immersive = view.name === 'classroom' || view.name === 'reader'

  if (!mounted) {
    // Evita mismatch de hidratação com o estado persistido (usuário/logado)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-white">
        <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <GraduationCap className="h-7 w-7" />
        </span>
        <p className="text-base font-extrabold tracking-tight text-stone-900">
          Mentor<span className="text-emerald-700">Hub</span>
        </p>
        <p aria-hidden className="text-xs text-stone-400">
          preparando sua experiência...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {!immersive && <Navbar />}

      <main key={user?.id ?? 'guest'} className="flex-1">
        {needsAuth ? (
          <AuthView />
        ) : (
          <>
            {view.name === 'home' && <LandingMenteeView />}
            {view.name === 'auth' && <AuthView initialMode={view.mode} />}
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
              <CheckoutView courseId={view.courseId} trackId={view.trackId} />
            )}
          </>
        )}
      </main>

      {/* Footer no fim da página (gruda no fundo quando o conteúdo é curto) */}
      {!immersive && <PlatformFooter />}

      {/* Imersão: sala de aula e leitor em overlay tela cheia sobre tudo */}
      {view.name === 'classroom' && (
        <div className="fixed inset-0 z-50 bg-stone-50">
          <ClassroomView courseId={view.courseId} />
        </div>
      )}
      {view.name === 'reader' && (
        <div className="fixed inset-0 z-50 bg-stone-50">
          <ReaderView itemId={view.itemId} />
        </div>
      )}

      <LazyToaster />
    </div>
  )
}
