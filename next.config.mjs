/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Re-enable once all type errors are resolved
    // ignoreBuildErrors: false,
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Clean module cache on dev server restart
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Security headers for Lighthouse Best Practices
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://cdn.jsdelivr.net https://slack.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://slack.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
