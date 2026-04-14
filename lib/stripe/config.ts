/**
 * Stripe billing configuration.
 * Price IDs reference env vars — set STRIPE_PRICE_ID in your environment.
 */

export const STRIPE_CONFIG = {
  /** Pro plan: $8/user/month */
  PRO_PRICE_ID: process.env.STRIPE_PRICE_ID ?? '',

  plans: {
    free: {
      name: 'Free',
      messageLimit: 50,
      price: 0,
    },
    pro: {
      name: 'Pro',
      messageLimit: Infinity,
      pricePerUser: 8,
      priceId: process.env.STRIPE_PRICE_ID ?? '',
    },
  },
} as const

export type PlanName = keyof typeof STRIPE_CONFIG.plans
