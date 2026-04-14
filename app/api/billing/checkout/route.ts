/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for upgrading to Pro.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itsquare.ai'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get user's organization
    const { data: profile } = await admin
      .from('users')
      .select('org_id, email')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Get organization with existing Stripe customer
    const { data: org } = await admin
      .from('organizations')
      .select('id, name, stripe_customer_id')
      .eq('id', profile.org_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get workspace to count Slack users for per-seat pricing
    const { data: workspace } = await admin
      .from('slack_workspaces')
      .select('id')
      .eq('org_id', org.id)
      .maybeSingle()

    // Count active Slack users in workspace
    let seatCount = 1
    if (workspace) {
      const { count } = await admin
        .from('slack_users')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id)

      if (count && count > 0) seatCount = count
    }

    // Create or retrieve Stripe customer
    let customerId = org.stripe_customer_id ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile.email ?? undefined,
        name: org.name,
        metadata: {
          org_id: org.id,
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Persist customer ID on org
      await admin
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)
    }

    const priceId = STRIPE_CONFIG.PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 })
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: seatCount,
        },
      ],
      subscription_data: {
        metadata: {
          org_id: org.id,
        },
      },
      success_url: `${BASE_URL}/dashboard/billing?success=1`,
      cancel_url: `${BASE_URL}/dashboard/billing?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[ITSquare] Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
