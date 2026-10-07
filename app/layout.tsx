import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ITSquare | Your unfair tech advantage",
  description: "Managed IT, cybersecurity, and cloud expertise for ambitious businesses.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
