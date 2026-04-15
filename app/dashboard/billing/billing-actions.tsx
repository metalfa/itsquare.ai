'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Zap,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'

interface BillingActionsProps {
  isPro: boolean
  usage: number
  limit: number
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

export function BillingActions({
  isPro: initialIsPro,
  usage,
  limit,
  cancelAtPeriodEnd: initialCancelPending,
  currentPeriodEnd: initialPeriodEnd,
}: BillingActionsProps) {
  const [loading, setLoading] = useState<
    'checkout' | 'portal' | 'sync' | 'cancel' | 'reactivate' | null
  >(null)
  const [isPro, setIsPro] = useState(initialIsPro)
  const [cancelPending, setCancelPending] = useState(initialCancelPending)
  const [periodEnd, setPeriodEnd] = useState(initialPeriodEnd)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
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
        window.open(data.url, '_blank', 'noopener,noreferrer')
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

  async function handleCancel() {
    setLoading('cancel')
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data: {
        canceled?: boolean
        current_period_end?: string
        error?: string
      } = await res.json()

      if (data.canceled) {
        setCancelPending(true)
        setPeriodEnd(data.current_period_end ?? null)
        setShowCancelConfirm(false)
      } else {
        alert(data.error ?? 'Failed to cancel. Please try again.')
      }
    } catch (err) {
      console.error('[Billing] Cancel error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handleReactivate() {
    setLoading('reactivate')
    try {
      const res = await fetch('/api/billing/reactivate', { method: 'POST' })
      const data: { reactivated?: boolean; error?: string } = await res.json()

      if (data.reactivated) {
        setCancelPending(false)
        setShowCancelConfirm(false)
      } else {
        alert(data.error ?? 'Failed to reactivate. Please try again.')
      }
    } catch (err) {
      console.error('[Billing] Reactivate error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
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
      <div className="space-y-4">
        {/* Status badge */}
        {cancelPending ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cancellation scheduled
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your Pro access continues until{' '}
                  <span className="font-medium text-foreground">
                    {periodEnd ? formatDate(periodEnd) : 'the end of your billing period'}
                  </span>
                  . After that, you&apos;ll switch to the Free plan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" />
            Pro plan active
            {periodEnd && (
              <span className="text-muted-foreground">
                · Renews {formatDate(periodEnd)}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {cancelPending ? (
            // Pending cancellation — show reactivate button prominently
            <Button
              onClick={handleReactivate}
              disabled={loading === 'reactivate'}
              className="bg-primary hover:bg-primary/90"
            >
              {loading === 'reactivate' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Keep My Subscription
            </Button>
          ) : (
            // Active subscription — show cancel and manage buttons
            <>
              {!showCancelConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              ) : (
                // Inline confirmation — no modal, no friction maze
                <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm text-foreground">
                    Are you sure? You&apos;ll keep Pro access until the end of your
                    current billing period
                    {periodEnd && (
                      <>
                        {' '}
                        (<span className="font-medium">{formatDate(periodEnd)}</span>)
                      </>
                    )}
                    . You can resubscribe anytime.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      disabled={loading === 'cancel'}
                    >
                      {loading === 'cancel' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Yes, Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Never Mind
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            variant="outline"
            onClick={handleManage}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Billing Details
          </Button>
        </div>
      </div>
    )
  }

  // Free tier
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
