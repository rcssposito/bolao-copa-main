import type { Metadata } from 'next'
import '@carbon/react/index.scss'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bolão Copa 2026',
  description: 'Sistema de bolão da Copa do Mundo 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="cds--g100">{children}</body>
    </html>
  )
}

// Made with Bob
