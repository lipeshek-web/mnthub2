'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { GraduationCap } from 'lucide-react'
import { Navbar } from '@/components/platform/navbar'
import { PlatformFooter } from '@/components/platform/footer'
import { MarketplaceView } from '@/components/platform/marketplace'
import { MentorProfileView } from '@/components/platform/mentor-profile'
import { CourseView } from '@/components/platform/course-view'
import { MeetingRoomView } from '@/components/platform/meeting-room'
import DashboardView from '@/components/platform/dashboard'
import OnboardingView from '@/components/platform/onboarding'
import { LandingMenteeView } from '@/components/platform/landing-mentee'
import LandingMentor from '@/components/platform/landing-mentor'
import { Toaster } from '@/components/ui/sonner'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const mainRef = useRef<HTMLElement>(null)

  // Detecta montagem no cliente sem setState em effect (hidratação segura
  // com o estado persistido do zustand: no servidor, false).
  const emptySubscribe = useCallback(() => () => {}, [])
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

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
        {view.name === 'dashboard' && <DashboardView />}
        {view.name === 'meeting' && <MeetingRoomView bookingId={view.bookingId} />}
        {view.name === 'onboarding' && <OnboardingView />}
      </main>

      <PlatformFooter />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
