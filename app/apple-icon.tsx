/**
 * Apple touch icon — 180×180 PNG served at /apple-icon.png.
 */

import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #6C47FF 0%, #4F32CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Lightning bolt */}
        <svg width="110" height="110" viewBox="0 0 24 24" fill="none">
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
