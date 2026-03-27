const express = require('express');
const router = express.Router();
const db = require('../database');
const { promisePool } = require('../database');
const multer = require('multer');
const path = require('path');
const moment = require('moment');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/report', upload.single('photo_before'), (req, res) => {
  const { area, province, center, category, content, description, source_type, task_id } = req.body;
  const photo_before = req.file ? `/uploads/${req.file.filename}` : null;
  const report_time = moment().format('YYYY-MM-DD HH:mm:ss');

  const query = `
    INSERT INTO hazards (report_time, area, province, center, category, content, description, photo_before, status, source_type, task_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待稽核', ?, ?, NOW())
  `;

  db.query(query, [report_time, area, province, center, category, content, description, photo_before, source_type || 'manual', task_id || null], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const hazardId = results.insertId;

    db.query(
      `INSERT INTO hazard_logs (hazard_id, action, operator, remark) VALUES (?, ?, ?, ?)`,
      [hazardId, '隐患发现/上报', '系统管理员', `类型为：${source_type || '常规上报'}。当前状态：待稽核`],
      (logErr) => {
        if (logErr) console.error('Error logging hazard creation:', logErr.message);
      }
    );

    res.status(201).json({
      id: hazardId,
      message: '数据已保存',
      status: '待稽核',
      photo_before,
      report_time
    });
  });
});

router.get('/', (req, res) => {
  const { area, province, center, category, status, source_type, task_id } = req.query;
  let query = `SELECT * FROM hazards WHERE 1=1 `;
  const params = [];

  if (area) { query += ` AND area = ?`; params.push(area); }
  if (province) { query += ` AND province = ?`; params.push(province); }
  if (center) { query += ` AND center = ?`; params.push(center); }
  if (category) { query += ` AND category = ?`; params.push(category); }
  if (status) { query += ` AND status = ?`; params.push(status); }
  if (source_type) { query += ` AND source_type = ?`; params.push(source_type); }
  if (task_id) { query += ` AND task_id = ?`; params.push(task_id); }

  query += ` ORDER BY report_time DESC`;

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.patch('/:id/audit', (req, res) => {
  const { id } = req.params;
  const { auditStatus, remark } = req.body;

  let newStatus = auditStatus === '稽核通过' ? '整改中' : '稽核不通过-待修正';

  db.query(`UPDATE hazards SET status = ? WHERE id = ?`, [newStatus, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `INSERT INTO hazard_logs (hazard_id, action, operator, remark) VALUES (?, ?, ?, ?)`,
      [id, '隐患稽核', '总部稽核员', `稽核结论为：${auditStatus}。当前状态：${newStatus}。备注：${remark || '无'}`],
      (logErr) => {
        if (logErr) console.error('Error logging audit:', logErr.message);
      }
    );

    res.json({ message: '稽核结果已提交', status: newStatus });
  });
});

router.post('/:id/rectify', upload.single('photo_after'), (req, res) => {
  const { id } = req.params;
  const { rectify_description, rectifier } = req.body;
  const photo_after = req.file ? `/uploads/${req.file.filename}` : null;
  const rectify_time = moment().format('YYYY-MM-DD HH:mm:ss');

  const query = `
    UPDATE hazards
    SET photo_after = COALESCE(?, photo_after), rectify_description = ?, rectify_time = ?, rectifier = ?, status = '待验收'
    WHERE id = ?
  `;

  db.query(query, [photo_after, rectify_description, rectify_time, rectifier, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `INSERT INTO hazard_logs (hazard_id, action, operator, remark) VALUES (?, ?, ?, ?)`,
      [id, '整改提交', rectifier, `整改已完成，提交验收。整改日期：${rectify_time}`],
      (logErr) => {
        if (logErr) console.error('Error logging rectification:', logErr.message);
      }
    );

    res.json({
      message: '整改记录已提交，等待验收',
      status: '待验收',
      photo_after,
      rectify_time
    });
  });
});

router.patch('/:id/close', (req, res) => {
  const { id } = req.params;
  const { acceptanceResult, remark } = req.body;

  let newStatus = acceptanceResult === '验收通过' ? '验收通过-关闭' : '整改中';
  let isClosed = acceptanceResult === '验收通过' ? 1 : 0;

  db.query(`UPDATE hazards SET status = ?, is_closed = ? WHERE id = ?`, [newStatus, isClosed, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `INSERT INTO hazard_logs (hazard_id, action, operator, remark) VALUES (?, ?, ?, ?)`,
      [id, '闭环验收', '安全部验收员', `验收结果：${acceptanceResult}。当前状态：${newStatus}。`],
      (logErr) => {
        if (logErr) console.error('Error logging closure:', logErr.message);
      }
    );

    res.json({ message: '闭环状态已更新', status: newStatus, is_closed: isClosed });
  });
});

router.get('/:id/logs', (req, res) => {
  const { id } = req.params;
  db.query(`SELECT * FROM hazard_logs WHERE hazard_id = ? ORDER BY created_at ASC`, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const hazardId = Number(id);
  if (!Number.isInteger(hazardId) || hazardId <= 0) {
    return res.status(400).json({ error: '无效的隐患ID' });
  }

  const conn = await promisePool.getConnection();
  try {
    await conn.beginTransaction();

    // 兼容历史库：即便未配置 ON DELETE CASCADE，也能删除成功
    await conn.query('DELETE FROM hazard_logs WHERE hazard_id = ?', [hazardId]);
    const [result] = await conn.query('DELETE FROM hazards WHERE id = ?', [hazardId]);

    if (!result.affectedRows) {
      await conn.rollback();
      // 幂等删除：前端重复删除或本地残留数据时，按“已删除”处理
      return res.json({ message: '隐患记录不存在，视为已删除', id: hazardId, alreadyDeleted: true });
    }

    await conn.commit();
    res.json({ message: '隐患记录已删除', id: hazardId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
