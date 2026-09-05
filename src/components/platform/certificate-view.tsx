'use client'

import { useEffect, useState } from 'react'
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Clock,
  Copy,
  Home,
  Link2,
  Linkedin,
  Orbit,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import type { CertificateDTO } from '@/lib/types'
import { avatarGradient } from '@/lib/helpers'

/**
 * Página pública do certificado de conclusão — acessível sem login via
 * /?cert=CODIGO (compartilhável, verificável e imprimível).
 */
export function CertificateView({ code }: { code: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [cert, setCert] = useState<CertificateDTO | null>(null)

  useEffect(() => {
    let alive = true
    api
      .getCertificate(code)
      .then((data) => {
        if (!alive) return
        setCert(data)
        setLoading(false)
      })
      .catch(() => {
        if (alive) {
          setFailed(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [code])

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?cert=${cert?.code ?? code}` : ''

  const copyLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success('Link do certificado copiado!'))
      .catch(() => toast.error('Não foi possível copiar o link.'))
  }

  const linkedInShare = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const issuedLabel = cert
    ? new Date(cert.issuedAt).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''
  // Duração legível: <1h mostra minutos (30 min), ≥1h mostra horas decimais
  const durationLabel = cert
    ? cert.totalMin < 60
      ? `${cert.totalMin} min`
      : `${Math.round((cert.totalMin / 60) * 10) / 10}h`
    : ''

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" aria-busy="true">
        <Skeleton className="mx-auto h-10 w-56 rounded-xl" />
        <Skeleton className="mt-8 h-[420px] w-full rounded-3xl" />
      </div>
    )
  }

  if (failed || !cert) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
          <Link2 className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          Certificado não encontrado
        </h1>
        <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          O código <span className="font-mono font-semibold">{code}</span> não corresponde a nenhum
          certificado emitido. Confira o link e tente novamente.
        </p>
        <Button
          className="mt-2 h-11 rounded-full bg-amber-700 px-6 font-bold hover:bg-amber-800"
          onClick={() => navigate({ name: 'home' })}
        >
          <Home className="h-4 w-4" aria-hidden /> Ir para o início
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Ações de compartilhamento (escondidas na impressão) */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 print:hidden">
        <Button
          variant="outline"
          className="h-10 rounded-full border-stone-200 bg-white font-semibold text-stone-700 hover:border-amber-300 hover:bg-amber-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={copyLink}
        >
          <Copy className="h-4 w-4" aria-hidden /> Copiar link
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-full border-stone-200 bg-white font-semibold text-stone-700 hover:border-amber-300 hover:bg-amber-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={linkedInShare}
        >
          <Linkedin className="h-4 w-4" aria-hidden /> Compartilhar no LinkedIn
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-full border-stone-200 bg-white font-semibold text-stone-700 hover:border-amber-300 hover:bg-amber-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" aria-hidden /> Imprimir / PDF
        </Button>
      </div>

      {/* Certificado */}
      <article
        aria-label={`Certificado de conclusão de ${cert.studentName}`}
        className="relative overflow-hidden rounded-3xl border-2 border-amber-700/25 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-10"
      >
        {/* Faixa superior */}
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" aria-hidden />
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-100/60 blur-2xl print:hidden" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-50 blur-2xl print:hidden" aria-hidden />

        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-700/25">
            <Orbit className="h-7 w-7" aria-hidden />
          </span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
            Órbita · Certificado de Conclusão
          </p>
          <h1 className="mt-6 text-sm font-semibold uppercase tracking-widest text-amber-700">
            Certificamos que
          </h1>
          <p
            className="mt-2 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
            style={avatarGradient(cert.studentName)}
          >
            {cert.studentName}
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-600">
            concluiu com dedicação o curso
          </p>
          <p className="mt-1.5 max-w-xl text-xl font-extrabold leading-snug tracking-tight text-stone-900 sm:text-2xl">
            “{cert.courseTitle}”
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden /> {durationLabel} de conteúdo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-amber-600" aria-hidden /> {cert.category}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-amber-600" aria-hidden /> Concluído em{' '}
              {issuedLabel}
            </span>
          </div>

          {/* Mentor */}
          <div className="mt-8 border-t border-stone-200 pt-6">
            <p className="text-base font-bold text-stone-900">{cert.mentorName}</p>
            <p className="mt-0.5 max-w-xs text-xs leading-relaxed text-stone-500">
              {cert.mentorHeadline}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Mentor responsável
            </p>
          </div>

          {/* Verificação */}
          <div className="mt-7 flex flex-col items-center gap-1.5 rounded-2xl bg-stone-50 px-5 py-3 ring-1 ring-stone-200">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <BadgeCheck className="h-4 w-4" aria-hidden /> Certificado autêntico
            </span>
            <p className="text-[11px] leading-relaxed text-stone-500">
              Verificável em <span className="font-mono font-semibold">/?cert={cert.code}</span>
            </p>
          </div>
        </div>
      </article>

      <p className="mt-6 text-center text-xs leading-relaxed text-stone-400 print:hidden dark:text-stone-500">
        Emitido pela plataforma Órbita · mentorias, cursos e trilhas com certificação
      </p>
    </div>
  )
}
