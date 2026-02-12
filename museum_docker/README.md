# Docker 开发环境

## 服务说明

| 服务 | 容器名 | 端口 | 说明 | 连接信息 |
|------|--------|------|------|----------|
| PostgreSQL | museum-postgres | 5432 | 数据库 + pgvector | `postgresql://museum:123456@localhost:5432/museum` |
| MinIO API | museum-minio | 9000 | 对象存储 API | `minioadmin / minioadmin` |
| MinIO Console | museum-minio | 9001 | 对象存储管理界面 | http://localhost:9001 |

---

## 快速启动

```bash
cd docker
docker-compose up -d
```

---

## 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据（重置）
docker-compose down -v
```

---

## 数据库操作

```bash
# 连接数据库
docker exec -it museum-postgres psql -U museum -d museum

# 查看所有表
\dt

# 退出
\q
```

---

## MinIO 管理界面

打开浏览器访问：http://localhost:9001

- 用户名：`minioadmin`
- 密码：`minioadmin`
