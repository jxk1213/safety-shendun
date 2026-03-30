const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const moment = require('moment');

router.post('/dispatch', (req, res) => {
  const { type, title, deadline, template_file, target_area, target_province, target_center } = req.body;
  const dispatch_time = moment().format('YYYY-MM-DD HH:mm:ss');

  if (!type || !title) {
    return res.status(400).json({ error: '任务类型和标题是必填项' });
  }

  const query = `
    INSERT INTO hazard_tasks (type, title, dispatch_time, deadline, template_file, target_area, target_province, target_center, status, completion_rate, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '进行中', 0, NOW())
  `;

  const params = [
    type, title, dispatch_time, deadline || null, template_file || null,
    target_area || null, target_province || null, target_center || null
  ];

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: results.insertId, message: '任务下发成功', dispatch_time });
  });
});

router.get('/', (req, res) => {
  const { type } = req.query;
  let query = `SELECT * FROM hazard_tasks WHERE 1=1 `;
  const params = [];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC`;

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.patch('/:id/progress', (req, res) => {
  const { id } = req.params;
  const { completion_rate, status } = req.body;

  db.query(`UPDATE hazard_tasks SET completion_rate = ?, status = ? WHERE id = ?`, [completion_rate, status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '任务进度已更新' });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM hazard_tasks WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '任务已删除' });
  });
});

module.exports = router;
