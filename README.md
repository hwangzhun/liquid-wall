# Liquid Wall

Liquid Glass Message Wall - Full Stack Website

## 技术栈

- 前端: React 19 + Vite 7 + Tailwind CSS 4
- 后端: Node.js + Express 5
- 数据库: SQLite (better-sqlite3)

## 本地开发

```bash
# 安装依赖
npm run install:all

# 启动（后端 + 前端）
npm run dev
```

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001

## Docker 部署

### 前置要求

- Docker 与 Docker Compose
- 已构建前端静态文件

### 部署步骤

1. **配置环境变量**

   ```bash
   cp .env.example .env
   # 编辑 .env，设置 ADMIN_PASSWORD 和 JWT_SECRET
   ```

2. **构建前端**

   ```bash
   cd frontend && npm run build && cd ..
   ```

3. **启动服务**

   ```bash
   docker compose up -d --build
   ```

4. **访问应用**

   http://localhost

### 数据目录

- 数据库文件持久化在 `./data` 目录
- SQLite 文件路径: `./data/database.sqlite`
- 容器删除后，数据仍保留在 `./data` 中

## 服务器迁移

迁移时只需拷贝数据目录即可保留全部数据：

1. 停止服务: `docker compose down`
2. 将整个 `./data` 目录拷贝到新服务器（含 `database.sqlite`、`database.sqlite-wal`、`database.sqlite-shm`）
3. 在新服务器拉取代码，复制 `.env` 配置
4. 构建前端: `cd frontend && npm run build && cd ..`
5. 启动: `docker compose up -d --build`

## 备份

定期备份 `./data` 目录即可完成数据库备份。

## License

ISC
