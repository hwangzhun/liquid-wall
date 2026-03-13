import { Avatar, isLongContent, timeAgo, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

/**
 * @param {BaseCardProps} props
 */
export function ArticleCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  const progress = Math.min(100, Math.max(10, (post.content?.length || 0) % 100 + 30));
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6" onClick={onClick}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.avatar_url} initials={post.initials} />
          <span className="text-xs font-semibold text-[color:var(--color-fg-muted)]">{post.author}</span>
        </div>
        <span className="text-xs text-[color:var(--color-fg-subtle)]">{timeAgo(post.created_at)}</span>
      </div>
      <h3 className="font-bold text-[color:var(--color-fg)] text-base sm:text-lg mb-2">{post.title}</h3>
      <p className={`text-[color:var(--color-fg-muted)] leading-relaxed mb-4 whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
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
      <div className="w-full h-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-[#197fe6]/60 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex justify-between items-center text-xs text-[color:var(--color-fg-subtle)]">
        <div className="flex items-center gap-3">
          <span>3 min read</span>
          <button onClick={handleLike} className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500 cursor-default' : 'hover:text-red-500'}`}>
            <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '14px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            {post.likes}
          </button>
          <button className="flex items-center gap-1 hover:text-[#197fe6] transition-colors" onClick={e => e.stopPropagation()}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat_bubble</span>
            {post.comments_count}
          </button>
        </div>
        <button className="text-[#197fe6] font-medium hover:underline">Continue reading</button>
      </div>
    </div>
  );
}

