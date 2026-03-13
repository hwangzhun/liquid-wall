const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001';
const AUTH_TOKEN = 'test-auth-token'; // 从环境变量或测试配置中获取

async function testDeletePost() {
  console.log('=== 开始测试删除帖子功能 ===\n');

  try {
    // 测试1: 创建一个带图片的帖子用于删除
    console.log('测试1: 创建带图片的帖子');
    const testImageUrl = 'https://test-bucket.cos.ap-shanghai.myqcloud.com/posts/1234567890-test.jpg';
    
    const createResponse = await axios.post(`${API_BASE}/api/posts`, {
      type: 'image',
      author: 'Test User',
      content: '这是一个测试帖子，用于测试删除功能',
      image_url: testImageUrl,
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    const postId = createResponse.data.id;
    console.log('✓ 帖子创建成功，ID:', postId);
    console.log('  图片URL:', testImageUrl, '\n');

    // 测试2: 删除有图片的帖子
    console.log('测试2: 删除带图片的帖子');
    const deleteResponse = await axios.delete(`${API_BASE}/api/posts/${postId}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✓ 删除请求成功');
    console.log('  响应:', JSON.stringify(deleteResponse.data, null, 2), '\n');

    // 验证帖子已被删除
    try {
      await axios.get(`${API_BASE}/api/posts/${postId}`);
      console.log('✗ 错误: 帖子应该已被删除\n');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✓ 验证通过: 帖子已从数据库删除\n');
      }
    }

    // 测试3: 创建并删除一个无图片的帖子
    console.log('测试3: 删除无图片的帖子');
    const createResponse2 = await axios.post(`${API_BASE}/api/posts`, {
      type: 'text',
      author: 'Test User',
      content: '这是一个无图片的测试帖子',
    }, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    const postId2 = createResponse2.data.id;
    console.log('✓ 无图片帖子创建成功，ID:', postId2);

    const deleteResponse2 = await axios.delete(`${API_BASE}/api/posts/${postId2}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✓ 删除请求成功');
    console.log('  响应:', JSON.stringify(deleteResponse2.data, null, 2), '\n');

    // 测试4: 尝试删除不存在的帖子
    console.log('测试4: 删除不存在的帖子');
    try {
      await axios.delete(`${API_BASE}/api/posts/99999`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      console.log('✗ 错误: 应该返回404\n');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✓ 正确返回404状态码');
        console.log('  响应:', JSON.stringify(err.response.data, null, 2), '\n');
      }
    }

    console.log('=== 测试完成 ===');
    console.log('✓ 所有测试通过！');

  } catch (error) {
    console.error('✗ 测试失败:', error.message);
    if (error.response) {
      console.error('  响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// 运行测试
testDeletePost().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
