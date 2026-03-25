const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 自定义中间件
app.use(cors()); // 允许跨域
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件目录 (上传的图片和模板)
const uploadPath = path.join(__dirname, 'uploads');
const templatePath = path.join(uploadPath, 'templates');
[uploadPath, templatePath].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});
app.use('/uploads', express.static(uploadPath));

// 导入路由
const riskRoutes = require('./routes/risks');
const hazardRoutes = require('./routes/hazards');
const taskRoutes = require('./routes/tasks');

// 注册路由
app.use('/api/risks', riskRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/tasks', taskRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'UP', message: '申盾智能安全平台后端运行正常' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '后端服务器内部错误', message: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  申盾智能安全平台 - 后端已启动         `);
  console.log(`  监听端口: ${PORT}                    `);
  console.log(`  运行环境点: http://localhost:${PORT}  `);
  console.log(`========================================`);
});
