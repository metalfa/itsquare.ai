import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScansContent } from './scans-content'

export default async function ScansPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!userData?.org_id) {
    redirect('/dashboard')
  }

  // Get scans for this organization
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('org_id', userData.org_id)
    .order('created_at', { ascending: false })

  // Get integrations to check if scan can be run
  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, provider, status')
    .eq('org_id', userData.org_id)
    .eq('status', 'active')

  return (
    <ScansContent 
      scans={scans || []} 
      hasActiveIntegrations={(integrations?.length || 0) > 0}
      organization={userData.organization}
    />
  )
}
