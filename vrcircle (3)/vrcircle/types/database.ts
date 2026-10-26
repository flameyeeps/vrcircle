export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Server = {
  id: string
  name: string
  description: string
  game: string
  icon: string
  owner_id: string
  member_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export type ServerMember = {
  id: string
  server_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export type Channel = {
  id: string
  server_id: string
  name: string
  type: 'text' | 'voice'
  position: number
  created_at: string
}

export type Message = {
  id: string
  channel_id: string
  user_id: string | null
  content: string
  created_at: string
  profiles?: {
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

export type ServerWithMembership = Server & {
  is_member?: boolean
  role?: string
}
