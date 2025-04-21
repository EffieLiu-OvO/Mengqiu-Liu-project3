// backend/server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./db/connection");
const authApi = require("./apis/authApi");
const gameApi = require("./apis/gameApi");
const userApi = require("./apis/userApi");

// 连接到数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// 打印所有请求以便调试
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 处理JSON解析错误
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});

// API路由
app.use("/api/auth", authApi);
app.use("/api/games", gameApi);
app.use("/api/users", userApi);

// 简单的测试路由
app.get("/api/test", (req, res) => {
  res.json({ message: "后端API连接成功!" });
});

// 处理不存在的API路由
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// 生产环境下为前端文件提供静态服务
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
  });
}

// 全局错误处理
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({
      message: "服务器错误",
      error: process.env.NODE_ENV === "development" ? err.message : null,
    });
});

// 启动服务器
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
