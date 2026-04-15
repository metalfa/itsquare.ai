/**
 * POST /api/billing/reactivate
 * Reverses a pending cancellation — removes cancel_at_period_end so the
 * subscription renews normally.
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
        { error: 'No subscription found' },
        { status: 400 },
      )
    }

    await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    return NextResponse.json({ reactivated: true })
  } catch (error) {
    console.error('[ITSquare] Reactivate error:', error)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 },
    )
  }
}
