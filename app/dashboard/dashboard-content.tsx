'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  LogOut, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Slack,
  Settings,
  CreditCard,
  HelpCircle,
} from 'lucide-react'

interface SlackWorkspace {
  id: string
  team_name: string
  team_domain: string | null
  status: string
}

interface DashboardContentProps {
  user: User
  profile: {
    full_name: string | null
    organization: {
      name: string
      subscription_tier: string | null
    } | null
  } | null
  slackWorkspace: SlackWorkspace | null
  stats: {
    totalConversations: number
    resolvedByAI: number
    avgResponseTime: number
    activeUsers: number
  }
  recentConversations: Array<{
    id: string
    problem: string
    status: string
    created_at: string
    user_name: string | null
  }>
}

export function DashboardContent({ 
  user, 
  profile, 
  slackWorkspace, 
  stats, 
  recentConversations 
}: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isConnected = slackWorkspace?.status === 'active'
  const isPro = profile?.organization?.subscription_tier === 'pro'
  const resolutionRate = stats.totalConversations > 0 
    ? Math.round((stats.resolvedByAI / stats.totalConversations) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-outline-variant/15 bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              ITSquare.AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.organization?.name || 'Your Workspace'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
            {profile?.full_name ? `Hey ${profile.full_name.split(' ')[0]}` : 'Welcome'}
          </h1>
          <p className="text-muted-foreground">
            {isConnected 
              ? 'Your AI IT assistant is helping your team in Slack.'
              : 'Connect Slack to get started with AI IT support.'}
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="p-4 bg-white/80 rounded-2xl shadow-sm">
                  <Slack className="h-12 w-12 text-[#4A154B]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Connect Your Slack Workspace
                  </h2>
                  <p className="text-muted-foreground mb-4 max-w-lg">
                    One click and your team gets instant AI IT support. 
                    No setup, no training needed.
                  </p>
                  <Link href="/api/slack/install">
                    <Button className="bg-[#4A154B] hover:bg-[#3a1139] text-white">
                      <Slack className="h-4 w-4 mr-2" />
                      Add to Slack
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-surface-container ghost-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalConversations}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Chats</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container ghost-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {resolutionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Resolved by AI</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container ghost-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.avgResponseTime}s
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface-container ghost-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.activeUsers}
                      </p>
                      <p className="text-xs text-muted-foreground">Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="md:col-span-2">
                <Card className="bg-surface-container ghost-border h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Conversations</CardTitle>
                    <CardDescription>
                      IT issues your team asked about
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentConversations.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No conversations yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tell your team to type <code className="bg-muted px-1.5 py-0.5 rounded">/itsquare</code> in Slack
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentConversations.map((convo) => (
                          <div 
                            key={convo.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors"
                          >
                            <div className={`p-1.5 rounded-full ${
                              convo.status === 'resolved' 
                                ? 'bg-green-500/10' 
                                : 'bg-yellow-500/10'
                            }`}>
                              {convo.status === 'resolved' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {convo.problem}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {convo.user_name || 'Team member'} &middot; {new Date(convo.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Connected Workspace */}
                <Card className="bg-surface-container ghost-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Slack className="h-4 w-4 text-[#4A154B]" />
                      Connected Workspace
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {slackWorkspace?.team_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {slackWorkspace?.team_domain}.slack.com
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Plan */}
                <Card className="bg-surface-container ghost-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Your Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-foreground">
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isPro 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isPro ? '$8/user/mo' : '$0'}
                      </span>
                    </div>
                    {!isPro && (
                      <>
                        <p className="text-xs text-muted-foreground mb-3">
                          50 conversations/month included
                        </p>
                        <Link href="/dashboard/billing">
                          <Button variant="outline" size="sm" className="w-full">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade to Pro
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card className="bg-surface-container ghost-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <Link href="/dashboard/integrations" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                      <span className="text-sm text-foreground flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Integrations
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link href="/docs" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                      <span className="text-sm text-foreground flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        Help Center
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
