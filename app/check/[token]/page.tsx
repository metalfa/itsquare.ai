'use client'

/**
 * One-Click Device Diagnostic Page
 *
 * URL: /check/<token>
 *
 * When a user clicks this link from Slack:
 * 1. Page loads instantly
 * 2. Browser JS collects device info (OS, RAM, connection, battery, etc.)
 * 3. Results auto-submit to the API
 * 4. User sees "Done! Check Slack for results."
 *
 * Zero install. Zero terminal. 5 seconds total.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface DiagData {
  // Navigator info
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
  
  // Performance
  pageLoadMs: number | null
  
  // Timestamp
  collectedAt: string
}

export default function DiagnosticPage() {
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<'collecting' | 'sending' | 'done' | 'error'>('collecting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    collectAndSubmit()
  }, [])

  async function collectAndSubmit() {
    try {
      setStatus('collecting')
      const data = await collectDeviceData()
      
      setStatus('sending')
      const res = await fetch('/api/agent/web-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Server error: ${body}`)
      }

      setStatus('done')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong')
    }
  }

  async function collectDeviceData(): Promise<DiagData> {
    const nav = navigator as any

    // Connection info
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
    try {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (perf) {
        pageLoadMs = Math.round(perf.loadEventEnd - perf.fetchStart)
      }
    } catch { /* not available */ }

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
      pageLoadMs,
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

        <p className="text-gray-400">
          {status === 'collecting' && 'This takes just a moment. No software is being installed.'}
          {status === 'sending' && 'Uploading diagnostic data to ITSquare...'}
          {status === 'done' && 'Check your Slack conversation — I\'ll have the results there in a few seconds.'}
          {status === 'error' && errorMsg}
        </p>

        {status === 'done' && (
          <p className="text-sm text-gray-500 mt-8">
            You can close this page now.
          </p>
        )}

        {status === 'error' && (
          <button
            onClick={() => collectAndSubmit()}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
          >
            Try Again
          </button>
        )}

        {(status === 'collecting' || status === 'sending') && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-xs text-gray-600 mt-12">
          ITSquare.AI only collects basic device info (OS, RAM, connection type).
          No personal files, browsing history, or passwords are accessed.
        </p>
      </div>
    </div>
  )
}
