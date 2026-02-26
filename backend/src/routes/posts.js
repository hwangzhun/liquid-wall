const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');

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

  res.json({ ...post, tags: JSON.parse(post.tags || '[]') });
});

// POST /api/posts
router.post('/', requireAuth, (req, res) => {
  const db = getDb();
  const { type = 'text', author: rawAuthor, initials, avatar_url: rawAvatar, title, content, tags, image_url } = req.body;

  // 使用 .env 中的默认值作为兜底
  const author = (rawAuthor && rawAuthor.trim()) || process.env.DEFAULT_AUTHOR || 'Anonymous';
  const avatar_url = rawAvatar || process.env.DEFAULT_AVATAR_URL || null;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

  const stmt = db.prepare(`
    INSERT INTO posts (type, author, initials, avatar_url, title, content, tags, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const autoInitials = initials || author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const result = stmt.run(type, author, autoInitials, avatar_url || null, title || null, content, tagsJson, image_url || null);

  const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newPost, tags: JSON.parse(newPost.tags || '[]') });
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

  const { type, title, content, tags } = req.body;

  if (content !== undefined && !content.trim()) {
    return res.status(400).json({ error: 'content cannot be empty' });
  }

  const newType = type !== undefined ? type : post.type;
  const newTitle = title !== undefined ? (title || null) : post.title;
  const newContent = content !== undefined ? content.trim() : post.content;
  const newTagsJson = tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : []) : post.tags;

  db.prepare(`
    UPDATE posts SET type = ?, title = ?, content = ?, tags = ? WHERE id = ?
  `).run(newType, newTitle, newContent, newTagsJson, req.params.id);

  const updated = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: JSON.parse(updated.tags || '[]') });
});

// DELETE /api/posts/:id
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
