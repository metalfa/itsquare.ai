import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  // Get Slack workspace - use admin client to bypass RLS
  const adminSupabase = createAdminClient()
  const { data: slackWorkspace } = await adminSupabase
    .from('slack_workspaces')
    .select('id, team_id, team_name, team_domain, status')
    .eq('org_id', profile?.org_id)
    .eq('status', 'active')
    .single()

  // Get conversation stats (from it_conversations table)
  const { count: totalConversations } = await adminSupabase
    .from('it_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', slackWorkspace?.id)

  const { count: resolvedConversations } = await adminSupabase
    .from('it_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', slackWorkspace?.id)
    .eq('status', 'resolved')

  // Get recent conversations
  const { data: recentConversations } = await adminSupabase
    .from('it_conversations')
    .select(`
      id,
      messages,
      status,
      created_at,
      slack_user:slack_users(display_name)
    `)
    .eq('workspace_id', slackWorkspace?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get unique active users this month
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: activeUsersData } = await adminSupabase
    .from('it_conversations')
    .select('slack_user_id')
    .eq('workspace_id', slackWorkspace?.id)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const uniqueActiveUsers = new Set(activeUsersData?.map(c => c.slack_user_id) || []).size

  // Format conversations for display
  const formattedConversations = recentConversations?.map(convo => {
    // Extract the first user message as the "problem"
    const messages = convo.messages as Array<{role: string, content: string}> | null
    const firstUserMessage = messages?.find(m => m.role === 'user')?.content || 'IT support request'
    
    return {
      id: convo.id,
      problem: firstUserMessage.slice(0, 100) + (firstUserMessage.length > 100 ? '...' : ''),
      status: convo.status,
      created_at: convo.created_at,
      user_name: (convo.slack_user as any)?.display_name || null
    }
  }) || []

  return (
    <DashboardContent
      user={user}
      profile={profile ? {
        full_name: profile.full_name,
        organization: profile.organization ? {
          name: profile.organization.name,
          subscription_tier: profile.organization.subscription_tier
        } : null
      } : null}
      slackWorkspace={slackWorkspace}
      stats={{
        totalConversations: totalConversations || 0,
        resolvedByAI: resolvedConversations || 0,
        avgResponseTime: 3, // Placeholder - would need to calculate from actual data
        activeUsers: uniqueActiveUsers
      }}
      recentConversations={formattedConversations}
    />
  )
}
