'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  open: boolean
  onClose: () => void
  userId: string
}

const ICONS = ['🎮', '🌌', '🕹️', '🚀', '👾', '🐒', '🎵', '🎯', '🛠️', '☕']

export default function CreateServerModal({ open, onClose, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🎮')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim() || !game.trim()) {
      setError('Server name and game/category are required.')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('servers')
      .insert({
        name: name.trim(),
        game: game.trim(),
        description: description.trim() || 'A public VR gaming community.',
        icon,
        owner_id: userId,
        is_public: true,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Reset form
    setName('')
    setGame('')
    setDescription('')
    setIcon('🎮')
    setLoading(false)
    onClose()

    // Go straight into the new server
    router.push(`/server/${data.id}`)
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-panel border border-line rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-1">Create a public server</h2>
        <p className="text-sm text-muted mb-5">
          Anyone can discover and join your server.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 outline-none focus:border-purple"
              placeholder="My VR Community"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Game or Category
            </label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              maxLength={50}
              required
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 outline-none focus:border-purple"
              placeholder="Gorilla Tag, VRChat, Beat Saber…"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={180}
              rows={3}
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 outline-none focus:border-purple resize-none"
              placeholder="What is your community about?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                    icon === i
                      ? 'bg-purple ring-2 ring-purple/50'
                      : 'bg-panel2 hover:bg-[#2e3345]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-panel2 border border-line text-sm font-medium hover:bg-[#2e3345]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-purple hover:bg-[#7a6aef] disabled:opacity-60 text-sm font-bold"
            >
              {loading ? 'Creating…' : 'Create server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
