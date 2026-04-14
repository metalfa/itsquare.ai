/**
 * POST /api/billing/webhook
 * Handles Stripe webhook events.
 *
 * Verifies the signature, then syncs subscription state to the database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[ITSquare] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[ITSquare] Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') break

        let orgId = session.metadata?.org_id as string | undefined

        // Fallback: look up org by Stripe customer ID
        if (!orgId && session.customer) {
          const { data: orgByCustomer } = await admin
            .from('organizations')
            .select('id')
            .eq('stripe_customer_id', session.customer as string)
            .maybeSingle()
          orgId = orgByCustomer?.id
        }

        if (!orgId) {
          console.warn('[ITSquare] checkout.session.completed: could not resolve org_id', {
            metadata: session.metadata,
            customer: session.customer,
          })
          break
        }

        const { error: upgradeError } = await admin
          .from('organizations')
          .update({
            subscription_tier: 'pro',
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', orgId)

        if (upgradeError) {
          console.error('[ITSquare] Failed to upgrade org:', upgradeError)
        } else {
          console.log(`[ITSquare] ✅ Org ${orgId} upgraded to pro, sub: ${session.subscription}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const orgId = sub.metadata?.org_id as string | undefined

        if (!orgId) {
          // Try to look up by stripe_subscription_id
          const subId = sub.id
          const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle()

          if (!org) {
            console.warn('[ITSquare] subscription.updated: org not found for sub', subId)
            break
          }

          const isActive = sub.status === 'active' || sub.status === 'trialing'
          await admin
            .from('organizations')
            .update({ subscription_tier: isActive ? 'pro' : 'free' })
            .eq('id', org.id)

          break
        }

        const isActive = sub.status === 'active' || sub.status === 'trialing'
        await admin
          .from('organizations')
          .update({
            subscription_tier: isActive ? 'pro' : 'free',
            stripe_subscription_id: sub.id,
          })
          .eq('id', orgId)

        console.log(`[ITSquare] Sub updated for org ${orgId}: status=${sub.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const subId = sub.id

        // Find org by subscription ID
        const { data: org } = await admin
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle()

        if (org) {
          await admin
            .from('organizations')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', org.id)

          console.log(`[ITSquare] Org ${org.id} downgraded to free (sub deleted)`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.warn(
          '[ITSquare] Payment failed:',
          invoice.id,
          'customer:',
          invoice.customer,
          'amount:',
          invoice.amount_due,
        )
        // Future: mark org as past_due and notify via Slack
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    console.error('[ITSquare] Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
