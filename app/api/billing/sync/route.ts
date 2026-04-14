/**
 * POST /api/billing/sync
 * Pulls subscription state directly from Stripe and syncs to DB.
 * Called client-side when landing on ?success=1 after checkout.
 * This is the reliable fallback for when webhooks are delayed or misconfigured.
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

    // Get org
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
      .select('id, stripe_customer_id, subscription_tier')
      .eq('id', profile.org_id)
      .single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ synced: false, reason: 'no_customer' })
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // Also check trialing
      const trialing = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        status: 'trialing',
        limit: 1,
      })

      if (trialing.data.length === 0) {
        console.log(`[ITSquare] Sync: no active subscription for customer ${org.stripe_customer_id}`)
        return NextResponse.json({ synced: false, reason: 'no_active_subscription' })
      }

      subscriptions.data.push(...trialing.data)
    }

    const sub = subscriptions.data[0]

    // Update org to pro
    const { error } = await admin
      .from('organizations')
      .update({
        subscription_tier: 'pro',
        stripe_subscription_id: sub.id,
      })
      .eq('id', org.id)

    if (error) {
      console.error('[ITSquare] Sync: DB update failed', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    console.log(`[ITSquare] ✅ Sync: org ${org.id} upgraded to pro via direct Stripe pull`)
    return NextResponse.json({ synced: true, plan: 'pro', subscriptionId: sub.id })
  } catch (err) {
    console.error('[ITSquare] Sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
