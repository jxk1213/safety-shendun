-- 申盾智能安全平台 - MySQL 初始化脚本
-- 数据库: shendun  用户: shendun_user

CREATE DATABASE IF NOT EXISTS shendun DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shendun;

CREATE TABLE IF NOT EXISTS risks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  risk_point TEXT NOT NULL,
  hazard_factors TEXT,
  accident_type TEXT,
  l_value DOUBLE DEFAULT 0,
  e_value DOUBLE DEFAULT 0,
  c_value DOUBLE DEFAULT 0,
  d_value DOUBLE DEFAULT 0,
  risk_level VARCHAR(50),
  status VARCHAR(50) DEFAULT '待评审',
  reject_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hazard_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  dispatch_time DATETIME,
  deadline DATETIME,
  template_file VARCHAR(512),
  status VARCHAR(50) DEFAULT '进行中',
  completion_rate DOUBLE DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hazards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT,
  source_type VARCHAR(50) DEFAULT 'manual',
  report_time DATETIME,
  area VARCHAR(100),
  province VARCHAR(100),
  center VARCHAR(100),
  category VARCHAR(100),
  content TEXT,
  photo_before TEXT,
  description TEXT,
  rectify_time DATETIME,
  photo_after TEXT,
  rectify_description TEXT,
  status VARCHAR(50) DEFAULT '待稽核',
  rectifier VARCHAR(100),
  is_closed TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES hazard_tasks (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS hazard_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hazard_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  operator VARCHAR(100),
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hazard_id) REFERENCES hazards (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
