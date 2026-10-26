'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (username.length < 3 || username.length > 24) {
      setError('Username must be 3–24 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          display_name: username,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Auto sign-in after register (if email confirmation is disabled in Supabase)
    router.push('/discover')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#a391ff] to-[#657dff] text-2xl font-black mb-4">
            V
          </div>
          <h1 className="text-3xl font-bold">
            VR<span className="text-purple">Circle</span>
          </h1>
          <p className="text-muted mt-2">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="bg-panel border border-line rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 text-white outline-none focus:border-purple"
              placeholder="coolvrplayer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 text-white outline-none focus:border-purple"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#11141b] border border-line rounded-lg px-3 py-2.5 text-white outline-none focus:border-purple"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple hover:bg-[#7a6aef] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-purple hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
