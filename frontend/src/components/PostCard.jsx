import { useState, useCallback } from 'react';

const LONG_CONTENT_THRESHOLD = 150;

function isLongContent(content) {
  return (content?.length || 0) > LONG_CONTENT_THRESHOLD;
}

function timeAgo(dateStr) {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ src, initials, size = 8, className = '' }) {
  const px = size * 4;
  const sizeStyle = { width: `${px}px`, height: `${px}px`, minWidth: `${px}px` };
  if (src) {
  return (
    <div className={`rounded-full overflow-hidden border border-white/50 dark:border-white/20 shadow-sm ${className}`} style={sizeStyle}>
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
    <div className={`rounded-full ${color} flex items-center justify-center font-bold text-xs border border-white/50 dark:border-white/20 shadow-sm ${className}`} style={sizeStyle}>
      {initials?.slice(0, 2) || '?'}
    </div>
  );
}

/** Reusable hook for like-pop animation */
function useLikePop(onLike, liked) {
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

// Text Card
function TextCard({ post, onLike, liked, onClick, onTagClick }) {
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
      <p className={`text-[color:var(--color-fg)] leading-relaxed font-normal whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>{post.content}</p>
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

// Image Card
function ImageCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-0" onClick={onClick}>
      <div className="h-44 sm:h-48 w-full overflow-hidden relative rounded-t-2xl">
        <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Content" />
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

// Quote Card
function QuoteCard({ post, onLike, liked, onClick }) {
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

// Article Card
function ArticleCard({ post, onLike, liked, onClick, onTagClick }) {
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

// Status Card
function StatusCard({ post, onLike, liked, onClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4" onClick={onClick}>
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[color:var(--color-fg)] truncate">{post.title}</p>
        <p className="text-xs text-[color:var(--color-fg-subtle)] mt-0.5">{post.content}</p>
      </div>
      <button
        onClick={handleLike}
        className={`flex items-center gap-1 transition-colors text-xs shrink-0 ${liked ? 'text-red-500 cursor-default' : 'text-[color:var(--color-fg-subtle)] hover:text-red-500'}`}
      >
        <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '16px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        {post.likes}
      </button>
    </div>
  );
}

// Media Card
function MediaCard({ post, onLike, liked, onClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-0 overflow-hidden group" onClick={onClick}>
      <div className="h-36 sm:h-40 bg-slate-200 dark:bg-slate-800/80 relative">
        <img src={post.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Media" />
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

// Prompt Card
function PromptCard({ post, onLike, liked, onClick, onTagClick }) {
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

// Simple Card
function SimpleCard({ post, onLike, liked, onClick, onTagClick }) {
  const { popping, handleLike } = useLikePop(onLike, liked);
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5" onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar src={post.avatar_url} initials={post.initials} size={6} />
          <span className="text-xs font-semibold text-[color:var(--color-fg-muted)]">{post.author}</span>
        </div>
        <span className="text-[10px] text-[color:var(--color-fg-subtle)]">{timeAgo(post.created_at)}</span>
      </div>
      <p className={`text-[color:var(--color-fg-muted)] italic whitespace-pre-wrap ${isLongContent(post.content) ? 'text-xs' : 'text-sm'}`}>{post.content}</p>
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
      <div className="mt-3 flex items-center gap-3 text-[color:var(--color-fg-subtle)]">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors text-xs ${liked ? 'text-red-500 cursor-default' : 'hover:text-red-500'}`}
        >
          <span className={`material-symbols-outlined ${popping ? 'like-pop' : ''}`} style={{ fontSize: '14px', fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          {post.likes}
        </button>
        <button className="flex items-center gap-1 hover:text-[#197fe6] transition-colors text-xs" onClick={e => e.stopPropagation()}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat_bubble</span>
          {post.comments_count}
        </button>
      </div>
    </div>
  );
}

// Main PostCard dispatcher
export default function PostCard({ post, onLike, liked, onClick, onTagClick }) {
  const props = { post, onLike, liked, onClick, onTagClick };
  switch (post.type) {
    case 'image':   return <ImageCard {...props} />;
    case 'quote':   return <QuoteCard {...props} />;
    case 'article': return <ArticleCard {...props} />;
    case 'status':  return <StatusCard {...props} />;
    case 'media':   return <MediaCard {...props} />;
    case 'prompt':  return <PromptCard {...props} />;
    case 'simple':  return <SimpleCard {...props} />;
    default:        return <TextCard {...props} />;
  }
}
