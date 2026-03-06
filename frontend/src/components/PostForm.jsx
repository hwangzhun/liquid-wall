import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';

const POST_TYPES = [
  { value: 'text', label: '💬 文字', icon: 'chat' },
  { value: 'quote', label: '✍️ 引言', icon: 'format_quote' },
  { value: 'article', label: '📝 文章', icon: 'article' },
  { value: 'prompt', label: '💡 提示', icon: 'lightbulb' },
  { value: 'simple', label: '🌟 简短', icon: 'star' },
];

export default function PostForm({ onClose, onSubmit, editPost }) {
  const { token } = useAuth();
  const isEditing = !!editPost;
  const [type, setType] = useState(editPost?.type || 'text');
  const [author, setAuthor] = useState(editPost?.author || import.meta.env.VITE_DEFAULT_AUTHOR || '');
  const [title, setTitle] = useState(editPost?.title || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [tagsInput, setTagsInput] = useState(
    editPost?.tags?.length ? editPost.tags.join(', ') : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [closing, setClosing] = useState(false);

  // Wrap onClose to play exit animation first
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose?.(), 210);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Fetch all existing tags from DB for quick-pick
  useEffect(() => {
    fetch('/api/posts/tags')
      .then(r => r.json())
      .then(tags => setAvailableTags(tags))
      .catch(() => {});
  }, []);

  const needsTitle = ['article', 'prompt', 'quote'].includes(type);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isEditing && !author.trim()) {
      setError('昵称不能为空');
      return;
    }
    if (!content.trim()) {
      setError('内容不能为空');
      return;
    }
    setError('');
    setLoading(true);

    const tags = tagsInput
      .split(/[,，\s]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/posts/${editPost.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ type, title: title.trim() || null, content: content.trim(), tags }),
        });
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            type,
            author: author.trim(),
            avatar_url: import.meta.env.VITE_DEFAULT_AVATAR_URL || undefined,
            title: title.trim() || null,
            content: content.trim(),
            tags,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (isEditing ? '修改失败' : '发布失败'));
      }

      const resultPost = await res.json();
      onSubmit?.(resultPost);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-50/30 dark:bg-slate-900/50 backdrop-blur-md ${closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg detail-glass-panel rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto ${closing ? 'modal-panel-exit' : 'modal-panel-enter'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#197fe6]/10 text-[#197fe6] flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_note</span>
            </div>
            <h2 className="text-lg font-bold text-[color:var(--color-fg)]">{isEditing ? '编辑留言' : '发布留言'}</h2>
          </div>
          <button
            onClick={handleClose}
            className="liquid-button h-9 w-9 flex items-center justify-center rounded-full text-[color:var(--color-fg-subtle)] hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-5 sm:py-6 flex flex-col gap-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-2 uppercase tracking-wider">留言类型</label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    type === pt.value
                      ? 'bg-[#197fe6] text-white border-[#197fe6] shadow-sm shadow-[#197fe6]/30'
                      : 'bg-white/40 dark:bg-white/10 text-[color:var(--color-fg-muted)] border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
              您的昵称 {!isEditing && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              value={author}
              onChange={e => !isEditing && setAuthor(e.target.value)}
              placeholder="输入昵称..."
              maxLength={50}
              readOnly={isEditing}
              className={`w-full px-4 py-2.5 rounded-xl border text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] text-sm outline-none transition-all ${
                isEditing
                  ? 'bg-slate-100/50 dark:bg-white/5 border-white/20 dark:border-white/10 text-[color:var(--color-fg-subtle)] cursor-not-allowed'
                  : 'bg-white/50 dark:bg-white/10 border-white/50 dark:border-white/20 focus:border-[#197fe6]/50 focus:ring-2 focus:ring-[#197fe6]/20'
              }`}
            />
          </div>

          {/* Title (conditional) */}
          {needsTitle && (
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
                标题
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={type === 'quote' ? '人物身份（如：诗人、思想家）' : '文章标题...'}
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 border border-white/50 dark:border-white/20 text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] text-sm outline-none focus:border-[#197fe6]/50 focus:ring-2 focus:ring-[#197fe6]/20 transition-all"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
              内容 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={type === 'quote' ? '"在此输入您的名言..."' : '分享您的想法...'}
              maxLength={1000}
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 border border-white/50 dark:border-white/20 text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] text-sm outline-none focus:border-[#197fe6]/50 focus:ring-2 focus:ring-[#197fe6]/20 transition-all resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-[color:var(--color-fg-subtle)]">{content.length}/1000</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
              标签 <span className="text-[color:var(--color-fg-subtle)] font-normal normal-case">（用逗号或空格分隔）</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="设计, CSS, 灵感..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 border border-white/50 dark:border-white/20 text-[color:var(--color-fg)] placeholder-[color:var(--color-fg-subtle)] text-sm outline-none focus:border-[#197fe6]/50 focus:ring-2 focus:ring-[#197fe6]/20 transition-all"
            />
            {/* Tag Preview */}
            {tagsInput.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagsInput.split(/[,，\s]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-[#197fe6]/10 text-[#197fe6] text-[10px] font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {/* Quick-pick: existing tags from DB */}
            {availableTags.length > 0 && (() => {
              const currentParsed = tagsInput.split(/[,，\s]+/).map(t => t.trim().replace(/^#/, '')).filter(Boolean);
              const suggestions = availableTags.filter(t => !currentParsed.includes(t));
              if (suggestions.length === 0) return null;
              return (
                <div className="mt-2.5">
                  <p className="text-[10px] font-semibold text-[color:var(--color-fg-subtle)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>label</span>
                    选择已有标签
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const trimmed = tagsInput.trim();
                          setTagsInput(trimmed ? `${trimmed}, ${tag}` : tag);
                        }}
                        className="flex items-center gap-0.5 px-2.5 py-1 rounded-full border border-dashed border-[#197fe6]/40 text-[#197fe6]/60 text-[11px] font-medium hover:bg-[#197fe6]/10 hover:border-[#197fe6]/70 hover:text-[#197fe6] transition-all"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>add</span>
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100/70 dark:bg-white/10 text-[color:var(--color-fg-muted)] text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#197fe6] text-white text-sm font-semibold shadow-lg shadow-[#197fe6]/30 hover:bg-blue-600 hover:shadow-[#197fe6]/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? '保存中...' : '发布中...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{isEditing ? 'save' : 'send'}</span>
                  {isEditing ? '保存修改' : '发布留言'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
