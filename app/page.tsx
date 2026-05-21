import Link from 'next/link';
import { getPublishedPosts, readingTime, type Post } from '@/lib/db';
import { RiTimeLine, RiArrowRightLine } from 'react-icons/ri';

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const authorUser = post.author?.username ?? 'unknown';
  return (
    <Link href={`/${authorUser}/${post.slug}`}
      className={`term-card block hover:glow-blue transition-all group ${featured ? 'glow-cyan' : ''}`}>
      <div className="term-card-header">
        <span className="text-[var(--color-neon-blue)] truncate">@{authorUser}</span>
        <span className="text-[var(--color-text-dim)]">{post.published_at?.split('T')[0] ?? ''}</span>
      </div>
      <div className="term-card-body space-y-3">
        <h2 className={`font-bold leading-snug group-hover:text-[var(--color-neon-cyan)] transition-colors ${featured ? 'text-xl' : 'text-base'}`}>
          {post.title}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)]">{t}</span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-dim)] shrink-0">
            <span className="flex items-center gap-1"><RiTimeLine size={11} />{readingTime(post.content_md)}m</span>
            <RiArrowRightLine size={13} className="group-hover:text-[var(--color-neon-cyan)] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function FeedPage() {
  const posts = await getPublishedPosts();
  const allTags = [...new Set(posts.flatMap(p => p.tags))];
  const [featured, ...rest] = posts;

  return (
    <div className="container-app py-10 space-y-8">
      <div>
        <div className="text-xs text-[var(--color-text-muted)]">
          <span className="text-[var(--color-neon-green)]">$</span> cat ~/latest-posts
        </div>
        <h1 className="text-3xl font-bold mt-2">Developer Blog<span className="caret" /></h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">Writing about Next.js, Flutter, Supabase, DevOps, and building in public.</p>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map(t => (
            <span key={t} className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)] cursor-pointer transition-colors">{t}</span>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="term-card text-center py-16">
          <div className="text-[var(--color-text-dim)] text-sm mb-2">$ cat posts.log — no posts yet</div>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Be the first to write a post.</p>
          <Link href="/write" className="text-xs text-[var(--color-neon-blue)] hover:underline">$ write a post →</Link>
        </div>
      ) : (
        <>
          {featured && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">// featured</div>
              <PostCard post={featured} featured />
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">// recent posts</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {rest.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
