import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  ArrowLeft,
  Check,
  Zap,
} from 'lucide-react'

export const metadata = {
  title: 'Billing | ITSquare.AI',
  description: 'Manage your subscription',
}

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  const isPro = profile?.organization?.subscription_tier === 'pro'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-outline-variant/15 bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              ITSquare.AI
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            Billing
          </h1>
          <p className="text-muted-foreground">
            {isPro ? 'Manage your Pro subscription' : 'Upgrade to unlock unlimited IT support'}
          </p>
        </div>

        {isPro ? (
          <Card className="bg-surface-container ghost-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Pro Plan
              </CardTitle>
              <CardDescription>
                You have full access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground mb-4">
                $8<span className="text-base font-normal text-muted-foreground">/user/month</span>
              </p>
              <Button variant="outline" disabled>
                Manage Subscription
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Stripe billing coming soon
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="bg-surface-container ghost-border">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>
                  For trying out ITSquare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground mb-6">
                  $0<span className="text-base font-normal text-muted-foreground">/forever</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    50 conversations/month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    AI-powered troubleshooting
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Slack integration
                  </li>
                </ul>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                    Recommended
                  </span>
                </div>
                <CardDescription>
                  For teams that need unlimited support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground mb-6">
                  $8<span className="text-base font-normal text-muted-foreground">/user/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Unlimited conversations
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Knowledge base integration
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Smart escalation to IT team
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Stripe checkout coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
