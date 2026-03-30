const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'templates');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Retain original filename but ensure unique name in FS
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, 'checklist_' + Date.now() + path.extname(decodedName));
  }
});
const upload = multer({ storage });

// POST: Upload a checklist
router.post('/', upload.single('template_file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传检查表文件' });
  }

  const filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  const filepath = `/uploads/templates/${req.file.filename}`;
  
  const query = `INSERT INTO checklists (filename, filepath) VALUES (?, ?)`;
  
  db.query(query, [filename, filepath], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: results.insertId,
      filename,
      filepath,
      message: '检查表上传成功'
    });
  });
});

// GET: List all checklists
router.get('/', (req, res) => {
  const query = `SELECT * FROM checklists ORDER BY uploaded_at DESC`;
  
  db.query(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
