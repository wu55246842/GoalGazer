# ============================================
# GoalGazer 数据库备份脚本 (PowerShell版本)
# ============================================

# 加载环境变量
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -notmatch '^#' -and $_ -match '=') {
            $parts = $_ -split '=', 2
            [Environment]::SetEnvironmentVariable($parts[0], $parts[1])
        }
    }
}

$DATABASE_URL = $env:DATABASE_URL

# 设置备份目录
$BACKUP_DIR = ".\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\goalgazer_backup_$TIMESTAMP.sql"

# 创建备份目录
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "🚀 开始备份数据库..." -ForegroundColor Green
Write-Host "备份文件: $BACKUP_FILE"

# 使用pg_dump备份（需要安装PostgreSQL客户端）
# 或者使用psql导出数据
try {
    # 方式1: 使用pg_dump（推荐）
    & pg_dump $DATABASE_URL > $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库备份成功！" -ForegroundColor Green
        $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Host "📦 备份文件大小: $([math]::Round($fileSize, 2)) MB"
        
        # 压缩备份文件（可选）
        Compress-Archive -Path $BACKUP_FILE -DestinationPath "$BACKUP_FILE.zip" -Force
        Remove-Item $BACKUP_FILE
        Write-Host "🗜️  已压缩为: $BACKUP_FILE.zip" -ForegroundColor Green
    } else {
        Write-Host "❌ 备份失败！" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 错误: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "提示: 请确保已安装PostgreSQL客户端工具" -ForegroundColor Yellow
    Write-Host "或使用下面的备份脚本（使用Node.js）" -ForegroundColor Yellow
    exit 1
}

# 清理7天前的备份（可选）
Write-Host "🧹 清理旧备份..."
Get-ChildItem $BACKUP_DIR -Filter "goalgazer_backup_*.sql.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
Write-Host "✅ 完成！" -ForegroundColor Green
