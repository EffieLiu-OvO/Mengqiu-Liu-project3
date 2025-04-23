const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const connectDB = require("./db/connection");
const authApi = require("./apis/authApi");
const gameApi = require("./apis/gameApi");
const userApi = require("./apis/userApi");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});

app.use("/api/auth", authApi);
app.use("/api/games", gameApi);
app.use("/api/users", userApi);

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend API connection successful!" });
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../p2-battleship-react/build");

  try {
    if (
      fs.existsSync(frontendPath) &&
      fs.existsSync(path.join(frontendPath, "index.html"))
    ) {
      console.log(`Serving frontend from: ${frontendPath}`);
      app.use(express.static(frontendPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
      });
    } else {
      console.log("Frontend build files not found at: " + frontendPath);
      app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
          res
            .status(200)
            .send(
              "Battleship Game API is running. Frontend not found.<br><br>" +
                "Note: To serve the frontend, build the React app with 'npm run build' in the p2-battleship-react directory."
            );
        }
      });
    }
  } catch (error) {
    console.error("Error checking for frontend files:", error);
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res
          .status(200)
          .send(
            "Battleship Game API is running. Error checking for frontend files."
          );
      }
    });
  }
}

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "development" ? err.message : null,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
