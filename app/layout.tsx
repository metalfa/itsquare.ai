import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ITSquare | Managed IT for Chicago small businesses",
  description: "Practical managed IT support, Microsoft 365 organization, and security improvements for Chicago small businesses.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
