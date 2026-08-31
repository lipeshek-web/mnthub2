'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Fornece o tema (claro/escuro/sistema) via classe no <html>.
 * `suppressHydrationWarning` já está no <html> do layout — exigido pelo
 * next-themes porque o atributo class é injetado antes da hidratação.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
