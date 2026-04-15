# 申盾智能安全平台 - 后端 (Node.js)

针对申盾智能安全管理的「双重预防机制」开发的后端服务。

## 功能模块
- **风险上报与评审** (上报风险 / LEC 评审 / 风险等级划分)
- **隐患治理闭环** (隐患上报 / 稽核 / 整改 / 验收与关闭)
- **隐患全流程日志** (隐患治理各个阶段的操作日志追踪)

## 技术栈
- **Node.js**
- **Express** (Web 框架)
- **SQLite3** (轻量级关系型数据库，无需繁琐安装配置，适合 CPU 1核/内存 2G 的服务器)
- **Multer** (支持隐患整改照片上传)
- **Moment.js** (日期处理)

## 如何在服务器上运行

1. **安装 Node.js 和 npm** (如果未安装)
   ```bash
   sudo yum install -y nodejs npm   # 针对 Alibaba Cloud Linux
   ```

2. **从项目根目录进入后端文件夹**
   ```bash
   cd /Users/jixiaokang/Desktop/申盾智能/server  # 请根据实际路径调整
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **启动服务器**
   - 方式一 (直接启动):
     ```bash
     npm start
     ```
   - 方式二 (推荐后端运行，使用 PM2):
     ```bash
     sudo npm install -g pm2
     pm2 start index.js --name shendun-api
     ```

## API 接口概览

### 风险管理 (Risk Management)
- `POST /api/risks` : 上报新风险
- `GET /api/risks` : 获取风险列表（默认按 `id` 升序返回）
- `PATCH /api/risks/:id/review` : 后端评审及 LEC 打分

### 隐患治理 (Hazard Management & Governance)
- `POST /api/hazards/report` : 新增隐患上报 (支持上传 `photo_before`)
- `GET /api/hazards` : 获取隐患列表 (支持筛选)
- `PATCH /api/hazards/:id/audit` : 隐患稽核
- `POST /api/hazards/:id/rectify` : 提交整改 (支持上传 `photo_after`)
- `PATCH /api/hazards/:id/close` : 验收与闭环关闭
- `GET /api/hazards/:id/logs` : 查看隐患的全程治理记录
