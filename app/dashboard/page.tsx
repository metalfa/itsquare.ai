'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Brain,
  Monitor,
  ArrowUpRight,
  Clock,
  BookOpen,
  Slack,
  Shield,
  XCircle,
} from 'lucide-react'

interface BillingStatus {
  tier: string
  isPro: boolean
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string
  status?: string
}

interface WorkspaceInfo {
  id: string
  name: string
}

interface DashboardStats {
  workspace: WorkspaceInfo
  allWorkspaces: WorkspaceInfo[]
  conversations: {
    total: number; today: number; thisWeek: number; thisMonth: number; open: number
  }
  resolutions: {
    resolved: number; escalated: number; avgConfidence: number; autoResolveRate: number
  }
  devices: {
    totalDevices: number
    platforms: Record<string, number>
    healthAlerts: Array<{ user: string; metric: string; value: number; severity: string }>
  }
  recentThreads: Array<{
    id: string; topic: string; status: string; user: string
    confidence: number; createdAt: string; resolvedAt: string | null
  }>
  topIssues: Array<{ topic: string; count: number }>
  knowledgeBase: { totalDocs: number; autoExtracted: number; totalChunks: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)

  // Load stats (optionally for a specific workspace)
  const loadStats = async (workspaceId?: string | null) => {
    const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
    const statsRes = await fetch(`/api/dashboard/stats${qs}`)
    if (statsRes.ok) {
      const data = await statsRes.json()
      setStats(data)
      setSelectedWorkspaceId(data.workspace.id)
      setError(null)
    } else if (statsRes.status === 404) {
      setError('no-workspace')
    }
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      try {
        const [, billingRes] = await Promise.all([
          loadStats(),
          fetch('/api/billing/status'),
        ])

        if (billingRes.ok) {
          setBilling(await billingRes.json())
        }
      } catch {
        setError('failed')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleWorkspaceSwitch = async (wsId: string) => {
    if (wsId === selectedWorkspaceId) return
    setLoading(true)
    try {
      await loadStats(wsId)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">IT Support Command Center</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="h-5 w-20 bg-muted/50 rounded animate-pulse mb-3" />
                <div className="h-8 w-16 bg-muted/50 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="border-border/50">
              <CardContent className="p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/50 animate-pulse" />
                    <div className="h-4 flex-1 bg-muted/50 rounded animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="h-4 w-32 bg-muted/50 rounded animate-pulse mb-4" />
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error === 'no-workspace') {
    return <SetupPrompt />
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Failed to load dashboard. Please refresh.</p>
      </div>
    )
  }

  const { conversations, resolutions, devices, recentThreads, topIssues, knowledgeBase } = stats

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {stats.workspace.name}
            </h1>
            {stats.allWorkspaces.length > 1 && (
              <select
                value={selectedWorkspaceId || ''}
                onChange={(e) => handleWorkspaceSwitch(e.target.value)}
                className="text-sm bg-muted/50 border border-border/50 rounded-lg px-2 py-1 text-foreground cursor-pointer hover:bg-muted transition-colors"
              >
                {stats.allWorkspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="text-muted-foreground">IT Support Command Center</p>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Cancellation Banner */}
      {billing?.cancelAtPeriodEnd && billing.currentPeriodEnd && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-start gap-4">
          <XCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Cancellation scheduled
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your Pro access continues until{' '}
              <span className="font-medium text-foreground">
                {new Date(billing.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </span>
              . After that, you&apos;ll switch to the Free plan.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs text-amber-500 hover:text-amber-400 font-medium whitespace-nowrap shrink-0 mt-0.5 underline underline-offset-2"
          >
            Manage
          </Link>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Conversations"
          value={conversations.thisMonth}
          subtext={`${conversations.today} today`}
          color="blue"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Auto-Resolved"
          value={`${resolutions.autoResolveRate}%`}
          subtext={`${resolutions.resolved} resolved`}
          color="green"
        />
        <MetricCard
          icon={<Brain className="h-5 w-5" />}
          label="AI Confidence"
          value={`${resolutions.avgConfidence}%`}
          subtext="avg solution score"
          color="purple"
        />
        <MetricCard
          icon={<Monitor className="h-5 w-5" />}
          label="Devices Scanned"
          value={devices.totalDevices}
          subtext={Object.keys(devices.platforms).join(', ') || 'none yet'}
          color="orange"
        />
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Conversations — 2 cols */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Conversations
            </h2>
            {conversations.open > 0 && (
              <Badge variant="secondary" className="text-amber-400 bg-amber-500/10">
                {conversations.open} open
              </Badge>
            )}
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0">
              {recentThreads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet. Tell your team to message the bot in Slack!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentThreads.map((thread) => (
                    <div key={thread.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <StatusDot status={thread.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {thread.topic}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(thread.createdAt)}
                          {thread.confidence != null && thread.status === 'resolved' && (
                            <span className="ml-2">· {Math.round(thread.confidence * 100)}% confidence</span>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          thread.status === 'resolved' ? 'text-green-400 border-green-500/30' :
                          thread.status === 'escalated' ? 'text-red-400 border-red-500/30' :
                          'text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {thread.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Health Alerts */}
          {devices.healthAlerts.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Health Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {devices.healthAlerts.map((alert, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-red-300">{alert.metric}</span>
                    <Badge variant="destructive" className="text-xs">
                      {alert.metric === 'Network' ? `${alert.value} Mbps` :
                       alert.metric === 'Latency' ? `${alert.value}ms` :
                       `Score: ${alert.value}`}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Issues This Week */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Top Issues This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topIssues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No issues reported yet</p>
              ) : (
                <div className="space-y-2">
                  {topIssues.map((issue, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate flex-1 mr-2">{issue.topic}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{issue.count}×</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Base Health */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Manual articles</span>
                <span className="font-medium">{knowledgeBase.totalDocs - knowledgeBase.autoExtracted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto-extracted</span>
                <span className="font-medium text-green-600">{knowledgeBase.autoExtracted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Search chunks</span>
                <span className="font-medium">{knowledgeBase.totalChunks}</span>
              </div>
              <Link href="/dashboard/knowledge">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Manage KB
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Platform Breakdown */}
          {devices.totalDevices > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Fleet Platforms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(devices.platforms).map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{platform}</span>
                      <span className="text-muted-foreground">{count} device{count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function MetricCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode; label: string; value: string | number; subtext: string; color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600',
  }
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    open: 'bg-amber-400',
    resolved: 'bg-green-400',
    escalated: 'bg-red-400',
    stale: 'bg-gray-400',
  }
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorMap[status] || 'bg-gray-400'}`} />
}

function SetupPrompt() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-5 bg-primary/10 rounded-2xl mb-6">
        <Slack className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">Connect Slack to Get Started</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        One click is all it takes. Your team will instantly have access to AI-powered IT support right where they work.
      </p>
      <Link href="/api/slack/install">
        <Button size="lg" className="font-semibold px-8">
          <Slack className="h-5 w-5 mr-2" />
          Add to Slack — It&apos;s Free
        </Button>
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
