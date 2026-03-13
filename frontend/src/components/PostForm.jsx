import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import Toast from './Toast';
import ImageEditor from './ImageEditor';

const POST_TYPES = [
  { value: 'text', label: '💬 文字', icon: 'chat' },
  { value: 'image', label: '🖼️ 图片', icon: 'image' },
  { value: 'quote', label: '✍️ 引言', icon: 'format_quote' },
  { value: 'article', label: '📝 文章', icon: 'article' },
  { value: 'location', label: '📍 Location', icon: 'location_on' },
  { value: 'prompt', label: '💡 提示', icon: 'lightbulb' },
];

export default function PostForm({ onClose, onSubmit, editPost }) {
  const { token } = useAuth();
  const isEditing = !!editPost;
  const normalizedType = (editPost?.type === 'media') ? 'location' : editPost?.type;
  const [type, setType] = useState(normalizedType || 'text');
  const [author, setAuthor] = useState(editPost?.author || import.meta.env.VITE_DEFAULT_AUTHOR || '');
  const [title, setTitle] = useState(editPost?.title || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [imageUrl, setImageUrl] = useState(editPost?.image_url || '');
  const [tagsInput, setTagsInput] = useState(
    editPost?.tags?.length ? editPost.tags.join(', ') : ''
  );
  // 图片裁剪参数，编辑时回填
  const initialCrop = editPost?.image_crop || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [closing, setClosing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [imageEditorState, setImageEditorState] = useState(null); // 存储图片编辑器的缩放和位置信息

  // Wrap onClose to play exit animation first
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose?.(), 210);
  }, [onClose]);

  // 模态打开时禁止背后页面（留言列表）滚轮滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, []);

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

  const needsTitle = ['article', 'prompt', 'quote', 'location'].includes(type);
  const needsImageUrl = ['image', 'location'].includes(type);

  async function compressImage(file) {
    const maxWidth = 1920;
    const quality = 0.8;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取画布上下文'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('压缩失败'));
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
    }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (!token) {
      setError('请先登录后再上传图片');
      return;
    }
    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(pct);
        }
      };
      const result = await new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const parsed = JSON.parse(xhr.responseText);
                resolve(parsed);
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(xhr.responseText || '上传失败'));
            }
          }
        };
        xhr.onerror = () => reject(new Error('网络错误，上传失败'));
        xhr.send(formData);
      });

      setImageUrl(result.image_url || '');
      setUploadProgress(100);
    } catch (err) {
      setError(err.message || '上传失败');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

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
    if (type === 'location' && !title.trim()) {
      setError('标题不能为空');
      return;
    }
    if (needsImageUrl && !imageUrl.trim()) {
      setError('请先上传图片');
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
      let finalImageUrl = imageUrl.trim() || null;

      // 构造 image_crop 数据（包含缩放、位置、容器参考尺寸）
      let imageCrop = null;
      if (needsImageUrl && imageEditorState && imageUrl.trim()) {
        imageCrop = {
          scale: imageEditorState.scale,
          x: imageEditorState.position?.x ?? 0,
          y: imageEditorState.position?.y ?? 0,
          refW: imageEditorState.refW ?? 0,
          refH: imageEditorState.refH ?? 0,
        };
      }

      let res;
      if (isEditing) {
        res = await fetch(`/api/posts/${editPost.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            type,
            title: title.trim() || null,
            content: content.trim(),
            tags,
            image_url: needsImageUrl ? finalImageUrl : null,
            image_crop: imageCrop,
          }),
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
            image_url: needsImageUrl ? finalImageUrl : null,
            image_crop: imageCrop,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (isEditing ? '修改失败' : '发布失败'));
      }

      const resultPost = await res.json();
      // 显示成功提示
      setToast({ message: isEditing ? '编辑成功' : '发布成功', type: 'success' });
      onSubmit?.(resultPost);
      // 延迟关闭，让用户看到 Toast
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-50/30 dark:bg-black/50 backdrop-blur-md ${closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
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
                标题 {type === 'location' && <span className="text-red-400">*</span>}
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

          {/* Image Upload (conditional) */}
          {needsImageUrl && (
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-fg-muted)] mb-1.5 uppercase tracking-wider">
                上传图片 <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="image-upload-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => document.getElementById('image-upload-input')?.click()}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    text-sm font-medium
                    border-2 transition-all duration-300 ease-out
                    ${uploading
                      ? 'bg-gradient-to-r from-blue-400/20 to-indigo-400/20 border-blue-300/50 text-blue-600 dark:text-blue-400 cursor-wait'
                      : imageUrl.trim()
                        ? 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 border-green-400/50 text-green-700 dark:text-green-400 hover:from-green-400/30 hover:to-emerald-400/30 hover:border-green-400/70 hover:shadow-lg hover:shadow-green-400/20 hover:-translate-y-0.5'
                        : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-400/40 text-blue-700 dark:text-blue-300 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-purple-500/20 hover:border-blue-400/70 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5'
                    }
                    active:scale-95 active:translate-y-0
                  `}
                >
                  {uploading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>上传中 {uploadProgress}%</span>
                    </>
                  ) : imageUrl.trim() ? (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>更换图片</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">cloud_upload</span>
                      <span>点击选择图片</span>
                    </>
                  )}
                </button>
              </div>
              {uploading && (
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[color:var(--color-fg-subtle)] text-center">
                    正在上传图片... {uploadProgress}%
                  </p>
                </div>
              )}
              {imageUrl.trim() && (
                <div className="mt-3 w-full h-48 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <ImageEditor
                    imageUrl={imageUrl.trim()}
                    onChange={setImageEditorState}
                    initialCrop={initialCrop}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageEditorState(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                      移除图片
                    </button>
                  </div>
                </div>
              )}
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
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-[#197fe6]/10 dark:bg-[#58a6ff]/25 text-[#197fe6] dark:text-[#ffffff] text-[10px] font-medium">
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
                        className="flex items-center gap-0.5 px-2.5 py-1 rounded-full border border-dashed border-[#197fe6]/40 dark:border-[#58a6ff]/35 text-[#197fe6]/60 dark:text-[#58a6ff]/70 text-[11px] font-medium hover:bg-[#197fe6]/10 dark:hover:bg-[#58a6ff]/15 hover:border-[#197fe6]/70 dark:hover:border-[#58a6ff]/50 hover:text-[#197fe6] dark:hover:text-[#58a6ff] transition-all"
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
    </>
  );
}
