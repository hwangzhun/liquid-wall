const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/authMiddleware');
const { cos, COS_BUCKET, COS_REGION, COS_PREFIX, COS_SIGNED_URL_EXPIRES } = require('../utils/cos');

const router = express.Router();

// Store file in memory; we push buffer directly to COS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('仅支持图片上传'));
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!COS_BUCKET || !COS_REGION || !process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY) {
      return res.status(500).json({ error: 'COS 未正确配置，请联系管理员' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: '缺少图片文件' });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const key = `${COS_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
      (err, data) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('[COS upload error]', err);
          return res.status(500).json({ error: '图片上传失败，请稍后重试' });
        }

        // 生成预签名 URL
        const signedUrl = cos.getObjectUrl({
          Bucket: COS_BUCKET,
          Region: COS_REGION,
          Key: key,
          Sign: true,
          Expires: COS_SIGNED_URL_EXPIRES,
        });

        res.json({ image_url: signedUrl });
      }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[upload error]', err);
    res.status(500).json({ error: '上传失败，请稍后重试' });
  }
});

module.exports = router;

