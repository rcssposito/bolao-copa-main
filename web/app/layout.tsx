import type { Metadata } from 'next'
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
      <body className="bg-[#0c0c0c] text-gray-100 font-sans antialiased">{children}</body>
    </html>
  )
}

// Made with Bob
