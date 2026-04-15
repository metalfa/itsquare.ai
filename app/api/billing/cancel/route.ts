/**
 * POST /api/billing/cancel
 * Cancels the user's Stripe subscription at the end of the current billing period.
 * The user keeps Pro access until the period ends — no immediate downgrade.
 *
 * Handles edge cases:
 * - Already cancel_at_period_end: returns success (idempotent)
 * - Already fully canceled in Stripe: syncs DB to free and returns a clear message
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { data: org } = await admin
      .from('organizations')
      .select('stripe_subscription_id')
      .eq('id', profile.org_id)
      .single()

    if (!org?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 },
      )
    }

    // Fetch current subscription state from Stripe first
    const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    // Already fully canceled — sync DB and return a clean message
    if (sub.status === 'canceled') {
      await admin
        .from('organizations')
        .update({ subscription_tier: 'free', stripe_subscription_id: null })
        .eq('id', profile.org_id)

      return NextResponse.json({
        canceled: true,
        already_canceled: true,
        cancel_at: null,
        current_period_end: null,
      })
    }

    // Already scheduled to cancel at period end — idempotent, just return success
    if (sub.cancel_at_period_end) {
      return NextResponse.json({
        canceled: true,
        cancel_at: sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
    }

    // Active subscription — schedule cancellation at period end
    const updated = await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      canceled: true,
      cancel_at: updated.cancel_at
        ? new Date(updated.cancel_at * 1000).toISOString()
        : null,
      current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('[ITSquare] Cancel error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 },
    )
  }
}
