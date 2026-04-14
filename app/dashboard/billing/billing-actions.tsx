'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, ExternalLink, Loader2 } from 'lucide-react'

interface BillingActionsProps {
  isPro: boolean
  usage: number
  limit: number
}

export function BillingActions({ isPro, usage, limit }: BillingActionsProps) {
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null)

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

  if (isPro) {
    return (
      <div className="space-y-3">
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
      {/* Usage indicator */}
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
