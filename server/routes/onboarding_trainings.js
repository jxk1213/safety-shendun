const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const db = require('../database');

function toNullIfEmpty(v) {
  const s = v == null ? '' : String(v).trim();
  return s ? s : null;
}

function safeJsonStringify(obj) {
  try {
    if (obj == null) return null;
    return JSON.stringify(obj);
  } catch (e) {
    return null;
  }
}

function safeJsonParse(str) {
  try {
    if (!str) return null;
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function expiresAt(hours) {
  const ms = (hours || 2) * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

function formatMySqlDate(d) {
  if (!d) return null;
  const pad = n => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    ' ' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes()) +
    ':' +
    pad(d.getSeconds())
  );
}

// ===== File upload (archives) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const trainingId = req.params.id;
    const dir = path.join(__dirname, '..', 'uploads', 'onboarding-training', String(trainingId));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(decodedName);
    cb(null, 'archive_' + Date.now() + '_' + Math.random().toString(16).slice(2) + ext);
  }
});
const upload = multer({ storage });

// POST /api/onboarding-trainings  Create a training session
router.post('/', async (req, res) => {
  try {
    const title = toNullIfEmpty(req.body.title);
    if (!title) return res.status(400).json({ error: '请填写培训场次名称' });

    const location = toNullIfEmpty(req.body.location);
    const startTime = toNullIfEmpty(req.body.start_time);
    const endTime = toNullIfEmpty(req.body.end_time);
    const expectedParticipants = Number(req.body.expected_participants || 0) || 0;

    const coursewareAsset = req.body.courseware_asset;
    const assessmentTemplateAsset = req.body.assessment_template_asset;

    const token = makeToken();
    const exp = expiresAt(2);

    const sql = `
      INSERT INTO onboarding_trainings
        (title, location, start_time, end_time, expected_participants, courseware_asset, assessment_template_asset, qr_token, qr_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title,
      location,
      startTime,
      endTime,
      expectedParticipants,
      typeof coursewareAsset === 'string' ? coursewareAsset : safeJsonStringify(coursewareAsset),
      typeof assessmentTemplateAsset === 'string' ? assessmentTemplateAsset : safeJsonStringify(assessmentTemplateAsset),
      token,
      formatMySqlDate(exp)
    ];

    const [result] = await db.promisePool.query(sql, params);
    res.status(201).json({
      id: result.insertId,
      title,
      qr_token: token,
      qr_expires_at: exp
    });
  } catch (e) {
    res.status(500).json({ error: e.message || '创建失败' });
  }
});

// GET /api/onboarding-trainings  List trainings
router.get('/', async (req, res) => {
  try {
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '10', 10) || 10));
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const offset = (page - 1) * pageSize;

    const [[countRow]] = await db.promisePool.query(`SELECT COUNT(*) AS total FROM onboarding_trainings`);
    const total = countRow && typeof countRow.total === 'number' ? countRow.total : (countRow ? Number(countRow.total || 0) : 0);

    const [rows] = await db.promisePool.query(
      `
      SELECT
        t.*,
        (SELECT COUNT(*) FROM onboarding_training_attendance a WHERE a.training_id = t.id) AS attendance_count,
        (SELECT COUNT(*) FROM onboarding_training_archives ar WHERE ar.training_id = t.id) AS archive_count
      FROM onboarding_trainings t
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [pageSize, offset]
    );

    const normalized = (rows || []).map(r => ({
      ...r,
      courseware_asset: safeJsonParse(r.courseware_asset),
      assessment_template_asset: safeJsonParse(r.assessment_template_asset)
    }));
    res.json({ items: normalized, total, page, pageSize });
  } catch (e) {
    res.status(500).json({ error: e.message || '查询失败' });
  }
});

// ===== Public endpoints for QR join (no auth) =====
// GET /api/onboarding-trainings/qr/:token
router.get('/qr/:token', async (req, res) => {
  try {
    const token = toNullIfEmpty(req.params.token);
    if (!token) return res.status(400).json({ error: '参数错误' });

    const [[training]] = await db.promisePool.query(
      `SELECT id, title, location, start_time, end_time, qr_expires_at FROM onboarding_trainings WHERE qr_token = ?`,
      [token]
    );
    if (!training) return res.status(404).json({ error: '二维码无效' });

    const exp = training.qr_expires_at ? new Date(training.qr_expires_at) : null;
    const expired = exp ? Date.now() > exp.getTime() : false;

    res.json({
      id: training.id,
      title: training.title,
      location: training.location,
      start_time: training.start_time,
      end_time: training.end_time,
      qr_expires_at: training.qr_expires_at,
      expired
    });
  } catch (e) {
    res.status(500).json({ error: e.message || '查询失败' });
  }
});

// POST /api/onboarding-trainings/qr/:token/checkin
router.post('/qr/:token/checkin', async (req, res) => {
  try {
    const token = toNullIfEmpty(req.params.token);
    if (!token) return res.status(400).json({ error: '参数错误' });

    const name = toNullIfEmpty(req.body.name);
    if (!name) return res.status(400).json({ error: '请填写姓名' });

    const employeeNo = toNullIfEmpty(req.body.employee_no);
    const phone = toNullIfEmpty(req.body.phone);

    const [[training]] = await db.promisePool.query(
      `SELECT id, qr_expires_at FROM onboarding_trainings WHERE qr_token = ?`,
      [token]
    );
    if (!training) return res.status(404).json({ error: '二维码无效' });

    const exp = training.qr_expires_at ? new Date(training.qr_expires_at) : null;
    if (exp && Date.now() > exp.getTime()) return res.status(410).json({ error: '二维码已过期，请联系安全员' });

    await db.promisePool.query(
      `INSERT INTO onboarding_training_attendance (training_id, name, employee_no, phone) VALUES (?, ?, ?, ?)`,
      [training.id, name, employeeNo, phone]
    );
    res.status(201).json({ message: '签到成功' });
  } catch (e) {
    res.status(500).json({ error: e.message || '签到失败' });
  }
});

// GET /api/onboarding-trainings/:id  Get detail (attendance + archives)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: '参数错误' });

    const [[training]] = await db.promisePool.query(`SELECT * FROM onboarding_trainings WHERE id = ?`, [id]);
    if (!training) return res.status(404).json({ error: '未找到培训场次' });

    const [attendance] = await db.promisePool.query(
      `SELECT id, name, employee_no, phone, checked_in_at FROM onboarding_training_attendance WHERE training_id = ? ORDER BY checked_in_at DESC LIMIT 200`,
      [id]
    );
    const [archives] = await db.promisePool.query(
      `SELECT id, file_name, file_path, uploaded_at FROM onboarding_training_archives WHERE training_id = ? ORDER BY uploaded_at DESC`,
      [id]
    );

    res.json({
      ...training,
      courseware_asset: safeJsonParse(training.courseware_asset),
      assessment_template_asset: safeJsonParse(training.assessment_template_asset),
      attendance: attendance || [],
      archives: archives || []
    });
  } catch (e) {
    res.status(500).json({ error: e.message || '查询失败' });
  }
});

// POST /api/onboarding-trainings/:id/qr  Regenerate QR token (default 2 hours)
router.post('/:id/qr', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: '参数错误' });

    const token = makeToken();
    const exp = expiresAt(2);
    const [result] = await db.promisePool.query(
      `UPDATE onboarding_trainings SET qr_token = ?, qr_expires_at = ? WHERE id = ?`,
      [token, formatMySqlDate(exp), id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: '未找到培训场次' });
    res.json({ id, qr_token: token, qr_expires_at: exp });
  } catch (e) {
    res.status(500).json({ error: e.message || '生成失败' });
  }
});

// POST /api/onboarding-trainings/:id/archives  Upload archive photos
router.post('/:id/archives', upload.array('files', 12), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: '参数错误' });

    const [[training]] = await db.promisePool.query(`SELECT id FROM onboarding_trainings WHERE id = ?`, [id]);
    if (!training) return res.status(404).json({ error: '未找到培训场次' });

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: '请上传至少 1 张照片' });

    const rows = files.map(f => {
      const original = Buffer.from(f.originalname, 'latin1').toString('utf8');
      const filePath = `/uploads/onboarding-training/${id}/${f.filename}`;
      return [id, original, filePath];
    });

    await db.promisePool.query(
      `INSERT INTO onboarding_training_archives (training_id, file_name, file_path) VALUES ?`,
      [rows]
    );
    res.status(201).json({ message: '上传成功', count: rows.length });
  } catch (e) {
    res.status(500).json({ error: e.message || '上传失败' });
  }
});

module.exports = router;
