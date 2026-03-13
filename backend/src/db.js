const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'text',
      author TEXT NOT NULL,
      initials TEXT,
      avatar_url TEXT,
      title TEXT,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      image_url TEXT,
      image_crop TEXT,
      likes INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 迁移：为已有数据库添加 image_crop 列
  try {
    db.exec(`ALTER TABLE posts ADD COLUMN image_crop TEXT`);
  } catch (e) {
    // 列已存在，忽略错误
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      ip_address TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, ip_address),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM posts').get();
  if (count.c === 0) {
    seedData();
  }
}

function seedData() {
  const insert = db.prepare(`
    INSERT INTO posts (type, author, initials, avatar_url, title, content, tags, image_url, likes, comments_count, created_at)
    VALUES (@type, @author, @initials, @avatar_url, @title, @content, @tags, @image_url, @likes, @comments_count, @created_at)
  `);

  const seeds = [
    {
      type: 'text',
      author: 'Sarah Jenkins',
      initials: 'SJ',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHXOCCVLi4NQ1DGe0TTJyjJ0z0Vg-aZsYv4-27c934HVrK9_0LS-k_pDpuhnwqgWSvzPY1rM44mP0rF-ntk3lXt9ywgpgyX7nP7oXLcA_cUvVGbnPeooHDANUEaCbRvnIPW1LG-i4_wJ36tv2YikKYA3WzInn-QDJBpwnIi5dOXXPANbfCyIf5kIV90w0sAZXLbDuE_9w4g58nHOLEIsfHz6rUbag101HdyMA8oMvqAGuQLqZ3IBfCU8RwMfPKmI_qFtdSZBq-kFY',
      title: null,
      content: 'Just discovered the beauty of glassmorphism. It adds such a depth to the UI without overwhelming the content. ✨',
      tags: '["Design","CSS"]',
      image_url: null,
      likes: 24,
      comments_count: 3,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      type: 'image',
      author: 'Davide Rossi',
      initials: 'DR',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuficfLZnOZF2vBbcP8J0s_ft0Z_lgSNfo29C6T_TGvBRriVu8Jj0F5vOR0Y3R0b-A49TP6_J4OtO_U10qMsmhMSpbplK2OuME2kNNWfsVArM2kkIcx0LHRNiWuskMFpgRYbxeA5A-1jZpuOXYyZj5buHRrO4M_xxOw3dMllthemMlyXd9eIx30SLgnSNa1XEURITiVzp5QJTdxYabCQJAXhvrkukPub4-f0YxC6V2AKsnGMNfIwI_tdgTwmI5za-rDmNTh9XDE5U',
      title: null,
      content: 'Sunday mood. The colors of the sky today were absolutely unreal. Taking a moment to breathe.',
      tags: '["Inspiration","Design"]',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOhc8C8aWzLNJjSUVOJ-pPkiLmhnJPGtwO4hzdypPGRvi-xZ_RCwBeOVaJYPt-lB03vuiGYrBy-mtRJF5bkWirQ_SHKvC_zqVgmRf2DnSJ_DzQOxuPzGv4e3hHrH4x8s-nEH5L6LWcoj2dWR7uBDD6z0J2MJtnWFqSMdErO7frci8DqRZHMdM47pagUwda6PzULP0iqhBhcu3xzjpN-hfXpDiXuXRQCRj3MG5SjqFWDPCKdiYohZnwKOyTafkIl3xaPuJAasJ0cRY',
      likes: 41,
      comments_count: 7,
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      type: 'quote',
      author: 'Leonardo da Vinci',
      initials: 'LV',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxshErpCEij5CNHhPHd8Gddwm6j8q68ghVipzlOkvvE-ovou9--V43h01oGa7a2QYh2ykSCAjCScg1v3AgraR0YYwdSyWvREnQ2nul5vxElEFdhvnnxUQ2nmC43E0LyDtLQo-DSSRU1sCdhQH7BQFSICb3SWXhh_OUJLi2StkguzBKOP-h0pKZ3iB2ClXHTqlYFCzmJV3oGmn6x_oMh2IK4fk1HszWnI_hmFw8INeIwKY6o98hTp-NpGKyh1jGT0dZC1vaUFQovXs',
      title: 'Artist & Inventor',
      content: '"Simplicity is the ultimate sophistication."',
      tags: '["Philosophy"]',
      image_url: null,
      likes: 156,
      comments_count: 12,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'article',
      author: 'Maya K.',
      initials: 'MK',
      avatar_url: null,
      title: 'The Future of Interfaces',
      content: "We are moving towards interfaces that feel more organic. It's not just about flat design anymore, but about depth, material, and how elements interact with light. The liquid glass aesthetic isn't just a trend; it's an attempt to bring physical properties into the digital realm without skeuomorphism's literalness.",
      tags: '["Design","Technology"]',
      image_url: null,
      likes: 89,
      comments_count: 15,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'status',
      author: 'System',
      initials: 'SY',
      avatar_url: null,
      title: 'Project Update',
      content: 'Design system v2.0 deployed successfully.',
      tags: '["Update"]',
      image_url: null,
      likes: 32,
      comments_count: 2,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'media',
      author: 'Alex Chen',
      initials: 'AC',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBND2bQ0VjGXFsFKwPcs-l1GG6yitulVk3XGutVu54IY-l8f-sh7dHmZL4E5dYnj7kMneXjh7jFzpZcn9lcbE0LKgF1HyPCRdOWKbeUWKEBCyvU-qBxtxbhYXH7HoAQw6wVKcdGxSt4PWKczz7VpTJc5gd0TzcmVumke0xw3Y-ph8ljoaoSk-Xxv9N2RusD4QKZYJInEzRfZmSIRMZgQeR2mnlYe-D2lR5RIgDyW2PsUSfNHyFuwnD7Db1qxXmsDkMnEl4Ll1LB1eM',
      title: 'Chicago',
      content: 'Architecture tour downtown. The way the light hits these buildings is incredible.',
      tags: '["Photography","Travel"]',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4bdyQ4yi2S0AjoOixUfxptqMdAFqj9UCl4MAwwmiXyMCe2XJVOEC5Bv21GjZi2xWlUbrqhb21rnObqgGKF_ajCtvonUS9RDn-YzdMvCbaoPA4D1dfGxK7UweR1nSnBUc7_bVpnWc6QlU36XIqJ5Ufs-ReXvfYAAelrcT7h7EEZaqEWjjTTB13_K5DaS02veYNWAa0yEvZF_iz4NLfmOmiJ3Vt9gd9IWlA0q4b4K7LWj6QwFBC9xJOvT1omZBYLwBSTnpsqjWfLps',
      likes: 67,
      comments_count: 9,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'prompt',
      author: 'Community',
      initials: 'CM',
      avatar_url: null,
      title: 'Daily Prompt',
      content: "What would you build if you knew you couldn't fail?",
      tags: '["Idea","Discussion"]',
      image_url: null,
      likes: 203,
      comments_count: 15,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: 'simple',
      author: 'Jane Doe',
      initials: 'JD',
      avatar_url: null,
      title: null,
      content: '"Coffee is a liquid hug for your brain." ☕️',
      tags: '[]',
      image_url: null,
      likes: 18,
      comments_count: 4,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row);
    }
  });
  insertMany(seeds);
}

module.exports = { getDb };
