import { useState, useEffect, useCallback, useRef } from 'react';
import PostCard from '../components/PostCard';
import DetailModal from '../components/DetailModal';
import PostForm from '../components/PostForm';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// 从 localStorage 读取已点赞帖子集合
function loadLikedPosts() {
  try {
    return new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));
  } catch {
    return new Set();
  }
}

// 保存已点赞帖子集合到 localStorage
function saveLikedPosts(set) {
  localStorage.setItem('likedPosts', JSON.stringify([...set]));
}

export default function HomePage({ searchQuery, postFormOpen, setPostFormOpen, newPost, onRequireLogin }) {
  const { isLoggedIn, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTag, setActiveTag] = useState('');
  const [shuffled, setShuffled] = useState(false);
  // pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Track each fetch generation so stagger resets on new data
  const [fetchGeneration, setFetchGeneration] = useState(0);
  const [likedPosts, setLikedPosts] = useState(loadLikedPosts);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sentinel ref for IntersectionObserver
  const sentinelRef = useRef(null);

  // ── Core fetch (first page / reset) ─────────────────────────────────────
  const fetchPosts = useCallback(async (search = '', tag = '', isShuffled = false) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: 1, limit: PAGE_SIZE });
      if (search) params.set('search', search);
      if (tag) params.set('tag', tag);
      if (isShuffled) params.set('shuffle', 'true');
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error('加载失败');
      const json = await res.json();
      setPosts(json.data);
      setPage(1);
      setHasMore(json.data.length < json.total);
      setFetchGeneration(g => g + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load next page ───────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: nextPage, limit: PAGE_SIZE });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeTag) params.set('tag', activeTag);
      if (shuffled) params.set('shuffle', 'true');
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error('加载失败');
      const json = await res.json();
      setPosts(prev => {
        // Deduplicate by id
        const existingIds = new Set(prev.map(p => p.id));
        const fresh = json.data.filter(p => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
      setPage(nextPage);
      setHasMore(json.data.length > 0 && (nextPage * PAGE_SIZE) < json.total);
    } catch {
      // silently fail on load-more
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, debouncedSearch, activeTag, shuffled]);

  // ── Initial / filter change fetch ───────────────────────────────────────
  useEffect(() => {
    fetchPosts(debouncedSearch, activeTag, shuffled);
  }, [debouncedSearch, activeTag, shuffled, fetchPosts]);

  // ── When a new post arrives from the PostForm in App, prepend it ─────────
  useEffect(() => {
    if (newPost) {
      setPosts(prev => {
        if (prev.find(p => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    }
  }, [newPost]);

  // ── IntersectionObserver: trigger loadMore when sentinel visible ─────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── CRUD helpers ─────────────────────────────────────────────────────────
  async function handleDelete(postId) {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    } catch {}
  }

  function handleEdit(post) {
    if (!isLoggedIn) return;
    setEditingPost(post);
  }

  function handleEditSubmit(updatedPost) {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    if (selectedPost?.id === updatedPost.id) setSelectedPost(updatedPost);
    setEditingPost(null);
  }

  function handleUpdate(updatedPost) {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setSelectedPost(updatedPost);
  }

  async function handleLike(postId) {
    if (likedPosts.has(postId)) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'PUT' });
      if (res.status === 409) {
        const newSet = new Set(likedPosts);
        newSet.add(postId);
        setLikedPosts(newSet);
        saveLikedPosts(newSet);
        return;
      }
      if (!res.ok) return;
      const updated = await res.json();
      const newSet = new Set(likedPosts);
      newSet.add(postId);
      setLikedPosts(newSet);
      saveLikedPosts(newSet);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      if (selectedPost?.id === postId) setSelectedPost(updated);
    } catch {}
  }

  function handleTagClick(tag) {
    setActiveTag(prev => prev === tag ? '' : tag);
  }

  function handleShuffleToggle() {
    setShuffled(prev => !prev);
  }

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].slice(0, 12);

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-3 sm:px-6 lg:px-8 z-10 relative">
      {/* Hero Header */}
      <header className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto hero-enter">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 drop-shadow-sm">
          Flowing Thoughts
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
          Share your moments in a cascade of glass and light. A space for transparency and connection.
        </p>
      </header>

      {/* Tag Filter Bar + Shuffle Toggle */}
      <div className="flex flex-wrap gap-2 justify-center mb-6 sm:mb-10">
        {allTags.length > 0 && (
          <>
            <button
              onClick={() => setActiveTag('')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                !activeTag
                  ? 'bg-[#197fe6] text-white border-[#197fe6] shadow-sm'
                  : 'bg-white/40 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20'
              }`}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                  activeTag === tag
                    ? 'bg-[#197fe6] text-white border-[#197fe6] shadow-sm'
                    : 'bg-white/40 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20'
                }`}
              >
                #{tag}
              </button>
            ))}
          </>
        )}

        {/* Shuffle Toggle – always visible */}
        <button
          onClick={handleShuffleToggle}
          title={shuffled ? '关闭循序，按时间排序' : '开启循序加载'}
          className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
            shuffled
              ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
              : 'bg-white/40 dark:bg-white/10 text-slate-600 dark:text-slate-400 border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shuffle</span>
          循序加载
        </button>
      </div>

      {/* Search/Filter Info */}
      {(debouncedSearch || activeTag) && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/20 text-sm text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[#197fe6]" style={{ fontSize: '16px' }}>filter_list</span>
            {debouncedSearch && <span>搜索: <strong className="text-slate-800 dark:text-slate-200">"{debouncedSearch}"</strong></span>}
            {activeTag && <span>标签: <strong className="text-[#197fe6]">#{activeTag}</strong></span>}
            <span className="text-slate-400">· {posts.length} 条</span>
          </div>
          <button
            onClick={() => { setActiveTag(''); }}
            className="px-3 py-2 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
          >
            清除过滤
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-[#197fe6]/20 border-t-[#197fe6] rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">加载留言中...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>error_outline</span>
          </div>
          <div className="text-center">
            <p className="text-slate-700 dark:text-slate-300 font-medium">加载失败</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchPosts(debouncedSearch, activeTag, shuffled)}
            className="px-6 py-2 rounded-xl bg-[#197fe6] text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '40px' }}>inbox</span>
          </div>
          <div className="text-center">
            <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">暂无留言</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {debouncedSearch || activeTag ? '没有找到匹配的内容' : '成为第一个发布留言的人！'}
            </p>
          </div>
          {!debouncedSearch && !activeTag && isLoggedIn && (
            <button
              onClick={() => setPostFormOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#197fe6] text-white rounded-full text-sm font-semibold shadow-lg shadow-[#197fe6]/30 hover:shadow-[#197fe6]/50 hover:-translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              发布第一条留言
            </button>
          )}
        </div>
      )}

      {/* Masonry Grid – cards stagger in on each fetch */}
      {!loading && !error && posts.length > 0 && (
        <div className="masonry-grid" key={fetchGeneration}>
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="masonry-item card-enter"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.6)}s` }}
            >
              <PostCard
                post={post}
                onLike={() => handleLike(post.id)}
                liked={likedPosts.has(post.id)}
                onClick={() => setSelectedPost(post)}
                onTagClick={handleTagClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Sentinel element for IntersectionObserver */}
      <div ref={sentinelRef} className="h-1" />

      {/* Load-more spinner */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-[#197fe6]/20 border-t-[#197fe6] rounded-full animate-spin" />
        </div>
      )}

      {/* All loaded indicator */}
      {!loading && !loadingMore && !hasMore && posts.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="h-px flex-1 max-w-24 bg-slate-200 dark:bg-slate-700" />
          <p className="text-xs text-slate-400 dark:text-slate-500">已加载全部 {posts.length} 条留言</p>
          <div className="h-px flex-1 max-w-24 bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      {isLoggedIn && (
        <button
          onClick={() => setPostFormOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#197fe6] text-white rounded-full shadow-xl shadow-[#197fe6]/40 flex items-center justify-center z-50 active:scale-95 transition-transform hover:-translate-y-1"
          title="发布留言"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
        </button>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <DetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          liked={likedPosts.has(selectedPost.id)}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onUpdate={handleUpdate}
        />
      )}

      {/* Edit Form Modal */}
      {isLoggedIn && editingPost && (
        <PostForm
          editPost={editingPost}
          onClose={() => setEditingPost(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
