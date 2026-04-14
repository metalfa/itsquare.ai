/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscriptions.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://itsquare.ai'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get user's organization with Stripe customer ID
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
      .select('stripe_customer_id')
      .eq('id', profile.org_id)
      .single()

    if (!org?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please upgrade first.' },
        { status: 400 },
      )
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${BASE_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('[ITSquare] Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 },
    )
  }
}
