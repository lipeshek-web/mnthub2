'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeDollarSign,
  CalendarCheck,
  CalendarClock,
  Check,
  Quote,
  ShieldCheck,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { currencyBRL } from '@/lib/helpers'
import { Avatar, Stars } from '@/components/platform/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/* Utilidades locais */

function scrollToCalculator() {
  document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' })
}

function Rise({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({
  id,
  eyebrow,
  title,
  copy,
  align = 'left',
}: {
  id: string
  eyebrow?: string
  title: string
  copy?: string
  align?: 'left' | 'center'
}) {
  return (
    <Rise className={align === 'center' ? 'text-center' : undefined}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
      ) : null}
      <h2
        id={id}
        className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50"
      >
        {title}
      </h2>
      {copy ? (
        <p
          className={
            align === 'center'
              ? 'mx-auto mt-4 max-w-2xl text-base text-stone-600 sm:text-lg dark:text-stone-300'
              : 'mt-4 max-w-2xl text-base text-stone-600 sm:text-lg dark:text-stone-300'
          }
        >
          {copy}
        </p>
      ) : null}
    </Rise>
  )
}

/* Dados estáticos */

const HERO_BULLETS = [
  'Receba solicitações de alunos qualificados',
  'Sua agenda, suas regras — disponibilidade semanal flexível',
  'Reuniões por vídeo integradas, sem sair da plataforma',
]

const STEPS = [
  {
    number: '01',
    title: 'Crie seu perfil',
    text: 'Descreva o que você domina, seus anos de experiência e o valor da sua hora.',
  },
  {
    number: '02',
    title: 'Defina sua disponibilidade',
    text: 'Monte faixas horárias semanais — os alunos só podem agendar nos seus horários livres.',
  },
  {
    number: '03',
    title: 'Conduza e cresça',
    text: 'Aceite solicitações, dê aula por vídeo integrado e receba avaliações que fortalecem seu perfil.',
  },
]

const BENEFITS = [
  {
    icon: BadgeDollarSign,
    title: 'Ganhos recorrentes',
    text: 'Transforme horas livres em uma fonte de renda estável, pelo valor que você definir.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda sob controle',
    text: 'Você monta suas faixas semanais e só recebe solicitações nos horários livres.',
  },
  {
    icon: Users,
    title: 'Alunos qualificados',
    text: 'Chegam até você pessoas com objetivo claro e tema definido, prontas para aprender.',
  },
  {
    icon: Video,
    title: 'Vídeo integrado',
    text: 'As aulas acontecem dentro da plataforma: sem links externos e sem fricção.',
  },
  {
    icon: ShieldCheck,
    title: 'Reputação transparente',
    text: 'Avaliações reais de mentorados constroem a credibilidade do seu perfil público.',
  },
  {
    icon: TrendingUp,
    title: 'Autoridade no seu nicho',
    text: 'Mentorar consolida sua posição como referência e abre portas profissionais.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso pagar algo para usar?',
    answer: 'Não. Criar seu perfil e receber solicitações é gratuito.',
  },
  {
    question: 'Como defino meus preços?',
    answer: 'Você define o valor da sua hora e pode ajustá-lo quando quiser no seu perfil.',
  },
  {
    question: 'Como acontecem as reuniões?',
    answer:
      'Dentro da própria plataforma, com vídeo integrado — mentor e aluno entram com um clique.',
  },
  {
    question: 'E se eu precisar cancelar uma sessão?',
    answer:
      'Você pode recusar solicitações ou cancelar direto no painel de sessões — o aluno é notificado.',
  },
]

/* Página */

export default function LandingMentor() {
  const navigate = useAppStore((s) => s.navigate)

  const [hours, setHours] = useState(10)
  const [rate, setRate] = useState(150)

  const monthly = useMemo(() => Math.round(hours * 4.33 * rate), [hours, rate])
  const yearly = useMemo(() => monthly * 12, [monthly])

  return (
    <div className="bg-white dark:bg-stone-950">
      {/* ============ 1. Hero ============ */}
      <section aria-labelledby="mentor-hero-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="items-center lg:grid lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300">
                Para profissionais e professores
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
                Transforme sua experiência em{' '}
                <span className="text-emerald-700 dark:text-emerald-300">renda e impacto</span>
              </h1>
              <p className="mt-5 text-lg text-stone-600 dark:text-stone-300">
                Crie seu perfil, defina seus horários e receba alunos prontos para aprender com
                você — com reuniões por vídeo acontecendo dentro da própria plataforma.
              </p>
              <ul className="mt-6 space-y-3">
                {HERO_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-stone-700 sm:text-base dark:text-stone-200">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                      <Check size={13} className="text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  className="h-12 rounded-full px-7 font-bold"
                  onClick={() => navigate({ name: 'onboarding' })}
                >
                  Criar meu perfil de mentor
                </Button>
                <Button
                  variant="outline"
                  className="h-12 rounded-full px-7"
                  onClick={scrollToCalculator}
                >
                  Calcular ganhos
                </Button>
              </div>
            </motion.div>

            {/* Mock UI (decorativa) */}
            <motion.div
              className="relative mt-14 hidden sm:block lg:mt-0"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
              aria-hidden="true"
            >
              <div className="mx-auto max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-center gap-3">
                  <Avatar name="Lucas Ferreira" size="md" />
                  <div>
                    <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Lucas Ferreira</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Solicitação · hoje</p>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-stone-900 dark:text-stone-50">
                  Transição para Product Management
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-300">
                    <CalendarClock size={13} aria-hidden="true" /> 10:00
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-950/50 dark:text-stone-300">
                    <Video size={13} aria-hidden="true" /> Na plataforma
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 dark:border-stone-800 dark:text-stone-300"
                  >
                    Recusar
                  </button>
                </div>
              </div>

              <motion.div
                className="absolute -top-5 right-0 rotate-3 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-lg dark:border-stone-800 dark:bg-stone-900"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              >
                <span className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
                  <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  R$ 2.450 este mês
                </span>
              </motion.div>
              <div className="absolute -bottom-5 left-0 -rotate-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-lg dark:border-stone-800 dark:bg-stone-900">
                <span className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
                  <CalendarCheck size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Novo agendamento
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ 2. Calculadora de ganhos ============ */}
      <section id="calculadora" aria-labelledby="calculadora-title" className="scroll-mt-24 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Card className="gap-0 rounded-2xl border-stone-200 p-6 shadow-none sm:p-8 dark:border-stone-800">
            <SectionHeading
              id="calculadora-title"
              eyebrow="Calculadora"
              title="Quanto você pode ganhar?"
              copy="Ajuste suas horas e o valor da sua hora para estimar o retorno mensal mentorando no MentorHub."
            />
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="horas-semana"
                      className="text-sm font-semibold text-stone-900 dark:text-stone-50"
                    >
                      Horas por semana
                    </label>
                    <span id="horas-semana-valor" className="font-bold text-stone-900 dark:text-stone-50">
                      {hours} h
                    </span>
                  </div>
                  <Slider
                    value={[hours]}
                    onValueChange={(v) => setHours(v[0])}
                    min={2}
                    max={40}
                    step={1}
                    className="mt-4"
                    aria-label="Horas por semana"
                  />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="preco-hora" className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                      Seu preço por hora
                    </label>
                    <span id="preco-hora-valor" className="font-bold text-stone-900 dark:text-stone-50">
                      {currencyBRL(rate)}
                    </span>
                  </div>
                  <Slider
                    value={[rate]}
                    onValueChange={(v) => setRate(v[0])}
                    min={50}
                    max={500}
                    step={10}
                    className="mt-4"
                    aria-label="Preço por hora"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-stone-100 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-950/50">
                <p className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">Estimativa mensal</p>
                <p className="mt-2 text-4xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {currencyBRL(monthly)}
                </p>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  {currencyBRL(yearly)} por ano
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
              Estimativa com 4,33 semanas/mês. Você define seus preços e disponibilidade.
            </p>
          </Card>
        </div>
      </section>

      {/* ============ 3. Como funciona ============ */}
      <section aria-labelledby="como-funciona-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            id="como-funciona-title"
            eyebrow="Como funciona"
            title="Três passos até a sua primeira sessão"
          />
          <Rise className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="border-t-2 border-emerald-700 pt-6">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{step.number}</p>
                <h3 className="mt-3 text-lg font-bold text-stone-900 dark:text-stone-50">{step.title}</h3>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{step.text}</p>
              </div>
            ))}
          </Rise>
        </div>
      </section>

      {/* ============ 4. Benefícios ============ */}
      <section aria-labelledby="beneficios-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            id="beneficios-title"
            eyebrow="Por que mentorar aqui"
            title="Feito para quem ensina"
          />
          <Rise className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-2xl border border-stone-200 p-6 dark:border-stone-800">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <benefit.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-stone-900 dark:text-stone-50">{benefit.title}</h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{benefit.text}</p>
              </div>
            ))}
          </Rise>
        </div>
      </section>

      {/* ============ 5. Depoimento ============ */}
      <section aria-labelledby="depoimento-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Rise className="mx-auto max-w-2xl text-center">
            <h2 id="depoimento-title" className="sr-only">
              Depoimento de mentor
            </h2>
            <Quote size={28} className="mx-auto text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            <blockquote className="mt-5 text-xl font-medium tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
              Em três semanas minha agenda estava cheia. A mentoria virou uma renda mensal
              consistente — e ensinar o que eu uso todos os dias é a parte mais gratificante da
              minha semana.
            </blockquote>
            <div className="mt-8 flex flex-col items-center gap-2">
              <Avatar name="Carlos Oliveira" size="xl" />
              <p className="mt-2 font-bold text-stone-900 dark:text-stone-50">Carlos Oliveira</p>
              <Stars rating={5} size={16} />
              <p className="text-xs text-stone-500 dark:text-stone-400">Mentor de Tecnologia · 4 anos de experiência</p>
            </div>
          </Rise>
        </div>
      </section>

      {/* ============ 6. FAQ ============ */}
      <section aria-labelledby="faq-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading id="faq-title" eyebrow="Dúvidas frequentes" title="Perguntas de quem quer começar" align="center" />
          <Rise className="mx-auto mt-10 max-w-3xl">
            <Accordion type="single" collapsible>
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="border-stone-200 dark:border-stone-800"
                >
                  <AccordionTrigger className="text-left font-semibold text-stone-900 dark:text-stone-50">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-stone-600 dark:text-stone-300">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Rise>
        </div>
      </section>

      {/* ============ 7. CTA final ============ */}
      <section aria-labelledby="cta-final-title" className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Rise className="relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-14 text-center text-white sm:py-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <h2
                id="cta-final-title"
                className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              >
                Comece a mentorar esta semana
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100/90 sm:text-lg">
                Crie seu perfil em minutos, defina sua disponibilidade e receba as primeiras
                solicitações de alunos.
              </p>
              <Button
                className="mt-8 h-12 rounded-full bg-white px-8 font-bold text-emerald-950 hover:bg-emerald-50"
                onClick={() => navigate({ name: 'onboarding' })}
              >
                Criar meu perfil de mentor
              </Button>
            </div>
          </Rise>
        </div>
      </section>
    </div>
  )
}
