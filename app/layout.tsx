import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Inter } from 'next/font/google'

import './globals.css'

const _notoSansJP = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto-sans-jp' })
const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'HQA 一次振り分け支援 AI',
  description: 'Hino Motors Quality Assurance AI Triage Dashboard',
}

export const viewport: Viewport = {
  themeColor: '#b91c1c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${_notoSansJP.variable} ${_inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
