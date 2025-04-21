import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AllGames.css";

const AllGamesPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchedRef = useRef(false);
  const navigate = useNavigate();

  // 获取用户信息
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check if user is logged in
    if (!user || !token) {
      navigate("/login");
      return;
    }

    // 只在组件挂载时获取一次游戏列表，防止循环请求
    if (!fetchedRef.current) {
      fetchGames();
      fetchedRef.current = true;
    }
  }, [user, token, navigate]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/games");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "获取游戏列表失败");
      }

      const data = await response.json();
      console.log("Fetched games:", data);
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(error.message || "获取游戏列表失败");
      setLoading(false);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:8000/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGameName || "新游戏" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "创建游戏失败");
      }

      const data = await response.json();
      console.log("Created game:", data);

      // Reset form state
      setNewGameName("");
      setIsCreatingGame(false);

      // Navigate to the new game
      navigate(`/multiplayer/${data._id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      setError(error.message || "创建游戏失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGame = async (gameId) => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (isSubmitting) return;

    // 检查用户是否已经在游戏中
    const game = games.find((g) => g._id === gameId);
    const isUserInGame = game?.players.some(
      (player) => player.user && player.user._id === user._id
    );

    if (isUserInGame) {
      // If already in game, just navigate to it
      navigate(`/multiplayer/${gameId}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `http://localhost:8000/api/games/${gameId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "加入游戏失败");
      }

      // 导航到游戏页面
      navigate(`/multiplayer/${gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error.message || "加入游戏失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return "未知时间";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return "日期格式错误";
    }
  };

  // 按照分类过滤游戏
  const openGames = user
    ? games.filter(
        (game) =>
          game.status === "waiting" &&
          !game.players.some(
            (player) => player.user && player.user._id === user._id
          )
      )
    : [];

  const myOpenGames = user
    ? games.filter(
        (game) =>
          game.status === "waiting" &&
          game.players.some(
            (player) => player.user && player.user._id === user._id
          )
      )
    : [];

  const myActiveGames = user
    ? games.filter(
        (game) =>
          game.status === "in_progress" &&
          game.players.some(
            (player) => player.user && player.user._id === user._id
          )
      )
    : [];

  const completedGames = user
    ? games.filter(
        (game) =>
          game.status === "completed" &&
          game.players.some(
            (player) => player.user && player.user._id === user._id
          )
      )
    : [];

  const handleRetry = () => {
    setError("");
    fetchedRef.current = false;
    fetchGames();
  };

  if (!user || !token) {
    return (
      <div className="all-games-container">
        <h1>多人对战</h1>
        <p className="error-message">请先登录</p>
        <button className="return-btn" onClick={() => navigate("/login")}>
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="all-games-container">
      <h1>多人对战</h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleRetry} className="retry-btn">
            重试
          </button>
        </div>
      )}

      <div className="create-game-section">
        {isCreatingGame ? (
          <form onSubmit={handleCreateGame} className="create-game-form">
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="输入游戏名称 (可选)"
            />
            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "创建中..." : "创建"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsCreatingGame(false)}
              disabled={isSubmitting}
            >
              取消
            </button>
          </form>
        ) : (
          <button
            className="new-game-btn"
            onClick={() => setIsCreatingGame(true)}
          >
            创建新游戏
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading-message">加载中...</p>
      ) : (
        <>
          {/* My Active Games Section */}
          <div className="games-section">
            <h2>我的进行中游戏</h2>
            {myActiveGames.length > 0 ? (
              <div className="games-grid">
                {myActiveGames.map((game) => (
                  <div key={game._id} className="game-card status-in_progress">
                    <h3>{game.name || `游戏 #${game._id.slice(-4)}`}</h3>
                    <p>
                      对手:{" "}
                      {game.players.find(
                        (p) => p.user && p.user._id !== user._id
                      )?.user?.username || "等待中"}
                    </p>
                    <p>创建时间: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      继续游戏
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">暂无进行中的游戏</p>
            )}
          </div>

          {/* My Open Games Section */}
          <div className="games-section">
            <h2>我的等待中游戏</h2>
            {myOpenGames.length > 0 ? (
              <div className="games-grid">
                {myOpenGames.map((game) => (
                  <div key={game._id} className="game-card status-waiting">
                    <h3>{game.name || `游戏 #${game._id.slice(-4)}`}</h3>
                    <p>创建者: {game.creator?.username || "未知"}</p>
                    <p>玩家数: {game.players.length}/2</p>
                    <p>创建时间: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      进入游戏
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">暂无等待中的游戏</p>
            )}
          </div>

          {/* Open Games Section */}
          <div className="games-section">
            <h2>开放游戏</h2>
            {openGames.length > 0 ? (
              <div className="games-grid">
                {openGames.map((game) => (
                  <div key={game._id} className="game-card status-waiting">
                    <h3>{game.name || `游戏 #${game._id.slice(-4)}`}</h3>
                    <p>创建者: {game.creator?.username || "未知"}</p>
                    <p>玩家数: {game.players.length}/2</p>
                    <p>创建时间: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      加入游戏
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">暂无开放的游戏，请创建新游戏</p>
            )}
          </div>

          {/* Completed Games Section */}
          <div className="games-section">
            <h2>已完成游戏</h2>
            {completedGames.length > 0 ? (
              <div className="games-grid">
                {completedGames.map((game) => (
                  <div key={game._id} className="game-card status-completed">
                    <h3>{game.name || `游戏 #${game._id.slice(-4)}`}</h3>
                    <p>创建者: {game.creator?.username || "未知"}</p>
                    <p>胜利者: {game.winner?.username || "平局"}</p>
                    <p>
                      结束时间:{" "}
                      {game.endTime ? formatDate(game.endTime) : "未知"}
                    </p>
                    <button
                      className="view-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      查看游戏
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">暂无已完成的游戏</p>
            )}
          </div>

          <div className="refresh-section">
            <button onClick={handleRetry} className="refresh-btn">
              刷新游戏列表
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllGamesPage;
