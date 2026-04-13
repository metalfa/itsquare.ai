'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Monitor,
  Cpu,
  Wifi,
  Clock,
  AlertTriangle,
  Activity,
} from 'lucide-react'

interface DeviceSnapshot {
  id: string
  slack_user_id: string
  os_name: string
  os_version: string
  ram_total_gb: number | null
  cpu_cores: number | null
  cpu_score: number | null
  download_speed_mbps: number | null
  latency_ms: number | null
  battery_level: number | null
  battery_charging: boolean | null
  raw_data: any
  created_at: string
}

export default function FleetHealthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState<DeviceSnapshot[]>([])

  useEffect(() => {
    async function loadDevices() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Get workspace
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!profile?.org_id) { setLoading(false); return }

      const { data: workspace } = await supabase
        .from('slack_workspaces')
        .select('id')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .single()

      if (!workspace) { setLoading(false); return }

      // Get latest snapshot per user
      const { data } = await supabase
        .from('device_health_snapshots' as any)
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (data) {
        // Deduplicate: keep latest per user
        const seen = new Set<string>()
        const unique: DeviceSnapshot[] = []
        for (const d of data as DeviceSnapshot[]) {
          if (!seen.has(d.slack_user_id)) {
            seen.add(d.slack_user_id)
            unique.push(d)
          }
        }
        setDevices(unique)
      }
      setLoading(false)
    }
    loadDevices()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="h-8 w-8 text-primary animate-pulse" />
      </div>
    )
  }

  // Fleet-wide stats
  const avgCpu = devices.filter(d => d.cpu_score != null).reduce((sum, d) => sum + d.cpu_score!, 0) / (devices.filter(d => d.cpu_score != null).length || 1)
  const avgSpeed = devices.filter(d => d.download_speed_mbps != null).reduce((sum, d) => sum + d.download_speed_mbps!, 0) / (devices.filter(d => d.download_speed_mbps != null).length || 1)
  const avgLatency = devices.filter(d => d.latency_ms != null).reduce((sum, d) => sum + d.latency_ms!, 0) / (devices.filter(d => d.latency_ms != null).length || 1)
  const criticalCount = devices.filter(d => (d.cpu_score != null && d.cpu_score < 40) || (d.download_speed_mbps != null && d.download_speed_mbps < 5)).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fleet Health</h1>
        <p className="text-muted-foreground">Real-time overview of all scanned devices in your organization</p>
      </div>

      {devices.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No devices scanned yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              When employees click &quot;Scan My Machine&quot; in Slack or use the CLI agent, their device data will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Fleet Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <FleetMetric icon={<Monitor />} label="Devices" value={devices.length} />
            <FleetMetric icon={<Cpu />} label="Avg CPU Score" value={`${Math.round(avgCpu)}/100`}
              status={avgCpu >= 70 ? 'good' : avgCpu >= 40 ? 'warn' : 'bad'} />
            <FleetMetric icon={<Wifi />} label="Avg Speed" value={`${Math.round(avgSpeed)} Mbps`}
              status={avgSpeed >= 20 ? 'good' : avgSpeed >= 5 ? 'warn' : 'bad'} />
            <FleetMetric icon={<Clock />} label="Avg Latency" value={`${Math.round(avgLatency)}ms`}
              status={avgLatency <= 100 ? 'good' : avgLatency <= 300 ? 'warn' : 'bad'} />
            <FleetMetric icon={<AlertTriangle />} label="Critical" value={criticalCount}
              status={criticalCount === 0 ? 'good' : 'bad'} />
          </div>

          {/* Device List */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">All Devices</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Platform</th>
                      <th className="px-4 py-3 font-medium">CPU</th>
                      <th className="px-4 py-3 font-medium">Network</th>
                      <th className="px-4 py-3 font-medium">Latency</th>
                      <th className="px-4 py-3 font-medium">RAM</th>
                      <th className="px-4 py-3 font-medium">Last Scan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {devices.map((device) => (
                      <DeviceRow key={device.id} device={device} />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function FleetMetric({ icon, label, value, status }: {
  icon: React.ReactNode; label: string; value: string | number; status?: 'good' | 'warn' | 'bad'
}) {
  const statusColor = status === 'good' ? 'text-green-600' : status === 'warn' ? 'text-amber-600' : status === 'bad' ? 'text-red-600' : 'text-foreground'
  return (
    <Card className="border-border/50">
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="p-2 bg-muted/50 rounded-lg mb-2 text-muted-foreground">{icon}</div>
        <p className={`text-xl font-bold ${statusColor}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function DeviceRow({ device }: { device: DeviceSnapshot }) {
  const cpuOk = device.cpu_score == null || device.cpu_score >= 60
  const speedOk = device.download_speed_mbps == null || device.download_speed_mbps >= 10
  const latencyOk = device.latency_ms == null || device.latency_ms <= 200
  const allGood = cpuOk && speedOk && latencyOk
  const hasCritical = (device.cpu_score != null && device.cpu_score < 40) || (device.download_speed_mbps != null && device.download_speed_mbps < 5)

  const scanAge = Date.now() - new Date(device.created_at).getTime()
  const daysAgo = Math.floor(scanAge / (1000 * 60 * 60 * 24))
  const timeStr = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{device.slack_user_id}</td>
      <td className="px-4 py-3 text-muted-foreground">{device.os_name || '?'} {device.os_version || ''}</td>
      <td className="px-4 py-3">
        {device.cpu_score != null ? (
          <span className={device.cpu_score >= 60 ? 'text-green-600' : device.cpu_score >= 40 ? 'text-amber-600' : 'text-red-600'}>
            {device.cpu_score}/100
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3">
        {device.download_speed_mbps != null ? (
          <span className={device.download_speed_mbps >= 20 ? 'text-green-600' : device.download_speed_mbps >= 5 ? 'text-amber-600' : 'text-red-600'}>
            {Math.round(device.download_speed_mbps)} Mbps
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3">
        {device.latency_ms != null ? (
          <span className={device.latency_ms <= 100 ? 'text-green-600' : device.latency_ms <= 300 ? 'text-amber-600' : 'text-red-600'}>
            {device.latency_ms}ms
          </span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {device.ram_total_gb ? `${device.ram_total_gb}GB` : '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{timeStr}</td>
      <td className="px-4 py-3">
        {hasCritical ? (
          <Badge variant="destructive" className="text-xs">Critical</Badge>
        ) : allGood ? (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">Healthy</Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">Warning</Badge>
        )}
      </td>
    </tr>
  )
}
