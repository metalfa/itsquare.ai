/**
 * App favicon — 32×32 PNG, auto-discovered by Next.js App Router.
 * Design: dark purple square → white chat bubble → "IT" in purple.
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
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F32CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Chat bubble */}
        <div
          style={{
            width: 22,
            height: 15,
            background: 'white',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 3,
          }}
        >
          {/* IT text */}
          <span
            style={{
              fontSize: 7,
              fontWeight: 800,
              color: '#6C47FF',
              letterSpacing: '0.5px',
              fontFamily: 'sans-serif',
            }}
          >
            IT
          </span>
          {/* Bubble tail */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 5,
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '0px solid transparent',
              borderTop: '4px solid white',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
