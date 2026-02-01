#!/bin/bash

# ============================================
# GoalGazer 数据库备份脚本
# ============================================

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 设置备份目录
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/goalgazer_backup_$TIMESTAMP.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "🚀 开始备份数据库..."
echo "备份文件: $BACKUP_FILE"

# 方式1: 备份整个数据库（推荐）
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功！"
    echo "📦 备份文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # 压缩备份文件（可选）
    gzip "$BACKUP_FILE"
    echo "🗜️  已压缩为: ${BACKUP_FILE}.gz"
else
    echo "❌ 备份失败！"
    exit 1
fi

# 清理7天前的备份（可选）
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "goalgazer_backup_*.sql.gz" -mtime +7 -delete
echo "✅ 完成！"
