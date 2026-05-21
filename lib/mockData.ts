export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: { username: string; name: string; bio: string };
  tags: string[];
  publishedAt: string;
  readingTime: number;
};

export const POSTS: Post[] = [
  {
    id: '1',
    slug: 'building-devfolio-with-nextjs',
    title: 'Building a Terminal-Aesthetic Portfolio with Next.js 16',
    excerpt: 'How I built a developer portfolio that looks like a Linux terminal — and why the dark neon aesthetic is more than just aesthetics.',
    content: `# Building a Terminal-Aesthetic Portfolio with Next.js 16

When I decided to rebuild my portfolio, I had one goal: make it feel like home for a developer.

## The Design Philosophy

Most developer portfolios look like marketing websites. Clean, corporate, designed to impress non-technical recruiters. But I wanted something different — something that felt like the tools I use every day.

The terminal aesthetic wasn't just a style choice. It was a statement: this portfolio is *for developers, by a developer*.

## The Tech Stack

\`\`\`bash
$ npx create-next-app@latest devfolio --typescript --tailwind
\`\`\`

- **Next.js 16** with App Router — server components for fast initial loads
- **Tailwind CSS 4** — the new @theme directive is a game changer
- **Framer Motion** — smooth animations without fighting CSS
- **React Icons** — Remix Icon set for that clean monoline look

## The Terminal Card Component

The core UI primitive is the \`TerminalCard\` — a bordered card with the iconic \`● ● ●\` window chrome:

\`\`\`css
.term-card::before {
  content: "● ● ●";
  position: absolute;
  top: 8px;
  left: 12px;
  letter-spacing: 4px;
  color: var(--color-text-dim);
}
\`\`\`

## Live GitHub Data

The portfolio fetches real GitHub data on every request (with 1hr cache):

\`\`\`ts
export async function fetchGithubUser(username: string) {
  const res = await fetch(\`https://api.github.com/users/\${username}\`, {
    next: { revalidate: 3600 }
  });
  return res.ok ? res.json() : null;
}
\`\`\`

## What's Next

This is phase 1. Phase 2 adds Supabase auth + a full ecosystem of connected dev tools.`,
    author: { username: 'DarkWizardCK-24', name: 'Chaitanya Katare', bio: 'Full-stack dev building a developer-tools ecosystem. Flutter + Next.js.' },
    tags: ['Next.js', 'TypeScript', 'Design'],
    publishedAt: '2026-05-09',
    readingTime: 5,
  },
  {
    id: '2',
    slug: 'supabase-rls-multi-tenant',
    title: 'Row-Level Security in Supabase: A Practical Guide',
    excerpt: 'RLS policies look intimidating. Here\'s how I learned to think about them — and the patterns that work for multi-tenant developer tools.',
    content: `# Row-Level Security in Supabase: A Practical Guide

RLS (Row-Level Security) is one of those things that feels like magic once it clicks.

## What is RLS?

RLS lets you define *who can see which rows* at the database level. No application-layer filtering needed.

\`\`\`sql
-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "users see own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
\`\`\`

## The Core Pattern

Every policy asks one question: **does the requesting user have permission to touch this row?**

\`\`\`sql
-- Users can only update their own snippets
CREATE POLICY "users update own snippets"
  ON snippets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
\`\`\`

## Public Read, Authenticated Write

This pattern covers most developer tools:

\`\`\`sql
-- Anyone can read published posts
CREATE POLICY "public read posts"
  ON posts FOR SELECT
  USING (published = true);

-- Only author can write
CREATE POLICY "author write posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);
\`\`\`

## Debugging RLS

RLS policies fail silently by design. Use \`EXPLAIN\` to debug:

\`\`\`sql
SET role = authenticated;
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
EXPLAIN SELECT * FROM profiles;
\`\`\``,
    author: { username: 'DarkWizardCK-24', name: 'Chaitanya Katare', bio: 'Full-stack dev building a developer-tools ecosystem.' },
    tags: ['Supabase', 'PostgreSQL', 'Backend'],
    publishedAt: '2026-05-07',
    readingTime: 7,
  },
  {
    id: '3',
    slug: 'flutter-state-management-2026',
    title: 'Flutter State Management in 2026: What Actually Works',
    excerpt: 'After building 5 production Flutter apps, here\'s my honest take on Riverpod, Bloc, and the new patterns that are changing how we think about state.',
    content: `# Flutter State Management in 2026: What Actually Works

I've tried them all. Provider, Bloc, GetX, Riverpod, MobX. Here's what I actually use in production.

## The Short Answer

**Riverpod 2.x** for most apps. **Bloc** when you need explicit state machines.

## Riverpod: Why It Won

\`\`\`dart
// Define a provider
final userProvider = FutureProvider.family<User, String>((ref, userId) async {
  final repo = ref.watch(userRepositoryProvider);
  return repo.getUser(userId);
});

// Use it in a widget
class UserProfile extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider(userId));
    return user.when(
      data: (u) => Text(u.name),
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }
}
\`\`\`

## When to Use Bloc

Bloc shines when your state has complex transitions that need to be explicit and testable:

\`\`\`dart
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<LogoutRequested>(_onLogoutRequested);
  }
}
\`\`\`

## The Rule of Thumb

- **UI state** (loading, errors) → Riverpod AsyncValue
- **Complex flows** (auth, checkout) → Bloc
- **Simple shared state** → Riverpod StateNotifier
- **Local widget state** → plain \`setState\``,
    author: { username: 'DarkWizardCK-24', name: 'Chaitanya Katare', bio: 'Flutter dev since 2019.' },
    tags: ['Flutter', 'Dart', 'State Management'],
    publishedAt: '2026-05-05',
    readingTime: 8,
  },
];
