const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

const uploadPath = path.join(__dirname, 'uploads');
const templatePath = path.join(uploadPath, 'templates');
[uploadPath, templatePath].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});
app.use('/uploads', express.static(uploadPath));

const riskRoutes = require('./routes/risks');
const hazardRoutes = require('./routes/hazards');
const taskRoutes = require('./routes/tasks');
const checklistRoutes = require('./routes/checklists');
const accidentRoutes = require('./routes/accidents');
const siteLedgerRoutes = require('./routes/site_ledger');
const onboardingTrainingRoutes = require('./routes/onboarding_trainings');

app.use('/api/risks', riskRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/accidents', accidentRoutes);
app.use('/api/site-ledger', siteLedgerRoutes);
app.use('/api/onboarding-trainings', onboardingTrainingRoutes);

// H5 join page for onboarding training QR (keep URL short)
app.get('/ot/:token', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'platform', 'h5', 'onboarding-training.html'));
});

app.use(express.static(path.join(__dirname, '..', 'platform')));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: '申盾智能安全平台后端运行正常' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'platform', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '后端服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  申盾智能安全平台 - 后端已启动`);
  console.log(`  监听端口: ${PORT}`);
  console.log(`  前端地址: http://localhost:${PORT}`);
  console.log(`  API地址:  http://localhost:${PORT}/api`);
  console.log(`========================================`);
});
