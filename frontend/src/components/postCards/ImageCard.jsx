import { Avatar, isLongContent, timeAgo, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

function useCroppedImage(imageUrl, imageCrop, cardWidth = 400, cardHeight = 192) {
  if (!imageCrop || !imageUrl) {
    return { src: imageUrl, style: {} };
  }
  const { scale = 1, x = 0, y = 0, refW = cardWidth, refH = cardHeight } = imageCrop;
  const scaleX = cardWidth / refW;
  const scaleY = cardHeight / refH;
  const adjustedX = x * scaleX;
  const adjustedY = y * scaleY;
  return {
    src: imageUrl,
    style: {
      transform: `translate(${adjustedX}px, ${adjustedY}px) scale(${scale})`,
      transformOrigin: '0 0',
    },
  };
}

/**
 * @param {BaseCardProps} props
 */
export function ImageCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  const cropped = useCroppedImage(post.image_url, post.image_crop, 400, 192);
  const hasCrop = !!post.image_crop;
  return (
    <div className="glass-card rounded-2xl p-0" onClick={onClick}>
      <div className="h-44 sm:h-48 w-full overflow-hidden relative rounded-t-2xl">
        {hasCrop ? (
          <div className="absolute inset-0">
            <img
              src={cropped.src}
              style={cropped.style}
              className="absolute left-0 top-0 max-w-none max-h-none select-none"
              alt="Content"
            />
          </div>
        ) : (
          <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Content" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 dark:from-black/40 to-transparent"></div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={post.avatar_url} initials={post.initials} />
            <span className="text-xs font-semibold text-[color:var(--color-fg-muted)]">{post.author}</span>
          </div>
          <span className="text-xs text-[color:var(--color-fg-subtle)]">{timeAgo(post.created_at)}</span>
        </div>
        <p className={`text-[color:var(--color-fg)] leading-relaxed mb-3 whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map(tag => (
              <span
                key={tag}
                onClick={e => { e.stopPropagation(); onTagClick?.(tag); }}
                className="px-2 py-1 rounded-md bg-white/40 dark:bg-[#58a6ff]/25 text-[10px] font-bold text-[color:var(--color-fg-subtle)] dark:text-[#ffffff] uppercase tracking-wider cursor-pointer hover:bg-[#197fe6]/10 dark:hover:bg-[#0f2435] hover:text-[#197fe6] dark:hover:text-[#0096ff] transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="pt-3 border-t border-white/30 dark:border-white/10 flex justify-between items-center">
          <div className="flex gap-4 text-[color:var(--color-fg-subtle)]">
            <button onClick={handleLike} className={`transition-colors flex items-center gap-1 text-xs ${liked ? 'text-red-500 cursor-default' : 'hover:text-red-500'}`}>
              <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '18px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              {post.likes}
            </button>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#197fe6] transition-colors" style={{ fontSize: '18px' }}>share</span>
          </div>
          <span className="text-[10px] text-[color:var(--color-fg-subtle)] font-medium">Read more</span>
        </div>
      </div>
    </div>
  );
}

