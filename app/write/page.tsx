'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPost, slugify } from '@/lib/db';
import { RiArrowLeftLine, RiSaveLine, RiEyeLine } from 'react-icons/ri';

export default function WritePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags(t => [...new Set([...t, tagInput.trim().toLowerCase()])]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) { setTags(t => t.filter(x => x !== tag)); }

  function renderMd(md: string) {
    return md
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-[var(--color-text)]">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2 text-[var(--color-text)]">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-[var(--color-text)]">$1</h3>')
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="my-4 p-4 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-neon-green)] overflow-x-auto"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-neon-cyan)] text-xs">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--color-text)]">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-[var(--color-text-muted)] list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-sm text-[var(--color-text-muted)] leading-relaxed my-3">');
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    setError('');
    try {
      const slug = slugify(title);
      const rawText = content.replace(/^#.+$/gm, '').replace(/```[\s\S]*?```/g, '').trim();
      const excerpt = rawText.slice(0, 200) + (rawText.length > 200 ? '…' : '');
      await createPost(title, slug, content, excerpt, tags);
      setSaved(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-app py-10 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
          <RiArrowLeftLine size={13} /> $ ls /blog
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setPreview(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] hover:border-[var(--color-neon-cyan)] transition-colors">
            <RiEyeLine size={12} /> {preview ? 'edit' : 'preview'}
          </button>
          <button onClick={handleSave} disabled={saving || saved}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border transition-colors disabled:opacity-60"
            style={{ borderColor: saved ? 'var(--color-neon-green)' : 'var(--color-neon-cyan)', color: saved ? 'var(--color-neon-green)' : 'var(--color-neon-cyan)' }}>
            <RiSaveLine size={12} /> {saved ? '✓ saved' : saving ? 'saving...' : '$ :wq'}
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs text-[var(--color-text-muted)]"><span className="text-[var(--color-neon-green)]">$</span> vim new-post.md</div>
        <h1 className="text-3xl font-bold mt-2">Write Post<span className="caret" /></h1>
      </div>

      {error && (
        <div className="text-xs text-[var(--color-neon-red)] border border-[rgba(255,77,77,0.3)] rounded p-3">
          {error}
        </div>
      )}

      {preview ? (
        <div className="term-card">
          <div className="term-card-header" style={{ color: 'var(--color-neon-cyan)' }}>
            <span>// preview</span>
          </div>
          <div className="term-card-body prose">
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">{title || 'Untitled'}</h1>
            {tags.length > 0 && (
              <div className="flex gap-2 mb-4">
                {tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded border border-[rgba(77,140,255,0.4)] text-[var(--color-neon-cyan)]">#{t}</span>)}
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-[var(--color-text-muted)] leading-relaxed my-3">${renderMd(content)}</p>` }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            className="w-full text-xl font-bold bg-transparent border-b border-[var(--color-border)] pb-3 px-0 rounded-none focus:border-[var(--color-neon-cyan)]"
            placeholder="Post title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="flex flex-wrap gap-2 items-center">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded border border-[rgba(77,140,255,0.4)] text-[var(--color-neon-cyan)]">
                #{t}
                <button onClick={() => removeTag(t)} className="hover:text-[var(--color-neon-red)] ml-1">×</button>
              </span>
            ))}
            <input
              className="text-xs bg-transparent border-0 p-0 text-[var(--color-text-muted)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
              placeholder="add tag, press Enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          <div className="term-card">
            <div className="term-card-header" style={{ color: 'var(--color-text-dim)' }}>
              <span>// markdown</span>
              <span className="text-[10px]">{content.length} chars</span>
            </div>
            <div className="term-card-body p-0">
              <textarea
                className="w-full h-96 p-4 text-sm font-mono bg-transparent border-0 resize-none outline-none text-[var(--color-text-muted)] leading-relaxed"
                placeholder={'# Your Post Title\n\nWrite your content here...\n\n```js\n// code blocks supported\n```'}
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
