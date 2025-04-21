// backend/apis/userApi.js
const express = require("express");
const router = express.Router();
const User = require("../db/userModel");

// 获取所有用户的得分记录
router.get("/scores", async (req, res) => {
  try {
    const users = await User.find({}, "username wins losses").sort({
      wins: -1,
      losses: 1,
      username: 1,
    });

    res.json(users);
  } catch (error) {
    console.error("获取得分列表错误:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 其他用户相关API...

module.exports = router;
