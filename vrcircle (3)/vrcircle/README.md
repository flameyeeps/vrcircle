# VRCircle — VR Gaming Communities Platform

A real, online Discord-style social platform for VR gamers.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Database, Realtime)

---

## What works right now

| Feature | Status |
|---------|--------|
| User registration & login | ✅ Working |
| Create public servers | ✅ Working |
| Discover / search public servers | ✅ Working |
| Join servers (no invite needed) | ✅ Working |
| Leave servers | ✅ Working |
| Server appears in sidebar after join | ✅ Working |
| Real-time text chat | ✅ Working (Supabase Realtime) |
| Multiple text channels (#general, #looking-for-group, #clips-and-screenshots) | ✅ Working |
| Member counts update automatically | ✅ Working |
| Persistent data across devices | ✅ Working (once Supabase is connected) |
| Responsive design (desktop / tablet / phone) | ✅ Working |
| Row Level Security policies | ✅ Included |
| Voice chat | ❌ Not implemented (architecture ready – see below) |

---

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deployment) or any Node host

---

## 2. Create the Supabase project

1. Go to https://supabase.com → New Project
2. Note your **Project URL** and **anon public key** (Settings → API)
3. Open the **SQL Editor** and paste the entire contents of  
   `supabase/migrations/001_initial_schema.sql`  
   then click **Run**.
4. (Recommended) In Authentication → Settings:
   - Disable “Confirm email” for faster testing, **or** keep it enabled for production.
5. In Database → Replication, make sure the `messages` table is added to the `supabase_realtime` publication (the migration already does this).

---

## 3. Local setup

```bash
# Clone / download the project
cd vrcircle

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000

---

## 4. Project structure

```
vrcircle/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # redirects based on auth
│   ├── globals.css
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── discover/
│   │   ├── page.tsx             # server component
│   │   └── DiscoverClient.tsx   # client UI + join logic
│   └── server/[id]/
│       ├── page.tsx
│       └── ServerClient.tsx     # chat + channels + realtime
├── components/
│   ├── Sidebar.tsx
│   └── CreateServerModal.tsx
├── lib/supabase/
│   ├── client.ts                # browser client
│   ├── server.ts                # server client
│   └── middleware.ts
├── types/database.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql   # full schema + RLS + triggers
├── middleware.ts
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 5. Deploy to Vercel (public website)

1. Push the project to a GitHub repository.
2. Go to https://vercel.com → New Project → Import the repo.
3. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

Your site will be live at `https://your-project.vercel.app`.

Multiple people on different devices can now register, create servers, join, and chat in real time.

---

## 6. Testing checklist

- [ ] Register a new account
- [ ] Log out and log back in
- [ ] Click **Create server** → modal opens
- [ ] Submit the form → server is created and you enter it
- [ ] The new server appears in the public Discover page
- [ ] From another account / browser, search for and **Join** the server
- [ ] Joined server appears in the left sidebar
- [ ] Open the server → see #general, #looking-for-group, #clips-and-screenshots
- [ ] Send a message → it appears instantly for other members (open two browsers)
- [ ] Refresh the page → messages are still there
- [ ] Leave the server → it disappears from the sidebar
- [ ] Member count updates correctly

---

## 7. Voice chat (future)

The schema already supports `type = 'voice'` channels.

To add real-time voice you would typically use:

- **LiveKit** (recommended, open-source, free tier)
- **Daily.co**
- **Agora**
- or **WebRTC** with a custom SFU

Architecture sketch:

1. Create a voice channel (already possible in the DB).
2. When a user joins a voice channel, request a LiveKit token from a Next.js API route (using the LiveKit server SDK + your secret key – **never** expose the secret to the client).
3. Connect the LiveKit client SDK in the browser.
4. Show a “Voice Connected” indicator and mute/deafen controls.

This is intentionally **not** implemented yet so that nothing pretends to work.

---

## 8. Security notes

- All sensitive operations are protected by **Row Level Security** policies.
- The anon key is safe to use in the browser; it only allows what the policies permit.
- Never put the `service_role` key in frontend code or in `NEXT_PUBLIC_` variables.
- Message length is limited to 1000 characters.
- Username validation and unique constraints are enforced in the database.

---

## 9. Seed data (optional)

After the schema is applied you can manually insert a few public servers in the Supabase Table Editor, or run:

```sql
-- Example (replace the owner_id with a real user UUID after registering)
insert into public.servers (name, game, description, icon, owner_id)
values
  ('Gorilla Tag Hangout', 'Gorilla Tag', 'Find people to play with and share clips.', '🐒', 'YOUR-USER-UUID'),
  ('VRChat Social Club', 'VRChat', 'Meet friends and explore worlds.', '🌌', 'YOUR-USER-UUID');
```

---

## License

MIT – free to use and modify for your own projects.
