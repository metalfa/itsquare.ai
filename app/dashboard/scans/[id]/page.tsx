import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ScanDetailContent } from './scan-detail-content'

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!userData?.org_id) {
    redirect('/dashboard')
  }

  // Get the scan (verify it belongs to user's org)
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .eq('org_id', userData.org_id)
    .single()

  if (scanError || !scan) {
    notFound()
  }

  // Get findings for this scan
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('scan_id', id)
    .order('severity', { ascending: true })

  return (
    <ScanDetailContent 
      scan={scan} 
      findings={findings || []}
      organization={userData.organization}
    />
  )
}
