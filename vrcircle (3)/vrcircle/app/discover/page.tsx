import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DiscoverClient from './DiscoverClient'

export const dynamic = 'force-dynamic'

export default async function DiscoverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get all public servers
  const { data: servers } = await supabase
    .from('servers')
    .select('*')
    .eq('is_public', true)
    .order('member_count', { ascending: false })

  // Get user's memberships
  const { data: memberships } = await supabase
    .from('server_members')
    .select('server_id')
    .eq('user_id', user.id)

  const joinedIds = new Set((memberships || []).map((m) => m.server_id))

  return (
    <DiscoverClient
      userId={user.id}
      username={profile?.username || 'user'}
      servers={servers || []}
      joinedIds={Array.from(joinedIds)}
    />
  )
}
