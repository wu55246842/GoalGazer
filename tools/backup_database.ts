/**
 * GoalGazer 数据库备份工具 (Node.js/TypeScript版本)
 * 
 * 使用方式:
 * npx tsx tools/backup_database_fixed.ts
 * npx tsx tools/backup_database_fixed.ts --table matches
 * npx tsx tools/backup_database_fixed.ts --format json
 */

import { config } from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// 从项目根目录加载.env文件
config({ path: join(process.cwd(), '.env') });

// 验证环境变量是否加载
if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 未设置');
    console.error('请确保项目根目录存在 .env 文件，并包含 DATABASE_URL');
    process.exit(1);
}

console.log('✅ 数据库配置已加载');

const BACKUP_DIR = './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// 解析命令行参数
const args = process.argv.slice(2);
const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'sql';
const specificTable = args.includes('--table') ? args[args.indexOf('--table') + 1] : null;

async function backupDatabase() {
    console.log('\n🚀 开始备份数据库...\n');

    // 动态导入数据库模块（确保在环境变量加载之后）
    const { default: sql } = await import('../apps/web/lib/db.js');

    // 创建备份目录
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    try {
        if (specificTable) {
            await backupTable(specificTable, sql);
        } else {
            await backupAllTables(sql);
        }

        console.log('\n✅ 备份完成！');
    } catch (error) {
        console.error('❌ 备份失败:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

async function backupAllTables(sql: any) {
    const tables = ['matches', 'match_content', 'daily_digests'];

    for (const table of tables) {
        await backupTable(table, sql);
    }
}

async function backupTable(tableName: string, sql: any) {
    console.log(`📦 备份表: ${tableName}...`);

    const rows = await sql.unsafe(`SELECT * FROM ${tableName}`);

    if (format === 'json') {
        // JSON格式备份
        const filename = path.join(BACKUP_DIR, `${tableName}_${TIMESTAMP}.json`);
        fs.writeFileSync(filename, JSON.stringify(rows, null, 2));
        const size = (fs.statSync(filename).size / 1024).toFixed(2);
        console.log(`   ✓ ${filename} (${size} KB, ${rows.length} 条记录)`);
    } else {
        // SQL INSERT语句格式
        const filename = path.join(BACKUP_DIR, `${tableName}_${TIMESTAMP}.sql`);
        let sqlContent = `-- Backup of ${tableName} at ${new Date().toISOString()}\n\n`;

        if (rows.length > 0) {
            const columns = Object.keys(rows[0]);

            rows.forEach(row => {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    if (val instanceof Date) return `'${val.toISOString()}'`;
                    return val;
                }).join(', ');

                sqlContent += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
            });
        }

        fs.writeFileSync(filename, sqlContent);
        const size = (fs.statSync(filename).size / 1024).toFixed(2);
        console.log(`   ✓ ${filename} (${size} KB, ${rows.length} 条记录)`);
    }
}

// 主程序
backupDatabase();
