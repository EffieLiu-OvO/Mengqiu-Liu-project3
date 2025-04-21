// frontend/src/pages/ScoresPage.js
import React, { useState, useEffect } from "react";
import "../styles/Scores.css";

const ScoresPage = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 获取用户信息
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/users/scores");

      if (!response.ok) {
        throw new Error("获取得分列表失败");
      }

      const data = await response.json();
      setScores(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // 计算胜率
  const calculateWinRate = (wins, losses) => {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${Math.round((wins / total) * 100)}%`;
  };

  return (
    <div className="scores-container">
      <h1>排行榜</h1>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>加载中...</p>
      ) : scores.length > 0 ? (
        <div className="scores-table">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>用户名</th>
                <th>胜场</th>
                <th>负场</th>
                <th>胜率</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr
                  key={score._id}
                  className={
                    user && user._id === score._id ? "current-user" : ""
                  }
                >
                  <td>{index + 1}</td>
                  <td>{score.username}</td>
                  <td>{score.wins}</td>
                  <td>{score.losses}</td>
                  <td>{calculateWinRate(score.wins, score.losses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>暂无得分记录</p>
      )}
    </div>
  );
};

export default ScoresPage;
