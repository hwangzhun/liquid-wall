import { Avatar, isLongContent, useLikePop } from './shared';

/**
 * @typedef {import('./shared').BaseCardProps} BaseCardProps
 */

function useCroppedImage(imageUrl, imageCrop, cardWidth = 400, cardHeight = 160) {
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
export function LocationCard({ post, onLike, liked, onClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  const cropped = useCroppedImage(post.image_url, post.image_crop, 400, 160);
  const hasCrop = !!post.image_crop;
  return (
    <div className="glass-card rounded-2xl p-0 overflow-hidden group" onClick={onClick}>
      <div className="h-36 sm:h-40 bg-slate-200 dark:bg-slate-800/80 relative overflow-hidden">
        {hasCrop ? (
          <div className="absolute inset-0">
            <img
              src={cropped.src}
              style={cropped.style}
              className="absolute left-0 top-0 max-w-none max-h-none select-none"
              alt="Media"
            />
          </div>
        ) : (
          <img src={post.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Media" />
        )}
        {post.title && (
          <div className="absolute top-3 right-3 bg-white/80 dark:bg-black/30 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-[color:var(--color-fg)] shadow-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-red-500" style={{ fontSize: '12px' }}>location_on</span> {post.title}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={post.avatar_url} initials={post.initials} />
          <div>
            <p className="text-xs font-semibold text-[color:var(--color-fg-muted)]">{post.author}</p>
            <p className="text-[10px] text-[color:var(--color-fg-subtle)]">Travelling</p>
          </div>
        </div>
        <p className={`text-[color:var(--color-fg)] mb-3 whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors text-xs ${liked ? 'text-red-500 cursor-default' : 'text-[color:var(--color-fg-subtle)] hover:text-red-500'}`}
        >
          <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '16px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>
      </div>
    </div>
  );
}

