import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ITSquare.AI | Govern, Detect, Resolve — AI IT Support',
  description: 'Autonomous AI IT support with built-in governance. Proactive device health scoring, audit trails, and instant problem resolution in Slack & Teams. Plus AI governance services for mid-size companies.',
  // icons are auto-discovered from app/icon.tsx and app/apple-icon.tsx
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://static.cloudflareinsights.com" />
        <link rel="dns-prefetch" href="https://static.cloudflareinsights.com" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
