const express = require("express");
const router = express.Router();
const User = require("../db/userModel");

router.get("/scores", async (req, res) => {
  try {
    const users = await User.find({}, "username wins losses").sort({
      wins: -1,
      losses: 1,
      username: 1,
    });

    res.json(users);
  } catch (error) {
    console.error("Error getting score list:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
