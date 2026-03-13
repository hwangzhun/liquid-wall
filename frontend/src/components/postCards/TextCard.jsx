import { Avatar, isLongContent, timeAgo, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

/**
 * @param {BaseCardProps} props
 */
export function TextCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar src={post.avatar_url} initials={post.initials} />
          <span className="text-xs font-semibold text-[color:var(--color-fg-muted)]">{post.author}</span>
        </div>
        <span className="text-xs text-[color:var(--color-fg-subtle)]">{timeAgo(post.created_at)}</span>
      </div>
      <p
        className={`text-[color:var(--color-fg)] leading-relaxed font-normal whitespace-pre-wrap ${
          isLongContent(post.content) ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
        }`}
      >
        {post.content}
      </p>
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map(tag => (
            <span
              key={tag}
              onClick={e => { e.stopPropagation(); onTagClick?.(tag); }}
              className="px-2 py-0.5 rounded-md bg-white/40 dark:bg-[#58a6ff]/25 text-[10px] font-bold text-[#197fe6] dark:text-[#ffffff] uppercase tracking-wider cursor-pointer hover:bg-[#197fe6]/10 dark:hover:bg-[#0f2435] dark:hover:text-[#0096ff] transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-3 text-[color:var(--color-fg-subtle)]">
        <button
          className={`flex items-center gap-1 transition-colors text-xs ${liked ? 'text-red-500 cursor-default' : 'hover:text-red-500'}`}
          onClick={handleLike}
        >
          <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '16px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>
        <button className="flex items-center gap-1 hover:text-[#197fe6] transition-colors text-xs">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat_bubble</span> {post.comments_count}
        </button>
      </div>
    </div>
  );
}

