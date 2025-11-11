import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Club Nightlife - Modern Nightclub Management Platform',
  description: 'Transform your nightclub operations with QR check-ins, loyalty programs, and real-time analytics. Join 500+ clubs worldwide.',
  keywords: 'nightclub management, club software, QR check-in, loyalty program, nightlife platform',
  openGraph: {
    title: 'Club Nightlife - Modern Nightclub Management Platform',
    description: 'Transform your nightclub operations with QR check-ins, loyalty programs, and real-time analytics.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
