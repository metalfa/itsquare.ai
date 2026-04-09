'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Slack,
  FileText,
  Ticket,
  Calendar,
} from 'lucide-react'

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<any>(null)

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/auth/login')
          return
        }

        // Get profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*, organization:organizations(*)')
          .eq('id', user.id)
          .single()

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
        console.error('Integrations load error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">Integrations</h1>
            <p className="text-sm text-muted-foreground">Connect your tools</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Slack connected successfully!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your team can now type <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/itsquare</code> in Slack to get IT help.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Connection failed</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again. If the problem persists, contact support.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Slack - Primary */}
          <Card className={`border-2 ${isConnected ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30 bg-primary/5'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#4A154B] rounded-xl">
                    <Slack className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Slack</CardTitle>
                    <CardDescription className="text-base">
                      Where your team gets instant IT help
                    </CardDescription>
                  </div>
                </div>
                {isConnected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-500/10 text-green-600 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
                    <div>
                      <p className="font-semibold text-foreground text-lg">{workspace.team_name}</p>
                      <p className="text-muted-foreground">
                        {workspace.team_domain}.slack.com
                      </p>
                    </div>
                    <Link href="/api/slack/install">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconnect
                      </Button>
                    </Link>
                  </div>
                  <div className="p-4 bg-background/50 rounded-xl">
                    <p className="font-medium text-foreground mb-2">Your team can now:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Type <code className="bg-muted px-1.5 py-0.5 rounded">/itsquare my wifi is slow</code></li>
                      <li>Get instant AI-powered troubleshooting</li>
                      <li>No waiting, no tickets needed</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    One click to give your entire team instant AI IT support.
                  </p>
                  <Link href="/api/slack/install">
                    <Button size="lg" className="bg-[#4A154B] hover:bg-[#3a1139] text-white">
                      <Slack className="h-5 w-5 mr-2" />
                      Add to Slack - Free
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coming Soon Section */}
          <div className="pt-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              We&apos;re building more integrations to make ITSquare even smarter.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Knowledge Base */}
              <Card className="bg-surface border-border/50">
                <CardContent className="p-5">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg w-fit mb-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground">
                    Google Docs, Notion, Confluence
                  </p>
                </CardContent>
              </Card>

              {/* Ticketing */}
              <Card className="bg-surface border-border/50">
                <CardContent className="p-5">
                  <div className="p-2.5 bg-orange-500/10 rounded-lg w-fit mb-3">
                    <Ticket className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Ticketing</h3>
                  <p className="text-sm text-muted-foreground">
                    Jira, Zendesk, ServiceNow
                  </p>
                </CardContent>
              </Card>

              {/* Calendar */}
              <Card className="bg-surface border-border/50">
                <CardContent className="p-5">
                  <div className="p-2.5 bg-green-500/10 rounded-lg w-fit mb-3">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    Google Calendar, Outlook
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
