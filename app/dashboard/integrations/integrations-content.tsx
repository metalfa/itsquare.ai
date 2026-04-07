'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  LogOut, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react'
import type { Database } from '@/lib/types/database'

type UserProfile = Database['public']['Tables']['users']['Row'] & {
  organization: Database['public']['Tables']['organizations']['Row'] | null
}
type Integration = Database['public']['Tables']['integrations']['Row']

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
  profile: UserProfile | null
  integrations: Integration[]
  slackWorkspace: SlackWorkspace | null
}

export function IntegrationsContent({ user, profile, integrations, slackWorkspace }: IntegrationsContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [oktaDomain, setOktaDomain] = useState('')
  const [oktaApiToken, setOktaApiToken] = useState('')
  const [isConnectingOkta, setIsConnectingOkta] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [oktaError, setOktaError] = useState<string | null>(null)

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  const oktaIntegration = integrations.find(i => i.provider === 'okta')
  const googleIntegration = integrations.find(i => i.provider === 'google_workspace')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleConnectOkta = async () => {
    if (!oktaDomain || !oktaApiToken) {
      setOktaError('Please enter both your Okta domain and API token.')
      return
    }
    
    setIsConnectingOkta(true)
    setOktaError(null)
    
    try {
      // Call server-side API to validate and store the token
      const response = await fetch('/api/connect/okta/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: oktaDomain,
          apiToken: oktaApiToken,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Okta')
      }
      
      router.push('/dashboard/integrations?success=okta_connected')
      router.refresh()
    } catch (err) {
      console.error('[v0] Okta connection error:', err)
      setOktaError(err instanceof Error ? err.message : 'Failed to connect to Okta')
    } finally {
      setIsConnectingOkta(false)
    }
  }

  const handleConnectGoogle = () => {
    setIsConnectingGoogle(true)
    window.location.href = `/api/connect/google?action=connect`
  }

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration? This will remove all stored credentials.')) {
      return
    }

    setDeletingId(integrationId)
    
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId)

    if (error) {
      console.error('[v0] Failed to delete integration:', error)
      alert('Failed to disconnect integration. Please try again.')
    } else {
      router.refresh()
    }
    
    setDeletingId(null)
  }

  const getErrorMessage = (code: string) => {
    const messages: Record<string, string> = {
      domain_required: 'Please enter your Okta domain.',
      not_configured: 'OAuth is not configured. Please contact support.',
      state_mismatch: 'Security check failed. Please try again.',
      token_exchange_failed: 'Failed to connect. Please ensure you have admin permissions.',
      storage_failed: 'Failed to save integration. Please try again.',
      access_denied: 'Access denied. You need admin permissions to connect.',
      unknown: 'An unknown error occurred. Please try again.',
    }
    return messages[code] || messages.unknown
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-outline-variant/15 bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tighter text-foreground">
              ITsquare.ai
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {profile?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.organization?.name || 'No organization'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
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
            Connect your identity providers to scan your organization for security risks.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {success === 'okta_connected' && 'Okta connected successfully!'}
                {success === 'google_connected' && 'Google Workspace connected successfully!'}
                {(success === 'slack_installed' || success === 'slack_updated') && 'Slack connected successfully!'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You can now run security scans on your organization.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Connection failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getErrorMessage(error)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Okta Integration */}
          <Card className="bg-surface-container ghost-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#007DC1]/10 border border-[#007DC1]/20">
                    <svg className="h-6 w-6 text-[#007DC1]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.96c-3.84 0-6.96-3.12-6.96-6.96S8.16 5.04 12 5.04 18.96 8.16 18.96 12s-3.12 6.96-6.96 6.96z"/>
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Okta</CardTitle>
                    <CardDescription>
                      Connect your Okta organization to scan users, apps, and groups.
                    </CardDescription>
                  </div>
                </div>
                {oktaIntegration && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {oktaIntegration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low ghost-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{oktaIntegration.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(oktaIntegration.connected_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(oktaIntegration.id)}
                      disabled={deletingId === oktaIntegration.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === oktaIntegration.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Disconnect</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scopes: {oktaIntegration.scopes?.join(', ') || 'Read-only access'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {oktaError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                      {oktaError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="okta-domain">Okta Domain</Label>
                    <Input
                      id="okta-domain"
                      placeholder="company.okta.com"
                      value={oktaDomain}
                      onChange={(e) => setOktaDomain(e.target.value)}
                      className="bg-surface-container-low border-outline-variant/30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your Okta domain (e.g., company.okta.com or company.oktapreview.com)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okta-token">API Token</Label>
                    <Input
                      id="okta-token"
                      type="password"
                      placeholder="00abc123..."
                      value={oktaApiToken}
                      onChange={(e) => setOktaApiToken(e.target.value)}
                      className="bg-surface-container-low border-outline-variant/30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Create an API token in Okta Admin Console: Security → API → Tokens → Create Token
                    </p>
                  </div>
                  <Button
                    onClick={handleConnectOkta}
                    disabled={!oktaDomain || !oktaApiToken || isConnectingOkta}
                    className="bg-primary-container hover:bg-primary-container/90 text-white w-full"
                  >
                    {isConnectingOkta ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {isConnectingOkta ? 'Connecting...' : 'Connect Okta'}
                  </Button>
                  <div className="p-3 bg-surface-container-low ghost-border">
                    <p className="text-xs text-muted-foreground">
                      <strong>How to create an Okta API Token:</strong>
                    </p>
                    <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                      <li>Log in to your Okta Admin Console</li>
                      <li>Go to Security → API → Tokens</li>
                      <li>Click &quot;Create Token&quot;</li>
                      <li>Name it &quot;ITSquare.AI&quot; and copy the token</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Workspace Integration */}
          <Card className="bg-surface-container ghost-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-outline-variant/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Google Workspace</CardTitle>
                    <CardDescription>
                      Connect your Google Workspace to scan users and groups.
                    </CardDescription>
                  </div>
                </div>
                {googleIntegration && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {googleIntegration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low ghost-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{googleIntegration.domain || 'Google Workspace'}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(googleIntegration.connected_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(googleIntegration.id)}
                      disabled={deletingId === googleIntegration.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === googleIntegration.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Disconnect</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scopes: {googleIntegration.scopes?.join(', ') || 'Read-only access'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="bg-primary-container hover:bg-primary-container/90 text-white"
                  >
                    {isConnectingGoogle ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect Google Workspace
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You must be a Google Workspace admin to connect your organization.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slack Integration */}
          <Card className="bg-surface-container ghost-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#4A154B]/10 border border-[#4A154B]/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
                      <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
                      <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312z" fill="#2EB67D"/>
                      <path d="M15.165 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.27a2.527 2.527 0 0 1-2.521-2.522 2.527 2.527 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#ECB22E"/>
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Slack</CardTitle>
                    <CardDescription>
                      Connect Slack to enable AI IT support and device health monitoring.
                    </CardDescription>
                  </div>
                </div>
                {slackWorkspace && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {slackWorkspace ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low ghost-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{slackWorkspace.team_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {slackWorkspace.team_domain && `${slackWorkspace.team_domain}.slack.com • `}
                        Connected {new Date(slackWorkspace.installed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-container-low ghost-border">
                    <p className="text-xs text-muted-foreground">
                      <strong>How to use:</strong>
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>DM @ITSquare for AI IT support</li>
                      <li>Use <code className="bg-muted px-1 py-0.5">/itsquare scan</code> to scan your device</li>
                      <li>Use <code className="bg-muted px-1 py-0.5">/itsquare status</code> to see your device health</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    asChild
                    className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white"
                  >
                    <a href="/api/slack/install">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add to Slack
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Install ITSquare.AI in your Slack workspace to enable:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>AI-powered IT support via DM</li>
                    <li>Device health scanning with <code className="bg-muted px-1 py-0.5">/itsquare scan</code></li>
                    <li>Real-time security alerts in Slack</li>
                    <li>Access request workflows</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info box */}
          <Card className="bg-surface-container-low ghost-border border-outline-variant/20">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Security First</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We only request read-only access to your identity data. Your credentials are 
                    encrypted and never shared. You can disconnect at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
