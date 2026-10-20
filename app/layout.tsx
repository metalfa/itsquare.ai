import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ITSquare | Managed IT for Chicago small businesses",
  description: "Practical managed IT support for Chicago small businesses, with clear ownership, secure access, and steady maintenance.",
  applicationName: "ITSquare",
  generator: "Next.js",
  keywords: ["managed IT", "cybersecurity", "Microsoft 365", "Chicago MSP"],
  icons: {
    icon: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/facebook-profile-picture-720-iBgH7aH0uxAuY29fjVX2eyZjG5oS45.png",
    shortcut: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/facebook-profile-picture-720-iBgH7aH0uxAuY29fjVX2eyZjG5oS45.png",
  },
  openGraph: {
    title: "ITSquare | Managed IT for Chicago small businesses",
    description: "Clear ownership, secure access, and steady maintenance for growing teams.",
    type: "website",
    siteName: "ITSquare",
  },
  twitter: {
    card: "summary",
    title: "ITSquare | Managed IT for Chicago small businesses",
    description: "Clear ownership, secure access, and steady maintenance for growing teams.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#071018",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background">
    <body>{children}</body>
  </html>
}
