## [ERR-20260420-001] node_local_preview

**Logged**: 2026-04-20T05:48:25Z
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
本地预览时，`node index.js` 在沙箱环境内无法监听 `0.0.0.0:3000`

### Error
```text
Error: listen EPERM: operation not permitted 0.0.0.0:3000
```

### Context
- Command attempted: `node index.js`
- Working directory: `server/`
- Goal: 启动本地服务预览前端改版效果
- Environment detail: 当前会话运行在受限沙箱中，端口监听被拒绝

### Suggested Fix
需要本地预览时，优先直接申请提权运行本地服务；如果当前任务不依赖实时预览，则先完成静态改造与语法检查，避免被预览步骤阻塞。

### Metadata
- Reproducible: yes
- Related Files: server/index.js

---
