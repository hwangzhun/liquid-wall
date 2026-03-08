import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';

const LONG_CONTENT_THRESHOLD = 150;

function isLongContent(content) {
  return (content?.length || 0) > LONG_CONTENT_THRESHOLD;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DetailModal({ post, onClose, onLike, liked, onDelete, onEdit, onUpdate }) {
  const { isLoggedIn, token } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [addingTag, setAddingTag] = useState(false);
  const [closing, setClosing] = useState(false);
  const [likePopping, setLikePopping] = useState(false);

  // Wrap onClose to play exit animation first
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose?.(), 210);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // 锁定背景滚动，防止滚轮穿透到底层列表
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fetch all existing tags from database
  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/posts/tags')
      .then(r => r.json())
      .then(tags => setAvailableTags(tags))
      .catch(() => {});
  }, [isLoggedIn]);

  // Tags that exist in DB but not yet on this post
  const suggestedTags = availableTags.filter(t => !(post.tags || []).includes(t));

  async function handleAddTag(tag) {
    if (addingTag) return;
    setAddingTag(tag);
    try {
      const newTags = [...(post.tags || []), tag];
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate?.(updated);
      }
    } catch (err) {
      void err;
    }
    setAddingTag(false);
  }

  function handleLikeClick() {
    if (liked) return; // 已点赞则忽略
    setLikePopping(true);
    setTimeout(() => setLikePopping(false), 400);
    onLike?.(post.id);
  }

  if (!post) return null;

  const avatarSrc = post.avatar_url;
  const initials = post.initials || post.author?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = [
    'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300',
    'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
    'bg-orange-100 dark:bg-orange-900/50 text-orange-500 dark:text-orange-300',
    'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
  ];
  const avatarColor = colors[(initials?.charCodeAt(0) || 0) % colors.length];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 sm:px-4 md:px-6 pt-[6rem] sm:pt-[8rem] pb-4 sm:pb-6">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-50/30 dark:bg-black/50 backdrop-blur-md ${closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-3xl detail-glass-panel rounded-2xl sm:rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-11rem)] ${closing ? 'modal-panel-exit' : 'modal-panel-enter'}`}>
        {/* Top Bar */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-2 sm:gap-3">
          {isLoggedIn && (
            confirmDelete ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">确认删除？</span>
                <button
                  onClick={() => onDelete?.(post.id)}
                  className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[color:var(--color-fg-muted)] text-xs font-semibold transition-colors"
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onEdit?.(post)}
                  className="liquid-button h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-[color:var(--color-fg-muted)] hover:text-[#197fe6] transition-colors"
                  title="编辑留言"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="liquid-button h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-[color:var(--color-fg-muted)] hover:text-red-500 transition-colors"
                  title="删除留言"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </>
            )
          )}
          <button
            onClick={handleClose}
            className="liquid-button h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full text-[color:var(--color-fg-muted)] hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row min-h-[400px] sm:min-h-[500px] overflow-y-auto flex-1 scrollbar-hide">
          {/* Left Visual */}
          {post.image_url && (
            <div className="hidden md:flex md:w-2/5 bg-slate-100/30 dark:bg-slate-800/30 border-r border-white/20 dark:border-white/10 relative items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#197fe6]/5 to-transparent"></div>
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay"
                style={{ backgroundImage: `url("${post.image_url}")` }}
              />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-[color:var(--color-fg-subtle)] text-xs font-medium uppercase tracking-wider backdrop-blur-sm bg-white/30 dark:bg-white/10 w-fit px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>image</span>
                  <span>Visual</span>
                </div>
              </div>
            </div>
          )}

          {/* Right Content */}
          <div className="flex-1 flex flex-col p-6 sm:p-8 md:p-10 relative pt-12 sm:pt-14 md:pt-10">
            {/* Author */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="relative group cursor-pointer shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#197fe6] to-purple-400 rounded-full opacity-30 group-hover:opacity-70 blur transition duration-200"></div>
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full p-[2px] bg-white/50 dark:bg-white/10 backdrop-blur-sm">
                  {avatarSrc ? (
                    <img alt={post.author} className="h-full w-full rounded-full object-cover" src={avatarSrc} />
                  ) : (
                    <div className={`h-full w-full rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm`}>
                      {initials}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold text-[color:var(--color-fg)] leading-tight">{post.author}</h3>
                {post.title && (
                  <p className="text-xs sm:text-sm text-[color:var(--color-fg-subtle)] mt-0.5">{post.title}</p>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 mb-6 sm:mb-10">
              <p className={`font-light text-[color:var(--color-fg)] leading-relaxed tracking-tight whitespace-pre-wrap ${isLongContent(post.content) ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>
                {post.content}
              </p>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                {post.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-[#197fe6]/10 dark:bg-[#58a6ff]/25 text-[#197fe6] dark:text-[#ffffff] text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tag Picker – add existing tags from DB (admin only) */}
            {isLoggedIn && suggestedTags.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <p className="text-[10px] font-semibold text-[color:var(--color-fg-subtle)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>label</span>
                  添加已有标签
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      disabled={addingTag === tag}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[#197fe6]/40 dark:border-[#58a6ff]/35 text-[#197fe6]/60 dark:text-[#58a6ff]/70 text-[11px] font-medium hover:bg-[#197fe6]/10 dark:hover:bg-[#58a6ff]/15 hover:border-[#197fe6]/70 dark:hover:border-[#58a6ff]/50 hover:text-[#197fe6] dark:hover:text-[#58a6ff] transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {addingTag === tag ? (
                        <span className="inline-block w-3 h-3 border border-[#197fe6]/30 border-t-[#197fe6] rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>add</span>
                      )}
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mb-5 sm:mb-8 pt-4 sm:pt-6 border-t border-[color:var(--color-border)] text-xs sm:text-sm text-[color:var(--color-fg-subtle)] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                {timeAgo(post.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>thumb_up</span>
                {post.likes} Likes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat_bubble</span>
                {post.comments_count} Replies
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-[color:var(--color-fg)]">{post.likes.toLocaleString()}</span>
                <span className="text-[10px] sm:text-xs text-[color:var(--color-fg-subtle)] uppercase tracking-wide">Likes</span>
              </div>
              <div className="w-px h-6 sm:h-8 bg-slate-200/50 dark:bg-slate-700/50"></div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-[color:var(--color-fg)]">{post.comments_count}</span>
                <span className="text-[10px] sm:text-xs text-[color:var(--color-fg-subtle)] uppercase tracking-wide">Replies</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4 mt-auto">
              <button
                onClick={handleLikeClick}
                disabled={liked}
                className={`group relative flex items-center justify-center gap-2 px-4 sm:px-6 h-10 sm:h-12 rounded-xl transition-all overflow-hidden border ${
                  liked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-900/30 cursor-default'
                    : 'bg-slate-100/50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-[color:var(--color-fg-muted)] hover:text-red-500 border-transparent hover:border-red-200 dark:hover:border-red-900/30'
                }`}
              >
                <span
                  className={`material-symbols-outlined transition-transform ${likePopping ? 'like-pop' : (!liked ? 'group-hover:scale-110' : '')}`}
                  style={{ fontSize: '18px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
                <span className="font-semibold text-sm">{liked ? '已点赞' : 'Like'}</span>
              </button>
              <button className="flex-1 group relative flex items-center justify-center gap-2 px-4 sm:px-6 h-10 sm:h-12 rounded-xl bg-[#197fe6] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rotate-12"></div>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
                <span className="font-semibold text-sm">Reply</span>
              </button>
              <button className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[color:var(--color-fg-muted)] transition-all">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ios_share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
