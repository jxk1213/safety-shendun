-- 申盾智能 数据库初始化脚本
-- 请使用 root 用户执行: mysql -u root -p < setup_mysql.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS shendun DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户 (如果不存在)
CREATE USER IF NOT EXISTS 'shendun_user'@'localhost' IDENTIFIED BY 'Shendun123!';
CREATE USER IF NOT EXISTS 'shendun_user'@'127.0.0.1' IDENTIFIED BY 'Shendun123!';

-- 授权
GRANT ALL PRIVILEGES ON shendun.* TO 'shendun_user'@'localhost';
GRANT ALL PRIVILEGES ON shendun.* TO 'shendun_user'@'127.0.0.1';

-- 刷新权限
FLUSH PRIVILEGES;

USE shendun;

-- 后面会自动运行 database.js 中的建表逻辑
