import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ITSquare | Managed IT for Chicago small businesses",
  description: "Practical managed IT support for Chicago small businesses, with clear ownership, secure access, and steady maintenance.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background">
    <body>{children}</body>
  </html>
}
