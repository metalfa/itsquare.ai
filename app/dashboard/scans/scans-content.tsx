'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Users,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Scan, Organization } from '@/lib/types/database'

interface ScansContentProps {
  scans: Scan[]
  hasActiveIntegrations: boolean
  organization: Organization | null
}

export function ScansContent({ scans, hasActiveIntegrations, organization }: ScansContentProps) {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const runScan = async () => {
    if (!hasActiveIntegrations) {
      setError('Please connect an identity provider first.')
      return
    }

    setIsScanning(true)
    setError(null)
    setScanProgress(0)
    setScanStatus('Initializing scan...')

    try {
      // Simulate progress updates while waiting for the actual scan
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 2000)

      const response = await fetch('/api/scan/trigger', {
        method: 'POST',
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (result.success) {
        setScanProgress(100)
        setScanStatus('Scan completed!')
        // Refresh the page to show new scan
        setTimeout(() => {
          router.refresh()
          setIsScanning(false)
        }, 1000)
      } else {
        setError(result.error || 'Scan failed')
        setIsScanning(false)
      }
    } catch (err) {
      setError('Failed to start scan. Please try again.')
      setIsScanning(false)
    }
  }

  const getStatusBadge = (status: Scan['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Completed</Badge>
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">Running</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Security Scans</h1>
              <p className="text-foreground-variant">
                {organization?.name || 'Your organization'}
              </p>
            </div>
          </div>
          <Button
            onClick={runScan}
            disabled={isScanning || !hasActiveIntegrations}
            className="bg-primary-container hover:bg-primary-container/90 text-white"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run New Scan
              </>
            )}
          </Button>
        </div>

        {/* Scan Progress */}
        {isScanning && (
          <Card className="mb-8 bg-surface-container ghost-border border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{scanStatus || 'Running security scan...'}</p>
                  <p className="text-sm text-muted-foreground">
                    This may take a few minutes depending on the number of users.
                  </p>
                </div>
              </div>
              <Progress value={scanProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {Math.round(scanProgress)}%
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-8 bg-red-500/10 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-red-500">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Integrations Warning */}
        {!hasActiveIntegrations && (
          <Card className="mb-8 bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-500">No identity provider connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect Okta or Google Workspace to run security scans.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/integrations">
                  <Button variant="outline" className="border-yellow-500/30 text-yellow-500">
                    Connect Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scans List */}
        {scans.length === 0 ? (
          <Card className="bg-surface-container ghost-border">
            <CardContent className="py-16 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No scans yet</h3>
              <p className="text-muted-foreground mb-6">
                Run your first security scan to identify risks in your identity infrastructure.
              </p>
              {hasActiveIntegrations && (
                <Button onClick={runScan} disabled={isScanning}>
                  <Play className="mr-2 h-4 w-4" />
                  Run First Scan
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <Link key={scan.id} href={`/dashboard/scans/${scan.id}`}>
                <Card className="bg-surface-container ghost-border hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      {/* Left - Status and Date */}
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          scan.status === 'completed' ? 'bg-green-500/10' :
                          scan.status === 'failed' ? 'bg-red-500/10' :
                          'bg-blue-500/10'
                        }`}>
                          {scan.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {scan.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                          {scan.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                          {scan.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              Security Scan
                            </p>
                            {getStatusBadge(scan.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(scan.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Right - Stats */}
                      {scan.status === 'completed' && (
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${getScoreColor(scan.overall_score)}`}>
                              {scan.overall_score ?? '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {scan.total_users}
                            </p>
                            <p className="text-xs text-muted-foreground">Users</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                              <ShieldAlert className="h-4 w-4 text-orange-500" />
                              {(scan.dormant_accounts || 0) + 
                               (scan.no_mfa_accounts || 0) + 
                               (scan.over_privileged_accounts || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Issues</p>
                          </div>
                          {scan.benchmark_percentile && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                {scan.benchmark_percentile}%
                              </p>
                              <p className="text-xs text-muted-foreground">Percentile</p>
                            </div>
                          )}
                        </div>
                      )}

                      {scan.status === 'failed' && scan.error_message && (
                        <p className="text-sm text-red-500 max-w-xs truncate">
                          {scan.error_message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
