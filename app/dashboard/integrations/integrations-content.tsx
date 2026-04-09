'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageSquare, 
  LogOut, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Slack,
  FileText,
  Database,
} from 'lucide-react'

interface SlackWorkspace {
  id: string
  team_id: string
  team_name: string
  team_domain: string | null
  status: 'active' | 'revoked' | 'error'
  installed_at: string
}

interface IntegrationsContentProps {
  user: User
  profile: {
    full_name: string | null
    organization: {
      name: string
    } | null
  } | null
  slackWorkspace: SlackWorkspace | null
}

export function IntegrationsContent({ user, profile, slackWorkspace }: IntegrationsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      access_denied: 'Access denied. Please try again.',
      state_mismatch: 'Security check failed. Please try again.',
      unknown: 'Something went wrong. Please try again.',
    }
    return messages[code] || messages.unknown
  }

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

      {/* Main content */}
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
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your tools to supercharge IT support.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {success === 'slack_installed' && 'Slack connected successfully!'}
                {success === 'slack_updated' && 'Slack workspace updated!'}
                {success === 'docs_connected' && 'Documentation connected!'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your team can now use ITSquare in Slack.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Connection failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Slack Integration - Primary */}
          <Card className={`bg-surface-container ghost-border ${!slackWorkspace ? 'border-primary/30' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#4A154B]/10 rounded-xl">
                    <Slack className="h-6 w-6 text-[#4A154B]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Slack</CardTitle>
                    <CardDescription>
                      Required - Where your team gets IT help
                    </CardDescription>
                  </div>
                </div>
                {slackWorkspace?.status === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {slackWorkspace?.status === 'active' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{slackWorkspace.team_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {slackWorkspace.team_domain}.slack.com
                      </p>
                    </div>
                    <Link href="/api/slack/install">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconnect
                      </Button>
                    </Link>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-foreground font-medium mb-1">How your team uses it:</p>
                    <p className="text-sm text-muted-foreground">
                      Type <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/itsquare</code> followed by any IT problem
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect Slack to let your team get instant AI-powered IT help.
                  </p>
                  <Link href="/api/slack/install">
                    <Button className="bg-[#4A154B] hover:bg-[#3a1139] text-white">
                      <Slack className="h-4 w-4 mr-2" />
                      Add to Slack
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Base - Coming Soon */}
          <Card className="bg-surface-container ghost-border opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Knowledge Base</CardTitle>
                    <CardDescription>
                      Connect Google Docs, Notion, or Confluence
                    </CardDescription>
                  </div>
                </div>
                <span className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Coming Soon
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Let the AI learn from your company docs to give more accurate answers.
              </p>
            </CardContent>
          </Card>

          {/* Ticketing - Coming Soon */}
          <Card className="bg-surface-container ghost-border opacity-75">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Database className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Ticketing System</CardTitle>
                    <CardDescription>
                      Connect Jira, Zendesk, or ServiceNow
                    </CardDescription>
                  </div>
                </div>
                <span className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  Coming Soon
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-create tickets when AI can&apos;t solve an issue, and learn from past resolutions.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
