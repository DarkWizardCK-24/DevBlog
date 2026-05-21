import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getPublishedPosts, readingTime } from '@/lib/db';
import { RiArrowLeftLine, RiTimeLine, RiCalendarLine, RiExternalLinkLine } from 'react-icons/ri';
import type { Metadata } from 'next';

type Props = { params: Promise<{ username: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found — DevBlog' };
  return { title: `${post.title} — DevBlog`, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  const { username, slug } = await params;
  const [post, allPosts] = await Promise.all([getPostBySlug(slug), getPublishedPosts()]);
  if (!post || post.author?.username !== username) notFound();

  const authorUser = post.author?.username ?? username;
  const authorName = post.author?.display_name ?? authorUser;
  const related = allPosts
    .filter(p => p.id !== post.id && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 2);

  return (
    <div className="container-app py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
          <RiArrowLeftLine size={13} /> $ cd ~/feed
        </Link>

        <div className="term-card glow-blue">
          <div className="term-card-header">
            <span className="text-[var(--color-neon-blue)]">~/posts/{slug}</span>
            <span className="text-[var(--color-text-dim)]">{post.published_at?.split('T')[0] ?? ''}</span>
          </div>
          <div className="term-card-body space-y-6">
            <div>
              <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <a href={`http://localhost:3000/${authorUser}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-[var(--color-neon-cyan)] transition-colors">
                  <RiExternalLinkLine size={13} /> @{authorUser}
                </a>
                <span className="flex items-center gap-1"><RiTimeLine size={11} />{readingTime(post.content_md)} min read</span>
                <span className="flex items-center gap-1"><RiCalendarLine size={11} />{post.published_at?.split('T')[0] ?? ''}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded border border-[var(--color-neon-blue)] text-[var(--color-neon-blue)]">{t}</span>
                ))}
              </div>
            </div>

            <div className="prose text-sm" dangerouslySetInnerHTML={{ __html: post.content_md
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/```(\w+)?\n([\s\S]*?)```/gm, '<pre><code>$2</code></pre>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/\n\n/g, '</p><p>')
            }} />

            <div className="border-t border-[var(--color-border)] pt-6">
              <div className="flex items-center gap-4">
                <img
                  src={post.author?.avatar_url ?? `https://github.com/${authorUser}.png`}
                  alt={authorName}
                  width={48} height={48}
                  className="rounded border-2 border-[var(--color-neon-blue)]"
                />
                <div>
                  <div className="font-semibold">{authorName}</div>
                  <a href={`http://localhost:3000/${authorUser}`} target="_blank" rel="noreferrer"
                    className="text-xs text-[var(--color-neon-cyan)] hover:underline mt-1 inline-block">view devfolio →</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">// related posts</div>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map(p => (
                <Link key={p.id} href={`/${p.author?.username ?? ''}/${p.slug}`}
                  className="term-card block hover:glow-blue transition-all p-4 pt-8">
                  <h3 className="text-sm font-semibold leading-snug hover:text-[var(--color-neon-cyan)]">{p.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
