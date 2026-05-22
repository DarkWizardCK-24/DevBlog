import { createClient } from './supabase';

// ============================================================
// TYPES
// ============================================================

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string;
  website: string;
  avatar_url: string | null;
  github_username: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string;
  cover_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
  views: number;
  read_time: number;
  created_at: string;
  updated_at: string;
  author?: { username: string; display_name: string | null; avatar_url: string | null };
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: { username: string; display_name: string | null; avatar_url: string | null };
};

// ── Local storage fallback (offline drafts) ──────────────────
const LS_KEY = 'devblog_drafts';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function lsGet(): Post[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); } catch { return []; }
}
function lsSet(posts: Post[]) { localStorage.setItem(LS_KEY, JSON.stringify(posts)); }

// ============================================================
// POSTS
// ============================================================

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

export async function createPost(
  title: string,
  slug: string,
  content_md: string,
  excerpt: string,
  tags: string[]
): Promise<Post> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    const p: Post = {
      id: uid(), user_id: 'local', title, slug, content_md, excerpt,
      cover_url: null, tags, published: false, published_at: null,
      views: 0, read_time: readingTime(content_md),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    lsSet([p, ...lsGet()]);
    return p;
  }
  const { data, error } = await sb
    .from('blog_posts')
    .insert({ user_id: user.id, title, slug, content_md, excerpt, tags, read_time: readingTime(content_md), published: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePost(
  id: string,
  patch: Partial<Pick<Post, 'title' | 'slug' | 'content_md' | 'excerpt' | 'tags' | 'cover_url'>>
): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    lsSet(lsGet().map(p => p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p));
    return;
  }
  const update: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (patch.content_md) update.read_time = readingTime(patch.content_md);
  await sb.from('blog_posts').update(update).eq('id', id).eq('user_id', user.id);
}

export async function publishPost(id: string, publish: boolean): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    lsSet(lsGet().map(p =>
      p.id === id ? { ...p, published: publish, published_at: publish ? new Date().toISOString() : null } : p
    ));
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

export async function incrementViews(postId: string): Promise<void> {
  const sb = createClient();
  await sb.rpc('increment_post_views', { p_post_id: postId });
}

// ============================================================
// LIKES
// ============================================================

export async function getLikeCount(postId: string): Promise<number> {
  const sb = createClient();
  const { count } = await sb
    .from('blog_post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  return count ?? 0;
}

export async function hasUserLiked(postId: string): Promise<boolean> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from('blog_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();
  return !!data;
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const liked = await hasUserLiked(postId);
  if (liked) {
    await sb.from('blog_post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
  } else {
    await sb.from('blog_post_likes').insert({ post_id: postId, user_id: user.id });
  }
  const count = await getLikeCount(postId);
  return { liked: !liked, count };
}

// ============================================================
// COMMENTS
// ============================================================

export async function getComments(postId: string): Promise<Comment[]> {
  const sb = createClient();
  const { data } = await sb
    .from('blog_comments')
    .select('*, author:profiles(username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await sb
    .from('blog_comments')
    .insert({ post_id: postId, user_id: user.id, content })
    .select('*, author:profiles(username, display_name, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

export async function updateComment(commentId: string, content: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('blog_comments').update({ content }).eq('id', commentId).eq('user_id', user.id);
}

export async function deleteComment(commentId: string): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from('blog_comments').delete().eq('id', commentId).eq('user_id', user.id);
}

// ============================================================
// BOOKMARKS
// ============================================================

export async function hasBookmarked(postId: string): Promise<boolean> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from('blog_bookmarks')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();
  return !!data;
}

export async function toggleBookmark(postId: string): Promise<boolean> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const bookmarked = await hasBookmarked(postId);
  if (bookmarked) {
    await sb.from('blog_bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
    return false;
  }
  await sb.from('blog_bookmarks').insert({ post_id: postId, user_id: user.id });
  return true;
}

export async function getBookmarkedPosts(): Promise<Post[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data } = await sb
    .from('blog_bookmarks')
    .select('post_id, blog_posts(*, author:profiles(username, display_name, avatar_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => r.blog_posts).filter(Boolean);
}

// ============================================================
// PROFILE
// ============================================================

export async function getProfile(username: string): Promise<Profile | null> {
  const sb = createClient();
  const { data } = await sb.from('profiles').select('*').eq('username', username).single();
  return data ?? null;
}

export async function getMyProfile(): Promise<Profile | null> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  return data ?? null;
}

export async function updateProfile(
  patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'website' | 'avatar_url'>>
): Promise<void> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await sb.from('profiles').update(patch).eq('id', user.id);
}

// ============================================================
// UTILITIES
// ============================================================

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}
