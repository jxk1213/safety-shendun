const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const moment = require('moment');

// 配置文件上传 (模板文件下发)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/templates/');
  },
  filename: (req, file, cb) => {
    cb(null, 'template_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/**
 * 1. 下发任务 (Dispatch Task for Self-check/Audit)
 */
router.post('/dispatch', upload.single('template_file'), (req, res) => {
  const { type, title, deadline } = req.body;
  const template_file = req.file ? `/uploads/templates/${req.file.filename}` : null;
  const dispatch_time = moment().format('YYYY-MM-DD HH:mm:ss');

  if (!type || !title) {
    return res.status(400).json({ error: '任务类型和标题是必填项' });
  }

  const query = `
    INSERT INTO hazard_tasks (type, title, dispatch_time, deadline, template_file, status, completion_rate, created_at)
    VALUES (?, ?, ?, ?, ?, '进行中', 0, CURRENT_TIMESTAMP)
  `;

  db.run(query, [type, title, dispatch_time, deadline, template_file], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, message: '任务下发成功', dispatch_time });
  });
});

/**
 * 2. 获取任务下发记录 (Get Task List)
 */
router.get('/', (req, res) => {
  const { type } = req.query;
  let query = `SELECT * FROM hazard_tasks WHERE 1=1 `;
  const params = [];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * 3. 更新任务进度/完成率
 */
router.patch('/:id/progress', (req, res) => {
  const { id } = req.params;
  const { completion_rate, status } = req.body;

  const query = `UPDATE hazard_tasks SET completion_rate = ?, status = ? WHERE id = ?`;
  db.run(query, [completion_rate, status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '任务进度已更新' });
  });
});

module.exports = router;
