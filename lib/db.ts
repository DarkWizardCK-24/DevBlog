import { createClient } from './supabase';

export type Post = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: { username: string; display_name: string | null; avatar_url: string | null };
};

const LS_KEY = 'devblog_drafts';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function lsGet(): Post[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}
function lsSet(posts: Post[]) { localStorage.setItem(LS_KEY, JSON.stringify(posts)); }

export async function getPublishedPosts(): Promise<Post[]> {
  const sb = createClient();
  const { data } = await sb
    .from('blog_posts')
    .select('*, author:profiles(username, display_name, avatar_url)')
    .eq('published', true)
    .order('published_at', { ascending: false });
  return data ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const sb = createClient();
  const { data } = await sb
    .from('blog_posts')
    .select('*, author:profiles(username, display_name, avatar_url)')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  return data ?? null;
}

export async function getPostsByAuthor(username: string): Promise<Post[]> {
  const sb = createClient();
  const { data: profile } = await sb
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  if (!profile) return [];
  const { data: { user } } = await sb.auth.getUser();
  const isOwner = user?.id === profile.id;
  let q = sb
    .from('blog_posts')
    .select('*, author:profiles(username, display_name, avatar_url)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });
  if (!isOwner) q = q.eq('published', true);
  const { data } = await q;
  return data ?? [];
}

export async function getMyPosts(): Promise<Post[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return lsGet();
  const { data } = await sb
    .from('blog_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  return data ?? [];
}

export async function createPost(title: string, slug: string, content_md: string, excerpt: string, tags: string[]): Promise<Post> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    const p: Post = { id: uid(), user_id: 'local', title, slug, content_md, excerpt, tags, published: false, published_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    lsSet([p, ...lsGet()]);
    return p;
  }
  const { data, error } = await sb
    .from('blog_posts')
    .insert({ user_id: user.id, title, slug, content_md, excerpt, tags, published: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(id: string, patch: Partial<Pick<Post, 'title' | 'slug' | 'content_md' | 'excerpt' | 'tags'>>): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    lsSet(lsGet().map(p => p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p));
    return;
  }
  await sb.from('blog_posts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id);
}

export async function publishPost(id: string, publish: boolean): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    lsSet(lsGet().map(p => p.id === id ? { ...p, published: publish, published_at: publish ? new Date().toISOString() : null } : p));
    return;
  }
  await sb.from('blog_posts').update({
    published: publish,
    published_at: publish ? new Date().toISOString() : null,
  }).eq('id', id).eq('user_id', user.id);
}

export async function deletePost(id: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) { lsSet(lsGet().filter(p => p.id !== id)); return; }
  await sb.from('blog_posts').delete().eq('id', id).eq('user_id', user.id);
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}
