# 数据库备份指南

## 📋 概述

本文档介绍如何备份GoalGazer项目的PostgreSQL数据库。

---

## 🚀 快速开始

### 方法1: 使用Node.js脚本（推荐，跨平台）

```bash
# 备份所有表为JSON格式
npx tsx tools/backup_database.ts --format json

# 备份所有表为SQL格式
npx tsx tools/backup_database.ts --format sql

# 只备份特定表
npx tsx tools/backup_database.ts --table matches --format json
```

**优点**：
- ✅ 跨平台（Windows/Mac/Linux）
- ✅ 不需要安装PostgreSQL客户端
- ✅ 支持JSON和SQL两种格式
- ✅ 自动创建备份目录

---

### 方法2: 使用PowerShell（Windows）

```powershell
# 需要先安装PostgreSQL客户端工具
.\tools\backup_database.ps1
```

---

### 方法3: 使用pg_dump（需要PostgreSQL客户端）

```bash
# Linux/Mac
chmod +x tools/backup_database.sh
./tools/backup_database.sh

# 或直接使用pg_dump命令
pg_dump "postgresql://postgres.xxx:password@host:5432/postgres" > backup.sql
```

---

## 📊 备份单个表

### 使用SQL COPY命令

```bash
# 1. 通过psql连接数据库
psql "$DATABASE_URL"

# 2. 导出为CSV
\copy matches TO 'matches_backup.csv' CSV HEADER;
\copy match_content TO 'match_content_backup.csv' CSV HEADER;
\copy daily_digests TO 'daily_digests_backup.csv' CSV HEADER;

# 3. 导出为JSON（需要生成JSON）
\copy (SELECT row_to_json(t) FROM matches t) TO 'matches_backup.json';
```

### 使用Node.js脚本

```typescript
// 创建自定义备份脚本
import sql from './apps/web/lib/db';
import * as fs from 'fs';

async function exportMatches() {
    const matches = await sql`SELECT * FROM matches`;
    fs.writeFileSync('matches_backup.json', JSON.stringify(matches, null, 2));
    console.log('✅ 导出完成！');
    await sql.end();
}

exportMatches();
```

---

## 🗄️ Supabase控制台备份

如果使用Supabase：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Database** → **Backups**
4. 点击 **Create Backup**（创建手动备份）
5. 下载备份文件

---

## 📦 完整数据库备份

### 使用pg_dump（完整备份）

```bash
# 备份整个数据库（包括结构和数据）
pg_dump "$DATABASE_URL" > goalgazer_full_backup.sql

# 只备份数据库结构（不含数据）
pg_dump --schema-only "$DATABASE_URL" > goalgazer_schema.sql

# 只备份数据（不含结构）
pg_dump --data-only "$DATABASE_URL" > goalgazer_data.sql

# 压缩备份
pg_dump "$DATABASE_URL" | gzip > goalgazer_backup.sql.gz
```

### Windows PowerShell版本

```powershell
# 设置数据库URL
$env:DATABASE_URL = "postgresql://user:pass@host:5432/db"

# 备份
pg_dump $env:DATABASE_URL | Out-File -Encoding UTF8 backup.sql

# 压缩
Compress-Archive -Path backup.sql -DestinationPath backup.sql.zip
```

---

## 🔄 恢复数据库

### 从SQL文件恢复

```bash
# 完整恢复
psql "$DATABASE_URL" < goalgazer_full_backup.sql

# 恢复特定表
psql "$DATABASE_URL" < matches_backup.sql
```

### 从JSON恢复

```typescript
import sql from './apps/web/lib/db';
import * as fs from 'fs';

async function restoreMatches() {
    const data = JSON.parse(fs.readFileSync('matches_backup.json', 'utf-8'));
    
    for (const row of data) {
        await sql`
            INSERT INTO matches ${sql(row)}
            ON CONFLICT (match_id) DO UPDATE SET
                home_team = EXCLUDED.home_team,
                away_team = EXCLUDED.away_team,
                score = EXCLUDED.score,
                image = EXCLUDED.image
        `;
    }
    
    console.log(`✅ 恢复了 ${data.length} 条记录`);
    await sql.end();
}

restoreMatches();
```

---

## 📅 自动化备份

### 使用cron（Linux/Mac）

```bash
# 编辑crontab
crontab -e

# 添加每天凌晨2点备份
0 2 * * * cd /path/to/GoalGazer && npx tsx tools/backup_database.ts --format json
```

### 使用Windows任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器（例如：每天凌晨2点）
4. 操作：运行PowerShell脚本
   ```
   powershell.exe -File "D:\Project\Front_end\nextjs\GoalGazer\tools\backup_database.ps1"
   ```

### 使用GitHub Actions

创建 `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch:  # 手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Backup Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx tsx tools/backup_database.ts --format json
      
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/
          retention-days: 30
```

---

## 🔐 备份文件管理

### 推荐的备份策略

1. **每日备份**：保留最近7天
2. **每周备份**：保留最近4周
3. **每月备份**：保留最近12个月

### 备份存储位置

- ✅ 云存储（Google Drive、Dropbox、OneDrive）
- ✅ 对象存储（AWS S3、Cloudflare R2）
- ✅ GitHub仓库（私有库，加密后）
- ✅ 外部硬盘

### 备份文件加密（可选）

```bash
# 加密备份文件
gpg -c goalgazer_backup.sql
# 输入密码后生成 goalgazer_backup.sql.gpg

# 解密
gpg goalgazer_backup.sql.gpg
```

---

## 📊 数据表说明

### matches（比赛基础信息）
- **大小**：约50-100 KB/100场比赛
- **备份频率**：每次有新比赛后

### match_content（比赛内容）
- **大小**：约1-5 MB/100场比赛（包含JSONB内容）
- **备份频率**：每次生成新内容后

### daily_digests（每日摘要）
- **大小**：约100-500 KB/月
- **备份频率**：每天

---

## ⚠️ 注意事项

1. **备份前检查空间**：确保有足够的磁盘空间
2. **测试恢复流程**：定期测试从备份恢复数据
3. **保护敏感信息**：不要将包含敏感信息的备份提交到公开仓库
4. **保留多个版本**：避免只保留单一备份
5. **异地备份**：将备份存储在不同地理位置

---

## 🆘 故障恢复

如果数据库损坏或数据丢失：

1. **停止应用**：防止更多数据写入
2. **评估损失**：确定哪些数据受影响
3. **选择备份**：找到最近的有效备份
4. **恢复数据**：使用上述恢复方法
5. **验证数据**：检查恢复后的数据完整性
6. **重启应用**：确认一切正常后重新上线

---

## 📞 相关资源

- [PostgreSQL备份文档](https://www.postgresql.org/docs/current/backup.html)
- [Supabase备份指南](https://supabase.com/docs/guides/platform/backups)
- [pg_dump手册](https://www.postgresql.org/docs/current/app-pgdump.html)
