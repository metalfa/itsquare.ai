'use client'

/**
 * One-Click Device Diagnostic Page
 *
 * URL: /check/<token>
 *
 * When a user clicks this link from Slack:
 * 1. Page loads instantly
 * 2. Browser JS collects enhanced device info (OS, RAM, connection, battery, etc.)
 *    plus runs real speed test, CPU benchmark, GPU detection, multi-target latency
 * 3. Results auto-submit to the API
 * 4. User sees "Done! Check Slack for results."
 *
 * Zero install. Zero terminal. ~10 seconds total.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface DiagData {
  // --- Existing (keep) ---
  platform: string
  userAgent: string
  language: string
  hardwareConcurrency: number
  deviceMemory: number | null

  // Connection
  connectionType: string | null
  downlink: number | null
  rtt: number | null

  // Screen
  screenWidth: number
  screenHeight: number
  pixelRatio: number

  // Battery
  batteryLevel: number | null
  batteryCharging: boolean | null

  // Storage estimate
  storageUsedMB: number | null
  storageTotalMB: number | null

  // --- NEW: Real speed test ---
  speedTestDownloadMbps: number | null
  speedTestLatencyMs: number | null

  // --- NEW: CPU benchmark ---
  cpuBenchmarkMs: number | null
  cpuScore: number | null

  // --- NEW: Memory pressure ---
  jsHeapUsedMB: number | null
  jsHeapTotalMB: number | null
  jsHeapLimitMB: number | null

  // --- NEW: Multi-target latency ---
  latencyGoogle: number | null
  latencyCloudflare: number | null
  latencySlack: number | null

  // --- NEW: Performance metrics ---
  pageLoadMs: number | null
  domContentLoadedMs: number | null
  firstPaintMs: number | null

  // --- NEW: Tab/window count estimate ---
  tabPressureScore: number | null

  // --- NEW: GPU info ---
  gpuVendor: string | null
  gpuRenderer: string | null

  // Timestamp
  collectedAt: string
}

// ---------------------------------------------------------------------------
// Data collection helpers
// ---------------------------------------------------------------------------

async function runSpeedTest(): Promise<{ downloadMbps: number; latencyMs: number }> {
  // Latency: time a small fetch to our own API
  const latencyStart = performance.now()
  await fetch('/api/agent/web-diagnostic?ping=1', { method: 'HEAD', cache: 'no-store' })
  const latencyMs = Math.round(performance.now() - latencyStart)

  // Download: fetch a known-size payload, measure time
  const dlStart = performance.now()
  const resp = await fetch('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js', {
    cache: 'no-store',
  })
  const blob = await resp.blob()
  const dlTime = (performance.now() - dlStart) / 1000 // seconds
  const dlSizeMbits = (blob.size * 8) / (1024 * 1024) // megabits
  const downloadMbps = Math.round((dlSizeMbits / dlTime) * 10) / 10

  return { downloadMbps, latencyMs }
}

function runCPUBenchmark(): { benchmarkMs: number; score: number } {
  const start = performance.now()
  // Compute-heavy task: calculate primes up to 100000
  let count = 0
  for (let i = 2; i < 100000; i++) {
    let isPrime = true
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false
        break
      }
    }
    if (isPrime) count++
  }
  const ms = Math.round(performance.now() - start)
  // Score: 100 = fast (<100ms), 0 = very slow (>2000ms)
  const score = Math.max(0, Math.min(100, Math.round(100 - (ms - 100) / 19)))
  return { benchmarkMs: ms, score }
}

async function measureLatency(url: string): Promise<number | null> {
  try {
    const start = performance.now()
    await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
    return Math.round(performance.now() - start)
  } catch {
    return null
  }
}

function getGPUInfo(): { vendor: string | null; renderer: string | null } {
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return { vendor: null, renderer: null }
    const ext = (gl as any).getExtension('WEBGL_debug_renderer_info')
    if (!ext) return { vendor: null, renderer: null }
    return {
      vendor: (gl as any).getParameter(ext.UNMASKED_VENDOR_WEBGL) || null,
      renderer: (gl as any).getParameter(ext.UNMASKED_RENDERER_WEBGL) || null,
    }
  } catch {
    return { vendor: null, renderer: null }
  }
}

function getJSHeap(): { used: number | null; total: number | null; limit: number | null } {
  const mem = (performance as any).memory
  if (!mem) return { used: null, total: null, limit: null }
  return {
    used: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
    total: Math.round(mem.totalJSHeapSize / (1024 * 1024)),
    limit: Math.round(mem.jsHeapSizeLimit / (1024 * 1024)),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiagnosticPage() {
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<'collecting' | 'sending' | 'done' | 'error'>('collecting')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentStep, setCurrentStep] = useState('Starting...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    collectAndSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function collectAndSubmit() {
    try {
      setStatus('collecting')
      const data = await collectDeviceData()

      setStatus('sending')
      setCurrentStep('Sending results...')
      setProgress(95)

      const res = await fetch('/api/agent/web-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Server error: ${body}`)
      }

      setProgress(100)
      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong')
    }
  }

  async function collectDeviceData(): Promise<DiagData> {
    const nav = navigator as any

    // --- Step 1: Basic device info ---
    setCurrentStep('Checking device info...')
    setProgress(10)

    const conn = nav.connection || nav.mozConnection || nav.webkitConnection

    // Battery
    let batteryLevel: number | null = null
    let batteryCharging: boolean | null = null
    try {
      if (nav.getBattery) {
        const battery = await nav.getBattery()
        batteryLevel = Math.round(battery.level * 100)
        batteryCharging = battery.charging
      }
    } catch { /* not available */ }

    // Storage
    let storageUsedMB: number | null = null
    let storageTotalMB: number | null = null
    try {
      if (nav.storage?.estimate) {
        const estimate = await nav.storage.estimate()
        storageUsedMB = estimate.usage ? Math.round(estimate.usage / (1024 * 1024)) : null
        storageTotalMB = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : null
      }
    } catch { /* not available */ }

    // Page performance
    let pageLoadMs: number | null = null
    let domContentLoadedMs: number | null = null
    let firstPaintMs: number | null = null
    try {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (perf) {
        pageLoadMs = perf.loadEventEnd > 0 ? Math.round(perf.loadEventEnd - perf.fetchStart) : null
        domContentLoadedMs =
          perf.domContentLoadedEventEnd > 0
            ? Math.round(perf.domContentLoadedEventEnd - perf.fetchStart)
            : null
      }
      const paintEntries = performance.getEntriesByType('paint')
      const fp = paintEntries.find((e) => e.name === 'first-paint')
      if (fp) firstPaintMs = Math.round(fp.startTime)
    } catch { /* not available */ }

    // JS heap
    const heap = getJSHeap()

    // GPU
    const gpu = getGPUInfo()

    // Tab pressure (measureUserAgentSpecificMemory — requires cross-origin isolation)
    let tabPressureScore: number | null = null
    try {
      if ((performance as any).measureUserAgentSpecificMemory) {
        const memResult = await (performance as any).measureUserAgentSpecificMemory()
        // Rough score: bytes of memory used by all frames
        tabPressureScore = Math.round(memResult.bytes / (1024 * 1024))
      }
    } catch { /* not available or not cross-origin isolated */ }

    setProgress(25)

    // --- Step 2: Speed test ---
    setCurrentStep('Running speed test...')
    setProgress(30)

    let speedTestDownloadMbps: number | null = null
    let speedTestLatencyMs: number | null = null
    try {
      const result = await runSpeedTest()
      speedTestDownloadMbps = result.downloadMbps
      speedTestLatencyMs = result.latencyMs
    } catch { /* speed test failed */ }

    setProgress(48)

    // --- Step 3: CPU benchmark ---
    setCurrentStep('Benchmarking CPU...')
    setProgress(50)

    let cpuBenchmarkMs: number | null = null
    let cpuScore: number | null = null
    try {
      const bench = runCPUBenchmark()
      cpuBenchmarkMs = bench.benchmarkMs
      cpuScore = bench.score
    } catch { /* benchmark failed */ }

    setProgress(68)

    // --- Step 4: Multi-target latency ---
    setCurrentStep('Testing network latency...')
    setProgress(70)

    const [latencyGoogle, latencyCloudflare, latencySlack] = await Promise.all([
      measureLatency('https://www.google.com'),
      measureLatency('https://1.1.1.1'),
      measureLatency('https://slack.com'),
    ])

    setProgress(88)

    // --- Step 5: Finalize ---
    setCurrentStep('Finalizing...')
    setProgress(90)

    return {
      platform: nav.platform || 'unknown',
      userAgent: nav.userAgent || '',
      language: nav.language || '',
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory || null,
      connectionType: conn?.effectiveType || null,
      downlink: conn?.downlink || null,
      rtt: conn?.rtt || null,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      batteryLevel,
      batteryCharging,
      storageUsedMB,
      storageTotalMB,
      speedTestDownloadMbps,
      speedTestLatencyMs,
      cpuBenchmarkMs,
      cpuScore,
      jsHeapUsedMB: heap.used,
      jsHeapTotalMB: heap.total,
      jsHeapLimitMB: heap.limit,
      latencyGoogle,
      latencyCloudflare,
      latencySlack,
      pageLoadMs,
      domContentLoadedMs,
      firstPaintMs,
      tabPressureScore,
      gpuVendor: gpu.vendor,
      gpuRenderer: gpu.renderer,
      collectedAt: new Date().toISOString(),
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-4xl">
          {status === 'collecting' && '🔍'}
          {status === 'sending' && '📤'}
          {status === 'done' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <h1 className="text-2xl font-bold">
          {status === 'collecting' && 'Scanning your device...'}
          {status === 'sending' && 'Sending results...'}
          {status === 'done' && 'All done!'}
          {status === 'error' && 'Something went wrong'}
        </h1>

        {(status === 'collecting' || status === 'sending') && (
          <div className="space-y-3">
            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Step label */}
            <p className="text-sm text-gray-400">{currentStep}</p>
          </div>
        )}

        <p className="text-gray-400">
          {status === 'collecting' && 'Running diagnostics — no software is being installed.'}
          {status === 'sending' && 'Uploading diagnostic data to ITSquare...'}
          {status === 'done' &&
            "Check your Slack conversation — I'll have the results there in a few seconds."}
          {status === 'error' && errorMsg}
        </p>

        {status === 'done' && (
          <p className="text-sm text-gray-500 mt-8">You can close this page now.</p>
        )}

        {status === 'error' && (
          <button
            onClick={() => collectAndSubmit()}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
          >
            Try Again
          </button>
        )}

        <p className="text-xs text-gray-600 mt-12">
          ITSquare.AI only collects basic device info (OS, RAM, connection type, browser
          performance). No personal files, browsing history, or passwords are accessed.
        </p>
      </div>
    </div>
  )
}
