'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import CreateServerModal from '@/components/CreateServerModal'
import { createClient } from '@/lib/supabase/client'
import { Server } from '@/types/database'

type Props = {
  userId: string
  username: string
  servers: Server[]
  joinedIds: string[]
}

export default function DiscoverClient({
  userId,
  username,
  servers: initialServers,
  joinedIds: initialJoined,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [servers, setServers] = useState(initialServers)
  const [joinedIds, setJoinedIds] = useState(new Set(initialJoined))
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [joining, setJoining] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return servers
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.game.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
    )
  }, [servers, search])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleJoin(serverId: string) {
    if (joinedIds.has(serverId) || joining) return
    setJoining(serverId)

    const { error } = await supabase.from('server_members').insert({
      server_id: serverId,
      user_id: userId,
      role: 'member',
    })

    if (error) {
      // Already a member is fine
      if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
        showToast('Failed to join: ' + error.message)
        setJoining(null)
        return
      }
    }

    setJoinedIds((prev) => new Set(prev).add(serverId))
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, member_count: s.member_count + 1 } : s
      )
    )
    setJoining(null)
    showToast('Joined server!')
    router.push(`/server/${serverId}`)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userId={userId} username={username} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-[70px] border-b border-line flex items-center justify-between px-4 md:px-6 shrink-0">
          <div>
            <h1 className="text-lg font-semibold">Discover communities</h1>
            <p className="text-xs text-muted">Public VR gaming servers</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-purple hover:bg-[#7a6aef] text-white font-bold px-4 py-2 rounded-lg text-sm"
          >
            ＋ Create server
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-7">
            {/* Hero */}
            <div className="rounded-2xl border border-[#40395e] p-6 md:p-8 mb-7 bg-gradient-to-br from-[#242039] to-[#191c26]">
              <div className="text-[#c7beff] text-xs font-black uppercase tracking-wider mb-2">
                Your next VR squad starts here
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-3">
                Find your people.
                <br />
                Enter another world.
              </h2>
              <p className="text-[#c3c7d8] max-w-xl mb-5">
                Discover public VR gaming communities, meet players, and create a
                server for your own group. Anyone can join public servers without
                an invite.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => document.getElementById('search')?.focus()}
                  className="bg-purple hover:bg-[#7a6aef] text-white font-bold px-4 py-2.5 rounded-lg text-sm"
                >
                  Explore servers ↓
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-panel2 border border-line hover:bg-[#2e3345] text-white font-medium px-4 py-2.5 rounded-lg text-sm"
                >
                  ＋ Create server
                </button>
              </div>
            </div>

            {/* Search + list */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold">Public servers</h3>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search servers or games…"
                className="w-full sm:w-72 bg-panel border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="border border-dashed border-line rounded-xl p-10 text-center text-muted">
                No servers found. Try a different search or create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map((s) => {
                  const isJoined = joinedIds.has(s.id)
                  return (
                    <article
                      key={s.id}
                      className="bg-panel border border-line rounded-2xl p-4 flex flex-col min-h-[180px]"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-[#383252] flex items-center justify-center text-xl shrink-0">
                          {s.icon || '🎮'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold truncate">{s.name}</h4>
                          <p className="text-xs text-muted truncate">{s.game}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#c0c5d6] flex-1 line-clamp-3 mb-3">
                        {s.description || 'A public VR gaming community.'}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-green">
                          ● {s.member_count} members
                        </span>
                        {isJoined ? (
                          <button
                            onClick={() => router.push(`/server/${s.id}`)}
                            className="bg-panel2 border border-line hover:bg-[#2e3345] text-sm font-medium px-3 py-1.5 rounded-lg"
                          >
                            Open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoin(s.id)}
                            disabled={joining === s.id}
                            className="bg-purple hover:bg-[#7a6aef] disabled:opacity-60 text-sm font-bold px-3 py-1.5 rounded-lg"
                          >
                            {joining === s.id ? 'Joining…' : 'Join server'}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateServerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
      />

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#282d3b] border border-[#454c60] px-5 py-3 rounded-xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
