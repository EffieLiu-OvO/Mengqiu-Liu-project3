import React, { useState, useEffect } from "react";
import "../styles/Scores.css";
import { useLocation } from "react-router-dom";

const ScoresPage = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/scores`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch scores");
      }

      const data = await response.json();
      setScores(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const calculateWinRate = (wins, losses) => {
    const total = wins + losses;
    if (total === 0) return "0%";
    return `${Math.round((wins / total) * 100)}%`;
  };

  useEffect(() => {
    fetchScores();
  }, [location.pathname]);

  return (
    <div className="scores-container">
      <h1>Leaderboard</h1>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : scores.length > 0 ? (
        <div className="scores-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win Rate</th>
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
        <p>No score records yet</p>
      )}
    </div>
  );
};

export default ScoresPage;
