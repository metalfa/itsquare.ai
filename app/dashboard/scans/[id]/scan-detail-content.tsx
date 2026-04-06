'use client'

import Link from 'next/link'
import { 
  Shield, 
  ArrowLeft,
  Users,
  Clock,
  AlertTriangle,
  ShieldX,
  UserX,
  Share2,
  ExternalLink,
  Ban,
  CheckCircle2,
  TrendingUp,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Scan, Finding, Organization } from '@/lib/types/database'

interface ScanDetailContentProps {
  scan: Scan
  findings: Finding[]
  organization: Organization | null
}

export function ScanDetailContent({ scan, findings, organization }: ScanDetailContentProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-muted/10'
    if (score >= 80) return 'bg-green-500/10'
    if (score >= 60) return 'bg-yellow-500/10'
    if (score >= 40) return 'bg-orange-500/10'
    return 'bg-red-500/10'
  }

  const getSeverityBadge = (severity: Finding['severity']) => {
    const colors = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/30',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      info: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    }
    return <Badge className={colors[severity]}>{severity}</Badge>
  }

  const getCategoryIcon = (category: Finding['category']) => {
    const icons = {
      dormant_account: <Clock className="h-4 w-4" />,
      no_mfa: <ShieldX className="h-4 w-4" />,
      over_privileged: <AlertTriangle className="h-4 w-4" />,
      shared_account: <Share2 className="h-4 w-4" />,
      external_account: <ExternalLink className="h-4 w-4" />,
      unused_license: <Ban className="h-4 w-4" />,
    }
    return icons[category] || <AlertTriangle className="h-4 w-4" />
  }

  const getCategoryLabel = (category: Finding['category']) => {
    const labels = {
      dormant_account: 'Dormant Account',
      no_mfa: 'No MFA',
      over_privileged: 'Over-Privileged',
      shared_account: 'Shared Account',
      external_account: 'External Account',
      unused_license: 'Unused License',
    }
    return labels[category] || category
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Group findings by category
  const findingsByCategory = findings.reduce((acc, finding) => {
    if (!acc[finding.category]) {
      acc[finding.category] = []
    }
    acc[finding.category].push(finding)
    return acc
  }, {} as Record<string, Finding[]>)

  // Count by severity
  const severityCounts = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/scans">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Scan Results</h1>
              <p className="text-foreground-variant">
                {formatDate(scan.created_at)}
              </p>
            </div>
          </div>
          {scan.report_pdf_url && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Overall Score - Large */}
          <Card className={`md:col-span-2 ${getScoreBg(scan.overall_score)} ghost-border`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Security Score</p>
                  <p className={`text-5xl font-bold ${getScoreColor(scan.overall_score)}`}>
                    {scan.overall_score ?? '-'}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                </div>
                <Shield className={`h-16 w-16 ${getScoreColor(scan.overall_score)} opacity-20`} />
              </div>
              {scan.benchmark_percentile && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Better than <span className="font-semibold text-foreground">{scan.benchmark_percentile}%</span> of similar organizations
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sub-scores */}
          <Card className="bg-surface-container ghost-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">MFA Coverage</p>
              <p className={`text-2xl font-bold ${getScoreColor(scan.mfa_coverage_score)}`}>
                {scan.mfa_coverage_score ?? '-'}
              </p>
              <Progress 
                value={scan.mfa_coverage_score || 0} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-surface-container ghost-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Access Hygiene</p>
              <p className={`text-2xl font-bold ${getScoreColor(scan.access_hygiene_score)}`}>
                {scan.access_hygiene_score ?? '-'}
              </p>
              <Progress 
                value={scan.access_hygiene_score || 0} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-surface-container ghost-border">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Privilege Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(scan.privilege_score)}`}>
                {scan.privilege_score ?? '-'}
              </p>
              <Progress 
                value={scan.privilege_score || 0} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-foreground">{scan.total_users}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-red-500">{severityCounts.critical || 0}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{severityCounts.high || 0}</p>
              <p className="text-xs text-muted-foreground">High</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{severityCounts.medium || 0}</p>
              <p className="text-xs text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{severityCounts.low || 0}</p>
              <p className="text-xs text-muted-foreground">Low</p>
            </CardContent>
          </Card>
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-foreground">{findings.length}</p>
              <p className="text-xs text-muted-foreground">Total Issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Findings by Category */}
        <Card className="bg-surface-container ghost-border">
          <CardHeader>
            <CardTitle>Security Findings</CardTitle>
            <CardDescription>
              Issues detected during the security scan, grouped by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500/30" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No issues found</h3>
                <p className="text-muted-foreground">
                  Great job! Your identity infrastructure looks secure.
                </p>
              </div>
            ) : (
              <Tabs defaultValue={Object.keys(findingsByCategory)[0]} className="w-full">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0 mb-4">
                  {Object.entries(findingsByCategory).map(([category, catFindings]) => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="data-[state=active]:bg-primary-container data-[state=active]:text-white"
                    >
                      {getCategoryIcon(category as Finding['category'])}
                      <span className="ml-2">{getCategoryLabel(category as Finding['category'])}</span>
                      <Badge variant="secondary" className="ml-2">
                        {catFindings.length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(findingsByCategory).map(([category, catFindings]) => (
                  <TabsContent key={category} value={category}>
                    <div className="space-y-2">
                      {catFindings.map((finding) => (
                        <div 
                          key={finding.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-surface-container">
                              {getCategoryIcon(finding.category)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {finding.user_email || 'Unknown user'}
                              </p>
                              {finding.user_name && (
                                <p className="text-sm text-muted-foreground">
                                  {finding.user_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {finding.source.replace('_', ' ')}
                            </Badge>
                            {getSeverityBadge(finding.severity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* AI Summary (if available) */}
        {scan.ai_summary && (
          <Card className="mt-8 bg-surface-container ghost-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                AI Security Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-variant whitespace-pre-wrap">
                {scan.ai_summary}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
