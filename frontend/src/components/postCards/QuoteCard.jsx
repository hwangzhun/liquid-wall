import { Avatar, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

/**
 * @param {BaseCardProps} props
 */
export function QuoteCard({ post, onLike, liked, onClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-white/30 to-white/10 dark:from-white/10 dark:to-white/5" onClick={onClick}>
      <span className="material-symbols-outlined text-[#197fe6]/40 dark:text-[#58a6ff]/50 mb-4" style={{ fontSize: '32px' }}>format_quote</span>
      <p className="text-xl sm:text-2xl font-serif italic text-[color:var(--color-fg)] leading-snug mb-6 whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors text-xs ${liked ? 'text-red-500 cursor-default' : 'text-[color:var(--color-fg-subtle)] hover:text-red-500'}`}
        >
          <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '16px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-[color:var(--color-fg)]">{post.author}</p>
            <p className="text-[10px] text-[color:var(--color-fg-subtle)]">{post.title}</p>
          </div>
          <Avatar src={post.avatar_url} initials={post.initials} size={10} className="grayscale opacity-80" />
        </div>
      </div>
    </div>
  );
}

