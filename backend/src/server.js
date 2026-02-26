require('dotenv').config();

const express = require('express');
const cors = require('cors');
const postsRouter = require('./routes/posts');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// JSON error handler – ensures all errors (including body-parser failures) return JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[server] Liquid Wall API running on http://localhost:${PORT}`);
});
