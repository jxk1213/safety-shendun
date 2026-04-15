const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { promisePool } = require('../database');

function toInt(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = content[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  // Flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length > 0 && rows[0].length > 0) {
    rows[0][0] = String(rows[0][0] || '').replace(/^\uFEFF/, '');
  }
  return rows;
}

function normalizeStr(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

router.get('/stats', async (req, res) => {
  try {
    const [[row]] = await promisePool.query('SELECT COUNT(*) AS total FROM facility_site_ledger');
    res.json({ total: Number(row.total || 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const page = Math.max(1, toInt(req.query.page, 1));
  const pageSize = Math.min(200, Math.max(5, toInt(req.query.pageSize, 20)));
  const offset = (page - 1) * pageSize;

  const keyword = normalizeStr(req.query.keyword);
  const provinceName = normalizeStr(req.query.provinceName);
  const partitionName = normalizeStr(req.query.partitionName);
  const centerName = normalizeStr(req.query.centerName);

  const where = [];
  const params = [];

  if (provinceName) {
    where.push('province_name = ?');
    params.push(provinceName);
  }
  if (partitionName) {
    where.push('partition_name = ?');
    params.push(partitionName);
  }
  if (centerName) {
    where.push('center_name = ?');
    params.push(centerName);
  }
  if (keyword) {
    where.push(`(
      province_name LIKE ? OR partition_name LIKE ? OR operation_manager LIKE ?
      OR center_code LIKE ? OR center_name LIKE ? OR center_short_name LIKE ?
      OR manager LIKE ? OR phone LIKE ? OR address LIKE ?
    )`);
    const like = `%${keyword}%`;
    params.push(like, like, like, like, like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const [[countRow]] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM facility_site_ledger ${whereSql}`,
      params
    );

    const [rows] = await promisePool.query(
      `SELECT
        id,
        province_code, province_name, partition_name, operation_manager,
        center_code, center_name, center_short_name,
        site_type, site_level, site_attribute,
        manager, phone, address,
        area_m2, usage_desc, safety_facilities, remark,
        source, created_at, updated_at
      FROM facility_site_ledger
      ${whereSql}
      ORDER BY province_code ASC, center_code ASC
      LIMIT ? OFFSET ?`,
      params.concat([pageSize, offset])
    );

    res.json({
      rows,
      total: Number(countRow.total || 0),
      page,
      pageSize
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  const centerCode = normalizeStr(body.center_code);
  const centerName = normalizeStr(body.center_name);
  if (!centerCode || !centerName) {
    return res.status(400).json({ error: 'center_code 与 center_name 为必填项' });
  }

  const record = {
    province_code: normalizeStr(body.province_code),
    province_name: normalizeStr(body.province_name),
    partition_name: normalizeStr(body.partition_name),
    operation_manager: normalizeStr(body.operation_manager),
    center_code: centerCode,
    center_name: centerName,
    center_short_name: normalizeStr(body.center_short_name),
    site_type: normalizeStr(body.site_type),
    site_level: normalizeStr(body.site_level),
    site_attribute: normalizeStr(body.site_attribute),
    manager: normalizeStr(body.manager),
    phone: normalizeStr(body.phone),
    address: normalizeStr(body.address),
    area_m2: body.area_m2 === '' || body.area_m2 === null || body.area_m2 === undefined ? null : Number(body.area_m2),
    usage_desc: normalizeStr(body.usage_desc),
    safety_facilities: normalizeStr(body.safety_facilities),
    remark: normalizeStr(body.remark),
    source: normalizeStr(body.source) || 'manual'
  };

  try {
    const [result] = await promisePool.query(
      `INSERT INTO facility_site_ledger(
        province_code, province_name, partition_name, operation_manager,
        center_code, center_name, center_short_name,
        site_type, site_level, site_attribute,
        manager, phone, address,
        area_m2, usage_desc, safety_facilities, remark,
        source
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        record.province_code, record.province_name, record.partition_name, record.operation_manager,
        record.center_code, record.center_name, record.center_short_name,
        record.site_type, record.site_level, record.site_attribute,
        record.manager, record.phone, record.address,
        record.area_m2, record.usage_desc, record.safety_facilities, record.remark,
        record.source
      ]
    );
    res.status(201).json({ id: result.insertId, message: '创建成功' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'center_code 已存在，请改为编辑更新或更换编码' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: '无效的ID' });

  const body = req.body || {};
  const fields = [
    'province_code', 'province_name', 'partition_name', 'operation_manager',
    'center_code', 'center_name', 'center_short_name',
    'site_type', 'site_level', 'site_attribute',
    'manager', 'phone', 'address',
    'area_m2', 'usage_desc', 'safety_facilities', 'remark',
    'source'
  ];

  const setSql = [];
  const params = [];
  for (const key of fields) {
    if (!(key in body)) continue;
    if (key === 'area_m2') {
      setSql.push('area_m2 = ?');
      params.push(body.area_m2 === '' || body.area_m2 === null || body.area_m2 === undefined ? null : Number(body.area_m2));
      continue;
    }
    setSql.push(`${key} = ?`);
    params.push(normalizeStr(body[key]));
  }

  if (!setSql.length) return res.json({ message: '无更新内容' });
  params.push(id);

  try {
    const [result] = await promisePool.query(
      `UPDATE facility_site_ledger SET ${setSql.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
    if (!result.affectedRows) return res.status(404).json({ error: '记录不存在' });
    res.json({ message: '更新成功', id });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'center_code 已存在，请更换编码' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = toInt(req.params.id, 0);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: '无效的ID' });

  try {
    const [result] = await promisePool.query('DELETE FROM facility_site_ledger WHERE id = ?', [id]);
    if (!result.affectedRows) return res.json({ message: '记录不存在，视为已删除', id, alreadyDeleted: true });
    res.json({ message: '删除成功', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/import/provinces-centers', async (req, res) => {
  const csvPath = path.join(__dirname, '..', '..', 'data', 'provinces_centers.csv');
  if (!fs.existsSync(csvPath)) {
    return res.status(404).json({ error: '未找到通讯录导出的 CSV：data/provinces_centers.csv' });
  }

  try {
    const raw = fs.readFileSync(csvPath, 'utf8');
    const table = parseCsv(raw);
    if (!table.length) return res.status(400).json({ error: 'CSV 内容为空' });

    const header = table[0].map(normalizeStr);
    const requiredHeaders = ['省区编码', '省区名称', '分区名称', '运营负责人', '中心编码', '中心名称', '中心简称', '类型', '级别', '属性', '负责人', '电话', '地址'];
    for (const h of requiredHeaders) {
      if (!header.includes(h)) return res.status(400).json({ error: `CSV 表头缺少字段：${h}` });
    }
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));

    const rows = table.slice(1).filter(r => r && r.length && r.some(c => normalizeStr(c) !== ''));
    if (!rows.length) return res.status(400).json({ error: 'CSV 无有效数据行' });

    const conn = await promisePool.getConnection();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    try {
      await conn.beginTransaction();

      const sql = `
        INSERT INTO facility_site_ledger(
          province_code, province_name, partition_name, operation_manager,
          center_code, center_name, center_short_name,
          site_type, site_level, site_attribute,
          manager, phone, address,
          source
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          province_code = VALUES(province_code),
          province_name = VALUES(province_name),
          partition_name = VALUES(partition_name),
          operation_manager = VALUES(operation_manager),
          center_name = VALUES(center_name),
          center_short_name = VALUES(center_short_name),
          site_type = VALUES(site_type),
          site_level = VALUES(site_level),
          site_attribute = VALUES(site_attribute),
          manager = VALUES(manager),
          phone = VALUES(phone),
          address = VALUES(address),
          source = VALUES(source),
          updated_at = CURRENT_TIMESTAMP
      `;

      for (const r of rows) {
        const centerCode = normalizeStr(r[idx['中心编码']]);
        const centerName = normalizeStr(r[idx['中心名称']]);
        if (!centerCode || !centerName) {
          skipped++;
          continue;
        }

        const values = [
          normalizeStr(r[idx['省区编码']]),
          normalizeStr(r[idx['省区名称']]),
          normalizeStr(r[idx['分区名称']]),
          normalizeStr(r[idx['运营负责人']]),
          centerCode,
          centerName,
          normalizeStr(r[idx['中心简称']]),
          normalizeStr(r[idx['类型']]),
          normalizeStr(r[idx['级别']]),
          normalizeStr(r[idx['属性']]),
          normalizeStr(r[idx['负责人']]),
          normalizeStr(r[idx['电话']]),
          normalizeStr(r[idx['地址']]),
          'address_book'
        ];

        const [result] = await conn.query(sql, values);
        if (result.affectedRows === 1) inserted++;
        else if (result.affectedRows >= 2) updated++;
        else skipped++;
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json({
      message: '导入完成',
      total: rows.length,
      inserted,
      updated,
      skipped
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

