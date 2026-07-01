const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { risk_point, control_measures, domain, risk_area } = req.body;
  if (!risk_point) {
    return res.status(400).json({ error: '风险描述是必填项' });
  }

  const query = `
    INSERT INTO risks (risk_point, hazard_factors, accident_type, control_measures, emergency_measures, control_level, person_in_charge, domain, risk_area, status, created_at)
    VALUES (?, NULL, NULL, ?, NULL, NULL, NULL, ?, ?, '待评审', NOW())
  `;

  db.query(query, [risk_point, control_measures || '', domain || '转运中心', risk_area || ''], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: results.insertId, message: '风险已成功上报' });
  });
});

router.get('/stats', (req, res) => {
  const query = `
    SELECT 
      status, 
      COUNT(*) as count 
    FROM risks 
    GROUP BY status
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const stats = results.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, { '待评审': 0, '已评审': 0, '已驳回': 0 });
    res.json(stats);
  });
});

router.get('/', (req, res) => {
  const { status, domain, risk_level, risk_area, keyword } = req.query;
  let query = `SELECT * FROM risks WHERE 1=1`;
  const params = [];

  if (status) { query += ` AND status = ?`; params.push(status); }
  if (domain) { query += ` AND domain = ?`; params.push(domain); }
  if (risk_level) { query += ` AND risk_level = ?`; params.push(risk_level); }
  if (risk_area) { query += ` AND risk_area = ?`; params.push(risk_area); }
  if (keyword) { query += ` AND risk_point LIKE ?`; params.push(`%${keyword}%`); }

  query += ` ORDER BY id ASC`;
  db.query(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.patch('/:id/review', (req, res) => {
  const { id } = req.params;
  const { l_value, e_value, c_value, risk_level, status, reject_reason } = req.body;

  const d_value = (l_value && e_value && c_value) ? (l_value * e_value * c_value) : 0;

  const query = `
    UPDATE risks
    SET l_value = ?, e_value = ?, c_value = ?, d_value = ?, risk_level = ?, status = ?, reject_reason = ?
    WHERE id = ?
  `;

  db.query(query, [l_value, e_value, c_value, d_value, risk_level, status, reject_reason, id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '风险评审已更新', d_value, risk_level });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM risks WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '风险记录已删除' });
  });
});

module.exports = router;
