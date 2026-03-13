const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || '',
  SecretKey: process.env.COS_SECRET_KEY || '',
});

const COS_BUCKET = process.env.COS_BUCKET || '';
const COS_REGION = process.env.COS_REGION || '';
const COS_PREFIX = process.env.COS_PREFIX || 'posts/';
const COS_SIGNED_URL_EXPIRES = parseInt(process.env.COS_SIGNED_URL_EXPIRES || '31536000', 10);

module.exports = {
  cos,
  COS_BUCKET,
  COS_REGION,
  COS_PREFIX,
  COS_SIGNED_URL_EXPIRES,
};
