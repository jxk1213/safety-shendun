const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', (req, res) => {
  const { risk_point, hazard_factors, accident_type, control_measures, emergency_measures, control_level, person_in_charge, domain } = req.body;
  if (!risk_point) {
    return res.status(400).json({ error: '风险点是必填项' });
  }

  const query = `
    INSERT INTO risks (risk_point, hazard_factors, accident_type, control_measures, emergency_measures, control_level, person_in_charge, domain, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待评审', NOW())
  `;

  db.query(query, [risk_point, hazard_factors, accident_type, control_measures, emergency_measures, control_level, person_in_charge, domain || '转运中心'], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: results.insertId, message: '风险已成功上报' });
  });
});

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `SELECT * FROM risks`;
  const params = [];
  if (status) {
    query += ` WHERE status = ?`;
    params.push(status);
  }
  query += ` ORDER BY created_at DESC`;
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
