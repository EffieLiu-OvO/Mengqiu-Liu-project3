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

  // Get user information
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check if user is logged in
    if (!user || !token) {
      navigate("/login");
      return;
    }

    // Only fetch games list once when component mounts to prevent loop requests
    if (!fetchedRef.current) {
      fetchGames();
      fetchedRef.current = true;
    }
  }, [user, token, navigate]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/games`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to get games list");
      }

      const data = await response.json();
      console.log("Fetched games:", data);
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching games:", error);
      setError(error.message || "Failed to get games list");
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
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/games`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newGameName || "New Game" }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create game");
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
      setError(error.message || "Failed to create game");
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

    // Check if user is already in the game
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
        `${process.env.REACT_APP_API_BASE_URL}/api/games/${gameId}/join`,
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
        throw new Error(data.message || "Failed to join game");
      }

      // Navigate to game page
      navigate(`/multiplayer/${gameId}`);
    } catch (error) {
      console.error("Error joining game:", error);
      setError(error.message || "Failed to join game");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown time";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return "Date format error";
    }
  };

  // Filter games by category
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
        <h1>Multiplayer Games</h1>
        <p className="error-message">Please login first</p>
        <button className="return-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="all-games-container">
      <h1>Multiplayer Games</h1>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleRetry} className="retry-btn">
            Retry
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
              placeholder="Enter game name (optional)"
            />
            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsCreatingGame(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            className="new-game-btn"
            onClick={() => setIsCreatingGame(true)}
          >
            Create New Game
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : (
        <>
          {/* My Active Games Section */}
          <div className="games-section">
            <h2>My Active Games</h2>
            {myActiveGames.length > 0 ? (
              <div className="games-grid">
                {myActiveGames.map((game) => (
                  <div key={game._id} className="game-card status-in_progress">
                    <h3>{game.name || `Game #${game._id.slice(-4)}`}</h3>
                    <p>
                      Opponent:{" "}
                      {game.players.find(
                        (p) => p.user && p.user._id !== user._id
                      )?.user?.username || "Waiting"}
                    </p>
                    <p>Created: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      Continue Game
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">No active games</p>
            )}
          </div>

          {/* My Open Games Section */}
          <div className="games-section">
            <h2>My Open Games</h2>
            {myOpenGames.length > 0 ? (
              <div className="games-grid">
                {myOpenGames.map((game) => (
                  <div key={game._id} className="game-card status-waiting">
                    <h3>{game.name || `Game #${game._id.slice(-4)}`}</h3>
                    <p>Creator: {game.creator?.username || "Unknown"}</p>
                    <p>Players: {game.players.length}/2</p>
                    <p>Created: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      Enter Game
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">No open games</p>
            )}
          </div>

          {/* Open Games Section */}
          <div className="games-section">
            <h2>Open Games</h2>
            {openGames.length > 0 ? (
              <div className="games-grid">
                {openGames.map((game) => (
                  <div key={game._id} className="game-card status-waiting">
                    <h3>{game.name || `Game #${game._id.slice(-4)}`}</h3>
                    <p>Creator: {game.creator?.username || "Unknown"}</p>
                    <p>Players: {game.players.length}/2</p>
                    <p>Created: {formatDate(game.created)}</p>
                    <button
                      className="join-btn"
                      onClick={() => handleJoinGame(game._id)}
                      disabled={isSubmitting}
                    >
                      Join Game
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">
                No open games, please create a new one
              </p>
            )}
          </div>

          {/* Completed Games Section */}
          <div className="games-section">
            <h2>Completed Games</h2>
            {completedGames.length > 0 ? (
              <div className="games-grid">
                {completedGames.map((game) => (
                  <div key={game._id} className="game-card status-completed">
                    <h3>{game.name || `Game #${game._id.slice(-4)}`}</h3>
                    <p>Creator: {game.creator?.username || "Unknown"}</p>
                    <p>Winner: {game.winner?.username || "Draw"}</p>
                    <p>
                      End Time:{" "}
                      {game.endTime ? formatDate(game.endTime) : "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-games-message">No completed games</p>
            )}
          </div>

          <div className="refresh-section">
            <button onClick={handleRetry} className="refresh-btn">
              Refresh Games List
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllGamesPage;
