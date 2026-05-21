# DevBlog

Terminal-styled developer blogging platform with markdown editing, draft management, slug-based routing, reading time estimates, and public author profile feeds. Sign in with GitHub to write and publish posts backed by Supabase. Part of the **DevEco** ecosystem — twelve connected developer tools, one unified Supabase backend.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Auth + DB | Supabase (GitHub OAuth + Postgres) |
| Icons | React Icons (Remix set) |
| Font | JetBrains Mono |

---

## Features

- **Markdown editor** — write posts in full markdown with excerpt and tag support
- **Draft management** — save as draft or publish instantly; toggle anytime
- **Slug-based routing** — posts live at `/@username/post-slug`
- **Reading time** — auto-calculated words-per-minute estimate on every post
- **Tag filtering** — browse the feed by topic tags
- **Author feeds** — per-author post listing at `/@username`
- **Public feed** — featured + recent posts on the home feed, no login required to read
- **Single-login SSO** — shared auth with the DevFolio ecosystem, no re-login required

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DEVFOLIO_URL=https://your-devfolio-url.vercel.app
```

### Supabase setup

1. Run the shared `schema.sql` from the DevFolio repo in the Supabase SQL Editor
2. Enable GitHub provider in **Authentication → Providers**
3. Add `http://localhost:3001/api/auth/callback` to **Authentication → URL Configuration → Redirect URLs**

---

## Routes

| Route | Description |
|---|---|
| `/` | Public post feed — featured + recent posts |
| `/[username]/[slug]` | Individual published post |
| `/write` | New post markdown editor (auth required) |
| `/drafts` | Manage your draft and published posts (auth required) |
| `/api/auth/callback` | OAuth callback — redeems SSO ticket or exchanges code |

---

## Project Structure

```
DevBlog/
├── app/
│   ├── layout.tsx               # root layout — fonts, navbar
│   ├── page.tsx                 # public post feed
│   ├── globals.css              # design tokens
│   ├── write/page.tsx           # post editor
│   ├── drafts/page.tsx          # draft management
│   ├── [username]/
│   │   ├── page.tsx             # author profile + post list
│   │   └── [slug]/page.tsx      # individual post view
│   └── api/auth/
│       └── callback/route.ts    # SSO ticket redemption + OAuth callback
├── components/
│   ├── layout/                  # Navbar
│   └── auth/                    # AuthButton
├── lib/
│   ├── supabase.ts              # browser Supabase client
│   ├── supabase-server.ts       # server Supabase client (cookie-based)
│   └── db.ts                    # blog post CRUD — Supabase queries
├── middleware.ts                 # session refresh on every request
```

---

## DevEco Ecosystem

DevBlog is part of a twelve-app ecosystem sharing one Supabase project and one GitHub login.

| App | Description |
|---|---|
| **DevFolio** | Developer portfolio hub — central auth provider |
| **DevBlog** | Write & publish dev posts — this repo |
| **DevResume** | Generate PDF resume |
| **DevRoadmap** | Skill learning tracks |
| **DevCalendar** | Schedule & goals |
| **DevTimer** | Pomodoro focus timer |
| **DevNotes** | Markdown notes |
| **DevStatus** | Project status pages |
| **DevEnv** | Environment vault |
| **DevWidgets** | Embeddable widgets |
| **DevShare** | Share & showcase code snippets |
| **DevPulse** | Dev activity & pulse tracker |

---

## Design System

Terminal / Linux / GitHub-inspired aesthetic.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#05070F` | scaffold background |
| `surface` | `#0B1020` | nav, cards |
| `neon-cyan` | `#00E5FF` | primary accents |
| `neon-green` | `#00FFA3` | success, `$` prompt |
| `neon-blue` | `#4D8CFF` | author handle, links |
| `neon-purple` | `#8A5BFF` | tag accents |
| `neon-red` | `#FF3D71` | errors, destructive |
| `neon-amber` | `#FFB547` | warnings |

---

## Roadmap

- [x] Public post feed with featured + recent sections
- [x] Markdown editor with excerpt and tag support
- [x] Draft / publish toggle
- [x] Slug-based author routing
- [x] Reading time estimate
- [x] Supabase backend with RLS
- [x] SSO with DevFolio ecosystem
- [ ] Markdown preview while writing
- [ ] RSS feed endpoint
- [ ] Comment system

---

## License

MIT