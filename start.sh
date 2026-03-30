#!/bin/bash
# 申盾智能安全平台 启动脚本

# 项目根目录
PROJECT_ROOT="/Users/jixiaokang/Desktop/申盾智能"

echo "========================================"
echo "  正在启动 申盾智能安全平台..."
echo "  项目路径: $PROJECT_ROOT"
echo "========================================"

# 进入服务器目录
cd "$PROJECT_ROOT/server"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "  [正在安装依赖...]"
    npm install
fi

# 启动服务器 (使用 npm start 并放入后台，或者让它占用终端)
# 此处建议直接占用终端以查看日志
npm run dev &
SERVER_PID=$!

# 等待应用启动 (简单延时)
sleep 2

# 自动打开浏览器 (前端地址为 http://localhost:3000)
open "http://localhost:3000"

# 等待进程退出
wait $SERVER_PID
