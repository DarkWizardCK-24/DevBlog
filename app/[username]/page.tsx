import Link from 'next/link';
import { getPostsByAuthor, readingTime } from '@/lib/db';
import { notFound } from 'next/navigation';
import { RiArrowLeftLine, RiExternalLinkLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri';

export default async function AuthorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const posts = await getPostsByAuthor(username);
  if (posts.length === 0) notFound();

  const author = posts[0].author;

  return (
    <div className="container-app py-10 space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
          <RiArrowLeftLine size={13} /> $ ls /blog
        </Link>
      </div>

      {/* Author card */}
      <div className="term-card" style={{ boxShadow: '0 0 32px rgba(77,140,255,0.15)' }}>
        <div className="term-card-header" style={{ color: 'var(--color-neon-cyan)' }}>
          <span>$ whoami — @{username}</span>
        </div>
        <div className="term-card-body flex items-center gap-4">
          {author?.avatar_url && (
            <img src={author.avatar_url} alt={author.display_name ?? username} className="w-16 h-16 rounded-full border-2" style={{ borderColor: 'var(--color-neon-cyan)' }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[var(--color-text)]">{author?.display_name ?? username}</div>
            <div className="text-xs text-[var(--color-neon-cyan)] mt-0.5">@{username}</div>
            <div className="flex gap-3 mt-2 text-[10px] text-[var(--color-text-dim)]">
              <span>{posts.length} posts</span>
              <a href={`http://localhost:3000/${username}`} target="_blank"
                className="flex items-center gap-0.5 hover:text-[var(--color-neon-cyan)] transition-colors">
                <RiExternalLinkLine size={10} /> DevFolio
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-widest">// posts by @{username}</div>
        {posts.map(post => (
          <Link key={post.slug} href={`/${username}/${post.slug}`}
            className="term-card block hover:scale-[1.005] transition-all"
            style={{ boxShadow: '0 0 0 1px rgba(77,140,255,0.1)' }}>
            <div className="term-card-header" style={{ color: 'var(--color-neon-cyan)' }}>
              <span className="truncate">{post.title}</span>
              <span className="text-[var(--color-text-dim)] shrink-0">{post.published_at?.split('T')[0] ?? ''}</span>
            </div>
            <div className="term-card-body space-y-2">
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border border-[rgba(77,140,255,0.3)] text-[var(--color-neon-cyan)]">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-dim)] shrink-0">
                  <span className="flex items-center gap-1"><RiTimeLine size={11} />{readingTime(post.content_md)}m</span>
                  <RiArrowRightLine size={13} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
