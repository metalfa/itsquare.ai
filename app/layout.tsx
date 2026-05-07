import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ITSquare.AI | Your AI IT Support Team in Slack',
  description:
    'The smartest IT support agent lives in your Slack. Employees describe problems, AI solves them instantly. No tickets, no waiting, no frustration.',
  generator: 'v0.app',
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
        {/* Google Analytics */}
        
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-473WZXNEQK"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-473WZXNEQK');
          `}
        </Script>

        <link
          rel="preconnect"
          href="https://static.cloudflareinsights.com"
        />
        
        <link
          rel="dns-prefetch"
          href="https://static.cloudflareinsights.com"
        />
      </head>

      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
