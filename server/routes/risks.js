const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * 1. 上报风险 (Risk Reporting)
 */
router.post('/', (req, res) => {
  const { risk_point, hazard_factors, accident_type } = req.body;
  if (!risk_point) {
    return res.status(400).json({ error: '风险点是必填项' });
  }

  const query = `
    INSERT INTO risks (risk_point, hazard_factors, accident_type, status, created_at)
    VALUES (?, ?, ?, '待评审', CURRENT_TIMESTAMP)
  `;

  db.run(query, [risk_point, hazard_factors, accident_type], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: '风险已成功上报' });
  });
});

/**
 * 2. 获取风险列表 (Get Risk List)
 */
router.get('/', (req, res) => {
  const query = `SELECT * FROM risks ORDER BY created_at DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * 3. 总部评审风险 (Review/Rank Risk)
 */
router.patch('/:id/review', (req, res) => {
  const { id } = req.params;
  const { l_value, e_value, c_value, risk_level, status, reject_reason } = req.body;
  
  const d_value = (l_value && e_value && c_value) ? (l_value * e_value * c_value) : 0;

  const query = `
    UPDATE risks
    SET l_value = ?, e_value = ?, c_value = ?, d_value = ?, risk_level = ?, status = ?, reject_reason = ?
    WHERE id = ?
  `;

  db.run(query, [l_value, e_value, c_value, d_value, risk_level, status, reject_reason, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '风险评审已更新', d_value, risk_level });
  });
});

module.exports = router;
