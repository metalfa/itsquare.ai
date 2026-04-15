/**
 * GET /api/billing/status
 * Returns the current subscription status for the authenticated user's org.
 * Used by the dashboard to show cancellation banners etc.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

export async function GET() {
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
      return NextResponse.json({ tier: 'free', isPro: false })
    }

    const { data: org } = await admin
      .from('organizations')
      .select('subscription_tier, stripe_subscription_id')
      .eq('id', profile.org_id)
      .single()

    const isPro = org?.subscription_tier === 'pro'

    // Return pro status based on tier even without a Stripe subscription ID
    // (e.g. manually provisioned accounts, reviewer accounts, grandfathered plans)
    if (!org?.stripe_subscription_id) {
      return NextResponse.json({ tier: org?.subscription_tier ?? 'free', isPro: isPro })
    }

    // Fetch live cancellation state from Stripe
    const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    return NextResponse.json({
      tier: 'pro',
      isPro: true,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      status: sub.status,
    })
  } catch (error) {
    console.error('[ITSquare] Billing status error:', error)
    // Non-fatal — return minimal info
    return NextResponse.json({ tier: 'unknown', isPro: false })
  }
}
