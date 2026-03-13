import { useState, useCallback } from 'react';

export const LONG_CONTENT_THRESHOLD = 150;

/**
 * @param {string | null | undefined} content
 */
export function isLongContent(content) {
  return (content?.length || 0) > LONG_CONTENT_THRESHOLD;
}

/**
 * @param {string} dateStr
 */
export function timeAgo(dateStr) {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * @typedef {Object} Post
 * @property {string | number} id
 * @property {string=} type
 * @property {string=} author
 * @property {string=} avatar_url
 * @property {string=} initials
 * @property {string=} created_at
 * @property {string=} content
 * @property {string=} title
 * @property {string=} image_url
 * @property {string[]=} tags
 * @property {number=} likes
 * @property {number=} comments_count
 * @property {Object<string, any>=} meta
 */

/**
 * @typedef {Object} BaseCardProps
 * @property {Post} post
 * @property {(() => void)=} onLike
 * @property {boolean=} liked
 * @property {(() => void)=} onClick
 * @property {((tag: string) => void)=} onTagClick
 */

/**
 * @param {{ src?: string, initials?: string, size?: number, className?: string }} props
 */
export function Avatar({ src, initials, size = 8, className = '' }) {
  const px = size * 4;
  const sizeStyle = { width: `${px}px`, height: `${px}px`, minWidth: `${px}px` };
  if (src) {
    return (
      <div
        className={`rounded-full overflow-hidden border border-white/50 dark:border-white/20 shadow-sm ${className}`}
        style={sizeStyle}
      >
        <img src={src} className="w-full h-full object-cover" alt={initials} />
      </div>
    );
  }
  const colors = [
    'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300',
    'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300',
    'bg-orange-100 dark:bg-orange-900/50 text-orange-500 dark:text-orange-300',
    'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300',
    'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300',
  ];
  const color = colors[(initials?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className={`rounded-full ${color} flex items-center justify-center font-bold text-xs border border-white/50 dark:border-white/20 shadow-sm ${className}`}
      style={sizeStyle}
    >
      {initials?.slice(0, 2) || '?'}
    </div>
  );
}

/**
 * @param {(() => void) | undefined} onLike
 * @param {boolean | undefined} liked
 */
export function useLikePop(onLike, liked) {
  const [popping, setPopping] = useState(false);
  const handleLike = useCallback((e) => {
    e?.stopPropagation?.();
    if (liked) return; // 已点赞则忽略
    setPopping(true);
    setTimeout(() => setPopping(false), 420);
    onLike?.();
  }, [onLike, liked]);
  return { popping, handleLike };
}

