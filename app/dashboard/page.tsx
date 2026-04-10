'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  LogOut, 
  CheckCircle2,
  Zap,
  Users,
  Slack,
  ArrowRight,
  Sparkles,
  TrendingUp,
  HelpCircle,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        // Get profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*, organization:organizations(*)')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        // Get workspace
        if (profileData?.org_id) {
          const { data: workspaceData } = await supabase
            .from('slack_workspaces')
            .select('*')
            .eq('org_id', profileData.org_id)
            .eq('status', 'active')
            .single()
          setWorkspace(workspaceData)
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
      </div>
    )
  }

  const isConnected = workspace?.status === 'active'
  const isPro = profile?.organization?.subscription_tier === 'pro'
  const firstName = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              ITSquare
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name || user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isConnected 
              ? 'Your AI IT assistant is ready to help your team.'
              : 'Let\'s get your team set up with instant IT support.'}
          </p>
        </div>

        {!isConnected ? (
          /* Not Connected - Show Setup */
          <div className="space-y-8">
            {/* Main CTA Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-[#4A154B] to-[#611f69]">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <Slack className="h-16 w-16 text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      Connect Slack to Get Started
                    </h2>
                    <p className="text-white/80 text-lg mb-6 max-w-xl">
                      One click is all it takes. Your team will instantly have access to 
                      AI-powered IT support right where they work.
                    </p>
                    <Link href="/api/slack/install">
                      <Button size="lg" className="bg-white text-[#4A154B] hover:bg-white/90 font-semibold px-8">
                        <Slack className="h-5 w-5 mr-2" />
                        Add to Slack - It&apos;s Free
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What Happens Next */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">What happens next?</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-surface border-border/50">
                  <CardContent className="p-5">
                    <div className="p-2.5 bg-primary/10 rounded-lg w-fit mb-3">
                      <Slack className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Connect in 10 seconds</h4>
                    <p className="text-sm text-muted-foreground">
                      Just click the button and authorize. No configuration needed.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-surface border-border/50">
                  <CardContent className="p-5">
                    <div className="p-2.5 bg-green-500/10 rounded-lg w-fit mb-3">
                      <Sparkles className="h-5 w-5 text-green-500" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">Team starts asking</h4>
                    <p className="text-sm text-muted-foreground">
                      Anyone can type /itsquare followed by their IT problem.
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-surface border-border/50">
                  <CardContent className="p-5">
                    <div className="p-2.5 bg-blue-500/10 rounded-lg w-fit mb-3">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <h4 className="font-medium text-foreground mb-1">AI solves instantly</h4>
                    <p className="text-sm text-muted-foreground">
                      Get step-by-step solutions in seconds, not hours.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* Connected - Show Dashboard */
          <div className="space-y-8">
            {/* Connected Status Banner */}
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-green-500/10 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      Connected to {workspace.team_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your team can now use <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/itsquare</code> to get instant IT help
                    </p>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium bg-green-500/10 text-green-600 rounded-full">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Try It */}
              <Card className="bg-surface border-border/50 hover:border-primary/30 transition-colors group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Try It Out
                  </CardTitle>
                  <CardDescription>
                    See ITSquare in action
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4 font-mono text-sm">
                    <span className="text-muted-foreground">/itsquare</span>{' '}
                    <span className="text-foreground">my wifi keeps disconnecting</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Head to Slack and try this command. You&apos;ll get instant, helpful guidance.
                  </p>
                </CardContent>
              </Card>

              {/* Plan Status */}
              <Card className="bg-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Your Plan
                  </CardTitle>
                  <CardDescription>
                    {isPro ? 'Pro plan - unlimited support' : 'Free plan - 50 conversations/month'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-foreground">
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {isPro ? '$8/user/mo' : '$0'}
                      </span>
                    </div>
                    {!isPro && (
                      <span className="text-xs text-muted-foreground">
                        50 chats included
                      </span>
                    )}
                  </div>
                  {!isPro && (
                    <Link href="/dashboard/billing">
                      <Button className="w-full" variant="outline">
                        Upgrade to Pro
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Links */}
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/dashboard/knowledge">
                <Card className="bg-surface border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Knowledge Base</h4>
                      <p className="text-sm text-muted-foreground">Train your AI</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/integrations">
                <Card className="bg-surface border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Slack className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Integrations</h4>
                      <p className="text-sm text-muted-foreground">Manage connections</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/billing">
                <Card className="bg-surface border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Billing</h4>
                      <p className="text-sm text-muted-foreground">Manage your plan</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="mailto:support@itsquare.ai">
                <Card className="bg-surface border-border/50 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <HelpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Get Help</h4>
                      <p className="text-sm text-muted-foreground">Contact support</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
