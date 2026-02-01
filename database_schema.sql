-- ============================================
-- GoalGazer 数据库架构
-- 足球比赛分析平台数据表
-- ============================================
-- --------------------------------------------
-- 1. 比赛基础信息表 (matches)
-- 存储比赛的核心元数据
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    -- 自增主键
    match_id VARCHAR(50) UNIQUE NOT NULL,
    -- 比赛唯一标识符（来自API）
    league VARCHAR(50),
    -- 联赛名称（如 'epl', 'la-liga'等）
    season VARCHAR(20),
    -- 赛季（如 '2024', '2023-24'）
    home_team VARCHAR(100),
    -- 主队名称
    away_team VARCHAR(100),
    -- 客队名称
    date_utc TIMESTAMP WITH TIME ZONE,
    -- 比赛时间（UTC时区）
    score VARCHAR(20),
    -- 比分（如 '2-1'）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 记录创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 记录更新时间
);
-- 为match_id创建唯一索引（已通过UNIQUE约束实现）
-- 为league和season创建复合索引以优化查询
CREATE INDEX IF NOT EXISTS idx_matches_league_season ON matches(league, season);
-- 为date_utc创建索引以优化时间范围查询
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date_utc);
-- --------------------------------------------
-- 2. 比赛内容表 (match_content)
-- 存储多语言的比赛分析内容
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS match_content (
    id SERIAL PRIMARY KEY,
    -- 自增主键
    match_id VARCHAR(50) REFERENCES matches(match_id) ON DELETE CASCADE,
    -- 外键关联matches表
    lang VARCHAR(10) NOT NULL,
    -- 语言代码（如 'en', 'zh', 'es'）
    title TEXT,
    -- 文章标题
    description TEXT,
    -- 文章描述/摘要
    slug TEXT,
    -- URL友好的slug
    content JSONB,
    -- JSON格式的文章内容（包含战术分析、可视化等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 记录创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 记录更新时间
    UNIQUE(match_id, lang) -- 每场比赛每种语言只有一条记录
);
-- 为match_id创建索引
CREATE INDEX IF NOT EXISTS idx_match_content_match_id ON match_content(match_id);
-- 为lang创建索引
CREATE INDEX IF NOT EXISTS idx_match_content_lang ON match_content(lang);
-- 为slug创建索引以优化URL查询
CREATE INDEX IF NOT EXISTS idx_match_content_slug ON match_content(slug);
-- --------------------------------------------
-- 3. 每日摘要表 (daily_digests)
-- 存储每日的比赛摘要和综合分析
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS daily_digests (
    id SERIAL PRIMARY KEY,
    -- 自增主键
    date_str VARCHAR(20) NOT NULL,
    -- 日期字符串（如 '2024-01-30'）
    lang VARCHAR(10) NOT NULL,
    -- 语言代码（如 'en', 'zh'）
    league VARCHAR(50) NOT NULL DEFAULT 'epl',
    -- 联赛标识符
    title TEXT,
    -- 每日摘要标题
    headline TEXT,
    -- 头条新闻
    summary TEXT,
    -- 摘要文本
    comic_image_url TEXT,
    -- 漫画/配图URL
    financial_movements JSONB,
    -- 财务相关数据（JSON格式）
    match_ids JSONB,
    -- 当日比赛ID列表（JSON数组）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 记录创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 记录更新时间
    UNIQUE(date_str, lang, league) -- 每个日期、语言和联赛的组合唯一
);
-- 为date_str创建索引
CREATE INDEX IF NOT EXISTS idx_daily_digests_date ON daily_digests(date_str);
-- 为复合键创建索引
CREATE INDEX IF NOT EXISTS idx_daily_digests_date_lang_league ON daily_digests(date_str, lang, league);
-- ============================================
-- 说明
-- ============================================
-- 
-- 数据表关系:
-- 1. matches (比赛表) 1:N match_content (内容表)
--    - 一场比赛可以有多个语言版本的内容
--    - 通过match_id关联，级联删除
--
-- 2. daily_digests 独立表
--    - 通过match_ids字段（JSONB数组）关联matches
--    - 无外键约束，保持灵活性
--
-- 数据类型说明:
-- - JSONB: PostgreSQL的二进制JSON类型，支持高效查询和索引
-- - TIMESTAMP WITH TIME ZONE: 带时区的时间戳，确保全球化支持
-- - SERIAL: 自增整数类型
-- - VARCHAR(n): 可变长度字符串，最大长度n
-- - TEXT: 无长度限制的文本
--
-- 索引策略:
-- - 为所有外键创建索引以优化JOIN查询
-- - 为常用查询字段（日期、语言、联赛）创建索引
-- - 为唯一约束自动创建唯一索引