/**
 * App favicon — generated via Next.js ImageResponse (no static file needed).
 * Produces a 32×32 PNG served at /icon.png.
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons
 */

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #6C47FF 0%, #4F32CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Lightning bolt */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 3L4 14H12L11 21L20 10H12L13 3Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
