'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { GraduationCap } from 'lucide-react'
import { Navbar } from '@/components/platform/navbar'
import { PlatformFooter } from '@/components/platform/footer'
import { MarketplaceView } from '@/components/platform/marketplace'
import { MentorProfileView } from '@/components/platform/mentor-profile'
import { CourseView } from '@/components/platform/course-view'
import { ClassroomView } from '@/components/platform/classroom'
import { TrackView } from '@/components/platform/track-view'
import { MeetingRoomView } from '@/components/platform/meeting-room'
import DashboardView from '@/components/platform/dashboard'
import OnboardingView from '@/components/platform/onboarding'
import { LandingMenteeView } from '@/components/platform/landing-mentee'
import LandingMentor from '@/components/platform/landing-mentor'
import { MentorLpView } from '@/components/platform/mentor-lp'
import { CheckoutView } from '@/components/platform/checkout'
import { Toaster } from '@/components/ui/sonner'
import { useAppStore } from '@/lib/store'
import { captureAttributionFromUrl, cleanUrlParams, loadTrackingScripts, trackEvent } from '@/lib/tracking'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const mainRef = useRef<HTMLElement>(null)
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

  // Shell estilo app nativo: header e footer fixos, só o corpo rola.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [view])

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
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <Navbar />

      <main
        ref={mainRef}
        key={user?.id ?? 'guest'}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {view.name === 'home' && <LandingMenteeView />}
        {view.name === 'for-mentors' && <LandingMentor />}
        {view.name === 'marketplace' && <MarketplaceView />}
        {view.name === 'mentor' && <MentorProfileView mentorId={view.mentorId} />}
        {view.name === 'course' && <CourseView courseId={view.courseId} />}
        {view.name === 'classroom' && <ClassroomView courseId={view.courseId} />}
        {view.name === 'track' && <TrackView trackId={view.trackId} />}
        {view.name === 'dashboard' && <DashboardView />}
        {view.name === 'meeting' && <MeetingRoomView bookingId={view.bookingId} />}
        {view.name === 'onboarding' && <OnboardingView />}
        {view.name === 'mentor-lp' && <MentorLpView slug={view.slug} />}
        {view.name === 'checkout' && (
          <CheckoutView courseId={view.courseId} trackId={view.trackId} />
        )}
      </main>

      {/* Sala de aula: tela cheia, só o header da plataforma permanece */}
      {view.name !== 'classroom' && <PlatformFooter />}
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
