'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Zap, ExternalLink, Loader2, CheckCircle } from 'lucide-react'

interface BillingActionsProps {
  isPro: boolean
  usage: number
  limit: number
}

export function BillingActions({ isPro: initialIsPro, usage, limit }: BillingActionsProps) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | 'sync' | null>(null)
  const [isPro, setIsPro] = useState(initialIsPro)
  const [syncDone, setSyncDone] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // When returning from Stripe with ?success=1, sync directly from Stripe
  useEffect(() => {
    if (searchParams.get('success') === '1' && !initialIsPro && !syncDone) {
      setSyncDone(true)
      setLoading('sync')
      fetch('/api/billing/sync', { method: 'POST' })
        .then((r) => r.json())
        .then((data: { synced?: boolean; plan?: string }) => {
          if (data.synced && data.plan === 'pro') {
            setIsPro(true)
            // Clean the URL and refresh server data
            router.replace('/dashboard/billing')
            router.refresh()
          }
        })
        .catch((err) => console.error('[Billing] Sync error:', err))
        .finally(() => setLoading(null))
    }
  }, [searchParams, initialIsPro, syncDone, router])

  async function handleUpgrade() {
    setLoading('checkout')
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data: { url?: string; error?: string } = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('[Billing] Checkout error:', data.error)
        alert('Failed to start checkout. Please try again.')
      }
    } catch (err) {
      console.error('[Billing] Checkout fetch error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data: { url?: string; error?: string } = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('[Billing] Portal error:', data.error)
        alert('Failed to open billing portal. Please try again.')
      }
    } catch (err) {
      console.error('[Billing] Portal fetch error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  // Syncing state — shown right after returning from Stripe
  if (loading === 'sync') {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Activating your Pro subscription...
      </div>
    )
  }

  if (isPro) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
          <CheckCircle className="h-4 w-4" />
          Pro plan active
        </div>
        <Button
          variant="outline"
          onClick={handleManage}
          disabled={loading === 'portal'}
          className="w-full sm:w-auto"
        >
          {loading === 'portal' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Manage Subscription
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        <span className="font-medium text-foreground">{usage}</span>
        {' / '}
        <span>{limit}</span>
        {' messages used this month'}
      </div>

      <Button
        onClick={handleUpgrade}
        disabled={loading === 'checkout'}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {loading === 'checkout' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Zap className="h-4 w-4 mr-2" />
        )}
        Upgrade to Pro
      </Button>
    </div>
  )
}
