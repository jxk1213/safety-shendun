const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'shendun_user',
  password: 'Shendun123!',
  database: 'shendun',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL 连接失败:', err.message);
    return;
  }
  console.log('已连接到 MySQL 数据库 (shendun)');
  connection.release();
  initializeTables();
});

async function initializeTables() {
  try {
    await promisePool.query(`CREATE TABLE IF NOT EXISTS risks (
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
      control_measures TEXT,
      emergency_measures TEXT,
      control_level VARCHAR(100),
      person_in_charge VARCHAR(100),
      domain VARCHAR(50) DEFAULT '转运中心',
      risk_area VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const columnsToAdd = [
      "ALTER TABLE risks ADD COLUMN control_measures TEXT",
      "ALTER TABLE risks ADD COLUMN emergency_measures TEXT",
      "ALTER TABLE risks ADD COLUMN control_level VARCHAR(100)",
      "ALTER TABLE risks ADD COLUMN person_in_charge VARCHAR(100)",
      "ALTER TABLE risks ADD COLUMN domain VARCHAR(50) DEFAULT '转运中心'",
      "ALTER TABLE risks ADD COLUMN risk_area VARCHAR(255)"
    ];
    for (const ddl of columnsToAdd) {
      try {
        await promisePool.query(ddl);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.warn('新增列失败:', e.message);
      }
    }

    await promisePool.query(`CREATE TABLE IF NOT EXISTS checklists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      filepath VARCHAR(512),
      type VARCHAR(50) DEFAULT 'self-check',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await promisePool.query(`CREATE TABLE IF NOT EXISTS hazard_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      dispatch_time DATETIME,
      deadline DATETIME,
      template_file VARCHAR(512),
      target_area VARCHAR(100),
      target_province VARCHAR(100),
      target_center VARCHAR(100),
      executor_area VARCHAR(100),
      executor_province VARCHAR(100),
      executor_center VARCHAR(100),
      status VARCHAR(50) DEFAULT '进行中',
      completion_rate DOUBLE DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    
    const taskColumnsToAdd = [
      "ALTER TABLE hazard_tasks ADD COLUMN target_area VARCHAR(100)",
      "ALTER TABLE hazard_tasks ADD COLUMN target_province VARCHAR(100)",
      "ALTER TABLE hazard_tasks ADD COLUMN target_center VARCHAR(100)",
      "ALTER TABLE hazard_tasks ADD COLUMN executor_area VARCHAR(100)",
      "ALTER TABLE hazard_tasks ADD COLUMN executor_province VARCHAR(100)",
      "ALTER TABLE hazard_tasks ADD COLUMN executor_center VARCHAR(100)"
    ];
    for (const ddl of taskColumnsToAdd) {
      try {
        await promisePool.query(ddl);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.warn('新增 hazard_tasks 列失败:', e.message);
      }
    }

    const checklistColumnsToAdd = [
      "ALTER TABLE checklists ADD COLUMN type VARCHAR(50) DEFAULT 'self-check'"
    ];
    for (const ddl of checklistColumnsToAdd) {
      try {
        await promisePool.query(ddl);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') console.warn('新增 checklists 列失败:', e.message);
      }
    }

    await promisePool.query(`CREATE TABLE IF NOT EXISTS hazards (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await promisePool.query(`CREATE TABLE IF NOT EXISTS hazard_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hazard_id INT NOT NULL,
      action VARCHAR(100) NOT NULL,
      operator VARCHAR(100),
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await promisePool.query(`CREATE TABLE IF NOT EXISTS accidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      serial_number VARCHAR(100),
      person_name VARCHAR(100),
      unit VARCHAR(255),
      province VARCHAR(100),
      accident_date DATETIME,
      month VARCHAR(50),
      description TEXT,
      injured_part VARCHAR(255),
      accident_type VARCHAR(100),
      area VARCHAR(100),
      center VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    console.log('MySQL 数据表初始化完成');
  } catch (err) {
    console.error('建表失败:', err.message);
  }
}

module.exports = pool;
module.exports.promisePool = promisePool;
