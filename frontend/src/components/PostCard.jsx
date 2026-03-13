import { ArticleCard } from './postCards/ArticleCard';
import { ImageCard } from './postCards/ImageCard';
import { LocationCard } from './postCards/LocationCard';
import { PromptCard } from './postCards/PromptCard';
import { QuoteCard } from './postCards/QuoteCard';
import { TextCard } from './postCards/TextCard';

// Main PostCard dispatcher
export default function PostCard({ post, onLike, liked, onClick, onTagClick }) {
  const props = { post, onLike, liked, onClick, onTagClick };
  switch (post.type) {
    case 'image':   return <ImageCard {...props} />;
    case 'quote':   return <QuoteCard {...props} />;
    case 'article': return <ArticleCard {...props} />;
    case 'media':   return <LocationCard {...props} />; // backward compat
    case 'location': return <LocationCard {...props} />;
    case 'prompt':  return <PromptCard {...props} />;
    default:        return <TextCard {...props} />;
  }
}
