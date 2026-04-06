import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/login')
  }

  // Fetch user profile with organization
  const { data: profile } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  // Fetch recent scans
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')

  return (
    <DashboardContent
      user={user}
      profile={profile}
      scans={scans || []}
      integrations={integrations || []}
    />
  )
}
