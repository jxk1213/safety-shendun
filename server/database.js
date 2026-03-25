const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment');

// 数据库文件路径
const DB_PATH = path.resolve(__dirname, 'data.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // 1. 风险上报表 (Risks)
    db.run(`CREATE TABLE IF NOT EXISTS risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      risk_point TEXT NOT NULL,
      hazard_factors TEXT,
      accident_type TEXT,
      l_value REAL DEFAULT 0,
      e_value REAL DEFAULT 0,
      c_value REAL DEFAULT 0,
      d_value REAL DEFAULT 0,
      risk_level TEXT,
      status TEXT DEFAULT '待评审',
      reject_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. 隐患下发任务表 (Dispatch Records / 下发记录)
    db.run(`CREATE TABLE IF NOT EXISTS hazard_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'self_check', 'security_audit', 'special_audit'
      title TEXT NOT NULL,
      dispatch_time DATETIME,
      deadline DATETIME,
      template_file TEXT, -- 上传的模板文件路径 (上传文件存储)
      status TEXT DEFAULT '进行中',
      completion_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. 隐患记录与稽核报告内容 (Hazards / 稽核报告内容)
    db.run(`CREATE TABLE IF NOT EXISTS hazards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER, -- 关联下发任务
      source_type TEXT DEFAULT 'manual', -- 'manual' (隐患上报), 'self_check' (自查自纠), 'audit' (安全稽核), 'special' (专项稽核)
      report_time DATETIME,
      area TEXT,
      province TEXT,
      center TEXT,
      category TEXT,
      content TEXT,
      photo_before TEXT,
      description TEXT,
      rectify_time DATETIME,
      photo_after TEXT,
      rectify_description TEXT,
      status TEXT DEFAULT '待稽核',
      rectifier TEXT,
      is_closed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES hazard_tasks (id)
    )`);

    // 4. 隐患治理日志 (Hazard Logs / 闭环)
    db.run(`CREATE TABLE IF NOT EXISTS hazard_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hazard_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards (id)
    )`);
    
    console.log('Database tables updated: added tasks and enhanced hazard storage.');
  });
}

module.exports = db;
