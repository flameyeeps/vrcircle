import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ServerClient from './ServerClient'

export const dynamic = 'force-dynamic'

export default async function ServerPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check membership
  const { data: membership } = await supabase
    .from('server_members')
    .select('role')
    .eq('server_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Not a member – try to auto-join if public
    const { data: server } = await supabase
      .from('servers')
      .select('*')
      .eq('id', params.id)
      .eq('is_public', true)
      .single()

    if (!server) {
      notFound()
    }

    // Auto join
    await supabase.from('server_members').insert({
      server_id: params.id,
      user_id: user.id,
      role: 'member',
    })
  }

  // Load server
  const { data: server } = await supabase
    .from('servers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!server) notFound()

  // Load channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .eq('server_id', params.id)
    .eq('type', 'text')
    .order('position')

  // Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ServerClient
      userId={user.id}
      username={profile?.username || 'user'}
      displayName={profile?.display_name || profile?.username || 'User'}
      server={server}
      channels={channels || []}
      role={membership?.role || 'member'}
    />
  )
}
