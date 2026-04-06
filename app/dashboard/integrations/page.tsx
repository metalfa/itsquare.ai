import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IntegrationsContent } from './integrations-content'

export const metadata = {
  title: 'Integrations | ITSquare.AI',
  description: 'Connect your identity providers to scan for security risks',
}

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  // Get integrations for this org
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('org_id', profile?.org_id)
    .order('connected_at', { ascending: false })

  return (
    <IntegrationsContent 
      user={user} 
      profile={profile}
      integrations={integrations || []}
    />
  )
}
