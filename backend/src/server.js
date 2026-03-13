const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const postsRouter = require('./routes/posts');
const uploadRouter = require('./routes/upload');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/upload', uploadRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Production: serve frontend static files and SPA fallback
if (process.env.NODE_ENV === 'production') {
  const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, '../../frontend/dist');
  const fs = require('fs');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  }
}

// JSON error handler – ensures all errors (including body-parser failures) return JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[server] Liquid Wall API running on http://localhost:${PORT}`);
});
