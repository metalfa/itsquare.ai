/**
 * Apple touch icon — 180×180 PNG for iOS home screen.
 * Design: purple gradient square → white chat bubble → "IT" in purple.
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
          background: 'linear-gradient(135deg, #7C3AED 0%, #4F32CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Chat bubble */}
        <div
          style={{
            width: 120,
            height: 82,
            background: 'white',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginBottom: 14,
          }}
        >
          {/* IT text */}
          <span
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: '#6C47FF',
              letterSpacing: '2px',
              fontFamily: 'sans-serif',
            }}
          >
            IT
          </span>
          {/* Bubble tail */}
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              left: 24,
              width: 0,
              height: 0,
              borderLeft: '20px solid transparent',
              borderRight: '0px solid transparent',
              borderTop: '20px solid white',
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  )
}
