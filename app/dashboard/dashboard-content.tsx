'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  LogOut, 
  Plus, 
  Activity, 
  Users, 
  ShieldAlert,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Settings,
  FileText
} from 'lucide-react'
import type { Database } from '@/lib/types/database'

type UserProfile = Database['public']['Tables']['users']['Row'] & {
  organization: Database['public']['Tables']['organizations']['Row'] | null
}
type Scan = Database['public']['Tables']['scans']['Row']
type Integration = Database['public']['Tables']['integrations']['Row']

interface DashboardContentProps {
  user: User
  profile: UserProfile | null
  scans: Scan[]
  integrations: Integration[]
}

export function DashboardContent({ user, profile, scans, integrations }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const latestScan = scans[0]
  const hasIntegrations = integrations.length > 0

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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-muted-foreground">
            {hasIntegrations 
              ? 'View your security posture and run new scans.'
              : 'Connect your identity provider to start your first security scan.'}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-surface-container ghost-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 border border-primary/20">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {latestScan?.overall_score ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Security Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container ghost-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 border border-secondary/20">
                  <Users className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {latestScan?.total_users ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container ghost-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 border border-destructive/20">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {latestScan 
                      ? (latestScan.dormant_accounts || 0) + (latestScan.no_mfa_accounts || 0) + (latestScan.over_privileged_accounts || 0)
                      : '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Findings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface-container ghost-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-1/10 border border-chart-1/20">
                  <LinkIcon className="h-4 w-4 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {integrations.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Connect integration CTA (if no integrations) */}
            {!hasIntegrations && (
              <Card className="bg-surface-container ghost-border border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Connect Your Identity Provider
                  </CardTitle>
                  <CardDescription>
                    Connect Okta or Google Workspace to scan your organization for security risks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="bg-primary-container hover:bg-primary-container/90 text-white font-medium flex-1"
                      disabled
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.96c-3.84 0-6.96-3.12-6.96-6.96S8.16 5.04 12 5.04 18.96 8.16 18.96 12s-3.12 6.96-6.96 6.96z"/>
                      </svg>
                      Connect Okta
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-outline-variant/30 flex-1"
                      disabled
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Connect Google Workspace
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    OAuth integration coming soon. We use read-only access to analyze your identity data.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent scans */}
            <Card className="bg-surface-container ghost-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Scans</CardTitle>
                  <Button 
                    size="sm" 
                    className="bg-primary-container hover:bg-primary-container/90 text-white"
                    disabled={!hasIntegrations}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Scan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scans.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No scans yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect an integration to run your first scan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scans.map((scan) => (
                      <div
                        key={scan.id}
                        className="flex items-center justify-between p-3 bg-surface-container-low ghost-border hover:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {scan.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-secondary" />
                          ) : scan.status === 'running' ? (
                            <Activity className="h-5 w-5 text-primary animate-pulse" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Security Scan
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scan.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            {scan.overall_score ?? '--'}
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
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
            {/* Quick actions */}
            <Card className="bg-surface-container ghost-border">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-foreground-variant hover:text-foreground hover:bg-surface-container-high"
                  disabled
                >
                  <FileText className="h-4 w-4 mr-3" />
                  View Latest Report
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-foreground-variant hover:text-foreground hover:bg-surface-container-high"
                  disabled
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Organization Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-foreground-variant hover:text-foreground hover:bg-surface-container-high"
                  disabled
                >
                  <LinkIcon className="h-4 w-4 mr-3" />
                  Manage Integrations
                </Button>
              </CardContent>
            </Card>

            {/* Organization info */}
            {profile?.organization && (
              <Card className="bg-surface-container ghost-border">
                <CardHeader>
                  <CardTitle className="text-lg">Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium text-foreground">{profile.organization.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {profile.organization.subscription_tier || 'Free'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Role</p>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {profile.role || 'Admin'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
