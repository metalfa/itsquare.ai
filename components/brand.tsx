import Link from "next/link"

export function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="brand-link" aria-label="ITSquare.ai home">
      <svg aria-hidden="true" className="brand-mark" viewBox="0 0 40 40" fill="none">
        <rect x="5.5" y="5.5" width="22" height="22" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="12.5" y="12.5" width="22" height="22" rx="3.5" fill="var(--background)" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <span className="brand-wordmark"><strong>ITSquare</strong><small>.ai</small></span>
    </Link>
  )
}
