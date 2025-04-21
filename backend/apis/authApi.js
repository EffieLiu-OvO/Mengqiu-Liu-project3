const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../db/userModel");
const router = express.Router();

// JWT密钥
const JWT_SECRET = "your_jwt_secret"; // 在生产环境中应使用环境变量

// 注册路由
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 检查用户是否已存在
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "用户名已存在" });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
    });

    // 生成JWT令牌
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      token,
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 登录路由
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "用户名或密码错误" });
    }

    // 生成JWT令牌
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      _id: user._id,
      username: user.username,
      wins: user.wins,
      losses: user.losses,
      token,
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 获取当前用户信息
router.get("/me", async (req, res) => {
  try {
    // 从请求头获取令牌
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未授权，无令牌" });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);

    // 查找用户
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.json(user);
  } catch (error) {
    console.error("获取用户信息错误:", error);
    res.status(401).json({ message: "未授权，令牌无效" });
  }
});

module.exports = router;
