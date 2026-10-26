'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Server } from '@/types/database'
import { useEffect, useState } from 'react'

type Props = {
  userId: string
  username: string
}

export default function Sidebar({ userId, username }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [myServers, setMyServers] = useState<Server[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('server_members')
        .select('servers(*)')
        .eq('user_id', userId)

      if (data) {
        const servers = data
          .map((row: any) => row.servers)
          .filter(Boolean) as Server[]
        setMyServers(servers)
      }
    }
    load()

    // Re-fetch when membership changes
    const channel = supabase
      .channel('membership-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'server_members', filter: `user_id=eq.${userId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-[72px] md:w-60 bg-[#0b0d12] border-r border-line flex flex-col">
      {/* Logo / Rail */}
      <div className="p-3 border-b border-line flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#a391ff] to-[#657dff] flex items-center justify-center font-black text-xl shrink-0">
          V
        </div>
        <div className="hidden md:block">
          <div className="font-bold text-lg leading-tight">
            VR<span className="text-purple">Circle</span>
          </div>
          <div className="text-xs text-muted">@{username}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-2 space-y-1">
        <Link
          href="/discover"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
            pathname === '/discover'
              ? 'bg-panel2 text-white'
              : 'text-muted hover:bg-panel2 hover:text-white'
          }`}
        >
          <span className="text-lg">⌕</span>
          <span className="hidden md:inline">Discover</span>
        </Link>
      </nav>

      {/* My Servers */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-[10px] font-bold tracking-widest text-[#858da6] px-3 py-2 hidden md:block">
          YOUR SERVERS
        </div>
        {myServers.length === 0 ? (
          <p className="text-xs text-muted px-3 py-2 hidden md:block">
            Join a server to see it here.
          </p>
        ) : (
          myServers.map((s) => (
            <Link
              key={s.id}
              href={`/server/${s.id}`}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition mb-0.5 ${
                pathname === `/server/${s.id}`
                  ? 'bg-panel2 text-white'
                  : 'text-muted hover:bg-panel2 hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#383252] flex items-center justify-center text-lg shrink-0">
                {s.icon || '🎮'}
              </div>
              <span className="hidden md:block truncate">{s.name}</span>
            </Link>
          ))
        )}
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-line">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-panel2 hover:text-white transition"
        >
          <span>⎋</span>
          <span className="hidden md:inline">Log out</span>
        </button>
      </div>
    </aside>
  )
}
