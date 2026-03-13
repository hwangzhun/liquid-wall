const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');
const { cos, COS_BUCKET, COS_REGION, COS_PREFIX } = require('../utils/cos');

function extractCosKey(imageUrl) {
  if (!imageUrl) return null;
  
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    for (let i = 0; i < pathParts.length; i++) {
      const potentialKey = pathParts.slice(i).join('/');
      if (potentialKey.startsWith(COS_PREFIX)) {
        return potentialKey;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function deleteCosObject(key) {
  return new Promise((resolve, reject) => {
    cos.deleteObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: key,
    }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// GET /api/posts  (supports ?search= &tag= &page= &limit= &shuffle=)
router.get('/', (req, res) => {
  const db = getDb();
  const { search, tag, shuffle } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1, 1);
  const offset = (page - 1) * limit;

  let baseQuery = 'SELECT * FROM posts';
  let countQuery = 'SELECT COUNT(*) AS cnt FROM posts';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push("(content LIKE ? OR author LIKE ? OR title LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (tag) {
    conditions.push("tags LIKE ?");
    params.push(`%"${tag}"%`);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
  baseQuery  += whereClause;
  countQuery += whereClause;

  // Shuffle or chronological order
  baseQuery += shuffle === 'true' ? ' ORDER BY RANDOM()' : ' ORDER BY created_at DESC';

  // Pagination
  baseQuery += ' LIMIT ? OFFSET ?';

  const total = db.prepare(countQuery).get(...params).cnt;
  const posts = db.prepare(baseQuery).all(...params, limit, offset);

  // Parse tags JSON string back to array
  const result = posts.map(p => ({
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    image_crop: p.image_crop ? JSON.parse(p.image_crop) : null,
  }));

  res.json({ data: result, total, page, limit });
});

// GET /api/posts/tags - get all unique tags across all posts
router.get('/tags', (req, res) => {
  const db = getDb();
  const posts = db.prepare('SELECT tags FROM posts').all();
  const allTags = new Set();
  posts.forEach(p => {
    try {
      const tags = JSON.parse(p.tags || '[]');
      tags.forEach(t => allTags.add(t));
    } catch {}
  });
  res.json([...allTags].sort());
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  res.json({ ...post, tags: JSON.parse(post.tags || '[]'), image_crop: post.image_crop ? JSON.parse(post.image_crop) : null });
});

// POST /api/posts
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { type = 'text', author: rawAuthor, initials, avatar_url: rawAvatar, title, content, tags, image_url, image_crop } = req.body;

  // 使用 .env 中的默认值作为兜底
  const author = (rawAuthor && rawAuthor.trim()) || process.env.DEFAULT_AUTHOR || 'Anonymous';
  const avatar_url = rawAvatar || process.env.DEFAULT_AVATAR_URL || null;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  const stmt = db.prepare(`
    INSERT INTO posts (type, author, initials, avatar_url, title, content, tags, image_url, image_crop)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const autoInitials = initials || author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const imageCropJson = image_crop ? JSON.stringify(image_crop) : null;

  const result = stmt.run(type, author, autoInitials, avatar_url || null, title || null, content, tagsJson, image_url || null, imageCropJson);

  const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newPost, tags: JSON.parse(newPost.tags || '[]'), image_crop: newPost.image_crop ? JSON.parse(newPost.image_crop) : null });
});

// PUT /api/posts/:id/like
router.put('/:id/like', (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // 获取客户端 IP（兼容反向代理）
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  // 检查该 IP 是否已对该帖子点赞
  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND ip_address = ?').get(req.params.id, ip);
  if (existing) {
    return res.status(409).json({ error: '你已经点过赞了', alreadyLiked: true });
  }

  // 记录点赞并更新计数（事务保证原子性）
  db.transaction(() => {
    db.prepare('INSERT INTO post_likes (post_id, ip_address) VALUES (?, ?)').run(req.params.id, ip);
    db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(req.params.id);
  })();

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
});

// PUT /api/posts/:id  (edit post)
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { type, title, content, tags, image_url, image_crop } = req.body;

  if (content !== undefined && !content.trim()) {
    return res.status(400).json({ error: 'content cannot be empty' });
  }

  const newType = type !== undefined ? type : post.type;
  const newTitle = title !== undefined ? (title || null) : post.title;
  const newContent = content !== undefined ? content.trim() : post.content;
  const newTagsJson = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : post.tags;
  const newImageUrl = image_url !== undefined ? (image_url || null) : post.image_url;
  const newImageCrop = image_crop !== undefined ? (image_crop ? JSON.stringify(image_crop) : null) : post.image_crop;

  db.prepare(`
    UPDATE posts SET type = ?, title = ?, content = ?, tags = ?, image_url = ?, image_crop = ? WHERE id = ?
  `).run(newType, newTitle, newContent, newTagsJson, newImageUrl, newImageCrop, req.params.id);

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]'), image_crop: updated.image_crop ? JSON.parse(updated.image_crop) : null });
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  
  if (!post) return res.status(404).json({ error: 'Post not found' });

  let cosDeleteError = null;
  
  if (post.image_url) {
    const key = extractCosKey(post.image_url);
    
    if (key) {
      try {
        await deleteCosObject(key);
      } catch (err) {
        cosDeleteError = err;
        console.error('[COS delete error] post_id:', req.params.id, 'error:', err);
      }
    } else {
      console.warn('[COS delete warning] post_id:', req.params.id, 'message: Failed to extract COS key from URL:', post.image_url);
    }
  }

  try {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    
    if (cosDeleteError) {
      res.json({ 
        success: true, 
        warning: 'COS图片删除失败，但数据库记录已删除',
        cos_error: cosDeleteError.message 
      });
    } else {
      res.json({ success: true });
    }
  } catch (dbErr) {
    console.error('[Database delete error] post_id:', req.params.id, 'error:', dbErr);
    res.status(500).json({ 
      error: '数据库删除失败',
      details: dbErr.message 
    });
  }
});

module.exports = router;
