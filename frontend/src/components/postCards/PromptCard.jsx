import { isLongContent, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

/**
 * @param {BaseCardProps} props
 */
export function PromptCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 bg-gradient-to-tr from-[#197fe6]/10 via-purple-500/10 to-pink-500/10 dark:from-[#197fe6]/15 dark:via-purple-500/15 dark:to-pink-500/10 dark:border-[#58a6ff]/25 border-[#197fe6]/20" onClick={onClick}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/60 dark:bg-white/10 shadow-sm flex items-center justify-center text-[#197fe6]">
          <span className="material-symbols-outlined">lightbulb</span>
        </div>
        {post.tags?.[0] && (
          <span
            onClick={e => { e.stopPropagation(); onTagClick?.(post.tags[0]); }}
            className="text-xs text-[color:var(--color-fg-subtle)] bg-white/40 dark:bg-[#58a6ff]/25 px-2 py-1 rounded-full cursor-pointer hover:bg-[#197fe6]/10 dark:hover:bg-[#0f2435] hover:text-[#197fe6] dark:hover:text-[#0096ff] transition-colors"
          >
            {post.tags[0]}
          </span>
        )}
      </div>
      <h4 className="font-bold text-[color:var(--color-fg)] mb-2 text-sm sm:text-base">{post.title}</h4>
      <p className={`text-[color:var(--color-fg-muted)] mb-4 whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
      <div className="flex -space-x-2 overflow-hidden mb-3">
        {[1, 2, 3].map(i => (
          <img key={i} className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white dark:ring-slate-800" src={`https://i.pravatar.cc/150?u=${post.id}${i}`} alt="Avatar" />
        ))}
        <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-[color:var(--color-border)] bg-[color:var(--color-surface-2)] flex items-center justify-center text-[8px] font-bold text-[color:var(--color-fg-subtle)]">
          +{post.comments_count}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={e => e.stopPropagation()} className="flex-1 py-2 rounded-lg bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-[#197fe6] text-xs font-bold transition-colors">
          Join Discussion
        </button>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs ${
            liked
              ? 'bg-red-50 dark:bg-red-900/20 text-red-500 cursor-default'
              : 'bg-white/50 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-[color:var(--color-fg-subtle)] hover:text-red-500'
          }`}
        >
          <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '14px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>
      </div>
    </div>
  );
}

