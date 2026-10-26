'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/lib/supabase/client'
import { Server, Channel, Message } from '@/types/database'

type Props = {
  userId: string
  username: string
  displayName: string
  server: Server
  channels: Channel[]
  role: string
}

export default function ServerClient({
  userId,
  username,
  displayName,
  server,
  channels,
  role,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeChannel, setActiveChannel] = useState<Channel | null>(
    channels[0] || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load messages + subscribe to realtime
  useEffect(() => {
    if (!activeChannel) return

    let cancelled = false

    async function load() {
      setLoadingMsgs(true)
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(username, display_name, avatar_url)')
        .eq('channel_id', activeChannel!.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!cancelled) {
        setMessages(data || [])
        setLoadingMsgs(false)
      }
    }

    load()

    const channel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(username, display_name, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [activeChannel, supabase])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !activeChannel || sending) return
    if (text.length > 1000) {
      showToast('Message too long (max 1000 characters)')
      return
    }

    setSending(true)
    setInput('')

    const { error } = await supabase.from('messages').insert({
      channel_id: activeChannel.id,
      user_id: userId,
      content: text,
    })

    if (error) {
      showToast('Failed to send: ' + error.message)
      setInput(text) // restore
    }
    setSending(false)
  }

  async function handleLeave() {
    if (!confirm('Leave this server?')) return

    const { error } = await supabase
      .from('server_members')
      .delete()
      .eq('server_id', server.id)
      .eq('user_id', userId)

    if (error) {
      showToast('Failed to leave: ' + error.message)
      return
    }

    showToast('You left the server')
    router.push('/discover')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userId={userId} username={username} />

      <div className="flex-1 min-w-0 flex">
        {/* Channels sidebar */}
        <aside className="w-52 bg-[#141720] border-r border-line flex flex-col shrink-0 hidden sm:flex">
          <div className="p-4 border-b border-line">
            <div className="font-bold truncate">{server.name}</div>
            <div className="text-xs text-muted">{server.game}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-[10px] font-bold tracking-widest text-[#858da6] px-2 mb-2">
              TEXT CHANNELS
            </div>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-sm mb-0.5 transition ${
                  activeChannel?.id === ch.id
                    ? 'bg-panel2 text-white'
                    : 'text-muted hover:bg-panel2 hover:text-white'
                }`}
              >
                # {ch.name}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-line">
            <button
              onClick={handleLeave}
              className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-muted hover:bg-red-500/10 hover:text-red-300 transition"
            >
              Leave server
            </button>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[70px] border-b border-line flex items-center px-4 md:px-6 shrink-0">
            <h2 className="font-semibold">
              # {activeChannel?.name || 'general'}
              <span className="text-muted font-normal text-sm ml-2 hidden sm:inline">
                · {server.name}
              </span>
            </h2>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {loadingMsgs ? (
              <div className="text-center text-muted py-10">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted py-10">
                <div className="text-3xl mb-2">👋</div>
                <div className="font-semibold text-white">Welcome to the server!</div>
                <p className="text-sm mt-1">Say hello in #{activeChannel?.name}.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#3b3459] flex items-center justify-center text-sm font-bold shrink-0">
                    {(m.profiles?.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">
                        {m.profiles?.display_name || m.profiles?.username || 'Unknown'}
                      </span>
                      <time className="text-[11px] text-[#858da6]">
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="text-sm text-[#e0e3ef] whitespace-pre-wrap break-words mt-0.5">
                      {m.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-line flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder={`Message #${activeChannel?.name || 'general'}…`}
              className="flex-1 bg-panel border border-line rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple"
              disabled={!activeChannel}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-purple hover:bg-[#7a6aef] disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-lg text-sm"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#282d3b] border border-[#454c60] px-5 py-3 rounded-xl text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
