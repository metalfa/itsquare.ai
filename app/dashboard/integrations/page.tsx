import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { IntegrationsContent } from './integrations-content'

export const metadata = {
  title: 'Integrations | ITSquare.AI',
  description: 'Connect your tools to supercharge IT support',
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

  // Get Slack workspace for this org - use admin client to bypass RLS
  const adminSupabase = createAdminClient()
  const { data: slackWorkspace } = await adminSupabase
    .from('slack_workspaces')
    .select('id, team_id, team_name, team_domain, status, installed_at')
    .eq('org_id', profile?.org_id)
    .eq('status', 'active')
    .single()

  return (
    <IntegrationsContent 
      user={user} 
      profile={profile ? {
        full_name: profile.full_name,
        organization: profile.organization ? {
          name: profile.organization.name
        } : null
      } : null}
      slackWorkspace={slackWorkspace}
    />
  )
}
