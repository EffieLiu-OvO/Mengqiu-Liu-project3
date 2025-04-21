import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import { useMultiplayer } from "../context/MultiplayerContext";
import "../styles/Game.css";
import { placeShipsRandomly } from "../utils/shipPlacement";

const MultiplayerGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useMultiplayer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opponentUser, setOpponentUser] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const dataFetchedRef = useRef(false);
  const clickDisabledRef = useRef(false);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  const checkGameStatus = useCallback(async () => {
    if (!gameId || !token || !user) return false;

    try {
      console.log("Checking game status...");
      const response = await fetch(
        `http://localhost:8000/api/games/${gameId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get game status");
      }

      const gameData = await response.json();
      console.log("Game status check:", gameData);

      if (gameData.status === "in_progress") {
        console.log("Game in progress");
        console.log(
          "Backend current turn player ID:",
          gameData.gameData.currentTurn
        );
        console.log("Current user ID:", user._id);

        const isPlayerTurn = gameData.gameData.currentTurn === user._id;
        console.log("Is it current user's turn:", isPlayerTurn);

        setIsMyTurn(isPlayerTurn);
        clickDisabledRef.current = false;

        if (gameData.players && gameData.players.length > 1) {
          const opponent = gameData.players.find(
            (player) => player.user && player.user._id !== user._id
          );

          if (opponent && opponent.user) {
            setOpponentUser(opponent.user);

            dispatch({
              type: "SET_OPPONENT",
              payload: { opponent: opponent.user },
            });
          }
        }

        dispatch({
          type: "SET_TURN",
          payload: {
            currentTurn: isPlayerTurn ? "player" : "opponent",
          },
        });

        if (state.gameStatus !== "playing") {
          console.log("Game is now in progress!");

          const playerShips =
            gameData.gameData.ships[user._id] || state.playerShips;

          dispatch({
            type: "GAME_STARTED",
            payload: {
              firstTurn: isPlayerTurn ? "player" : "opponent",
              playerShips: playerShips,
            },
          });

          return true;
        }
      } else if (gameData.status === "completed") {
        const isWinner = gameData.winner === user._id;
        setGameMessage(isWinner ? "You won!" : "You lost!");
        dispatch({
          type: "SET_GAME_MESSAGE",
          payload: { message: isWinner ? "You won!" : "You lost!" },
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking game status:", error);
      setError("Unable to get game status");
      return false;
    }
  }, [gameId, token, user, dispatch, state.gameStatus, state.playerShips]);

  useEffect(() => {
    if (!gameId || !token || !user) return;

    console.log(
      "Setting polling interval, current game status:",
      state.gameStatus
    );

    if (pollInterval) {
      console.log("Clearing previous polling");
      clearInterval(pollInterval);
    }

    let interval;
    if (
      state.gameStatus === "waiting_opponent" ||
      state.gameStatus === "ready"
    ) {
      interval = setInterval(() => {
        checkGameStatus();
      }, 2000);
    } else if (state.gameStatus === "playing") {
      interval = setInterval(() => {
        checkGameStatus();
      }, 3000);
    } else {
      interval = setInterval(() => {
        checkGameStatus();
      }, 2500);
    }

    setPollInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameId, token, user, state.gameStatus, checkGameStatus]);

  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up resources");
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.body.style.overflow = "auto";
    };
  }, [pollInterval]);

  useEffect(() => {
    if (!gameId || !token || dataFetchedRef.current) return;

    const fetchGameData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/games/${gameId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to get game data");
        }

        const gameData = await response.json();
        console.log("Initial game data:", gameData);

        if (gameData.players && gameData.players.length > 0) {
          const opponent = gameData.players.find(
            (player) => player.user && player.user._id !== user._id
          );

          if (opponent && opponent.user) {
            setOpponentUser(opponent.user);
            dispatch({
              type: "SET_OPPONENT",
              payload: { opponent: opponent.user },
            });
          }
        }

        dispatch({
          type: "SET_GAME_ID",
          payload: { gameId },
        });

        if (gameData.status === "waiting") {
          const { board, ships } = placeShipsRandomly();

          dispatch({
            type: "START_PLACEMENT_PHASE",
          });

          dispatch({
            type: "INIT_PLAYER_BOARD",
            payload: { board, ships },
          });

          dispatch({
            type: "SET_GAME_MESSAGE",
            payload: { message: "Game ready, waiting for opponent to join" },
          });
        } else if (gameData.status === "in_progress") {
          const isPlayerTurn = gameData.gameData?.currentTurn === user._id;
          setIsMyTurn(isPlayerTurn);

          const playerShips = gameData.gameData.ships[user._id] || [];

          const opponentBoard = Array(10)
            .fill()
            .map(() => Array(10).fill(null));

          let playerBoard =
            gameData.gameData.boards[user._id] ||
            Array(10)
              .fill()
              .map(() => Array(10).fill(null));

          if (Array.isArray(playerShips) && playerShips.length > 0) {
            playerShips.forEach((ship) => {
              if (ship.positions) {
                ship.positions.forEach((pos) => {
                  if (playerBoard[pos.row] && playerBoard[pos.row][pos.col]) {
                    playerBoard[pos.row][pos.col].hasShip = true;
                  } else if (playerBoard[pos.row]) {
                    playerBoard[pos.row][pos.col] = { hasShip: true };
                  }
                });
              }
            });
          }

          dispatch({
            type: "INIT_GAME_BOARDS",
            payload: {
              playerBoard,
              playerShips,
              opponentBoard,
            },
          });

          dispatch({
            type: "GAME_STARTED",
            payload: {
              firstTurn: isPlayerTurn ? "player" : "opponent",
            },
          });

          dispatch({
            type: "SET_TURN",
            payload: {
              currentTurn: isPlayerTurn ? "player" : "opponent",
            },
          });

          dispatch({
            type: "SET_GAME_MESSAGE",
            payload: {
              message: isPlayerTurn ? "Your turn" : "Opponent's turn",
            },
          });
        } else if (gameData.status === "completed") {
          const isWinner = gameData.winner && gameData.winner._id === user._id;
          setGameMessage(isWinner ? "You won!" : "You lost!");

          dispatch({
            type: "SET_GAME_MESSAGE",
            payload: { message: isWinner ? "You won!" : "You lost!" },
          });
        }

        setLoading(false);
        dataFetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching game data:", error);
        setError("Unable to load game data");
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, token, user, dispatch]);

  const setGameMessage = (message) => {
    dispatch({
      type: "SET_GAME_MESSAGE",
      payload: { message },
    });
  };

  const handleCellClick = async (row, col) => {
    console.log("Board clicked:", row, col);
    console.log("Current game state:", {
      gameStatus: state.gameStatus,
      currentTurn: state.currentTurn,
      isMyTurn: isMyTurn,
      userId: user?._id,
    });

    if (clickDisabledRef.current) {
      console.log("Click temporarily disabled to prevent double clicks");
      return;
    }

    if (state.gameStatus !== "playing") {
      console.log("Game not in progress");
      return;
    }

    if (!isMyTurn) {
      console.log("Not your turn");
      return;
    }

    if (state.opponentBoard[row][col]?.isHit) {
      console.log("This position has already been attacked");
      return;
    }

    try {
      console.log("Attempting move:", row, col);

      clickDisabledRef.current = true;

      dispatch({
        type: "PLAYER_MOVE_ATTEMPT",
        payload: { row, col },
      });

      setIsMyTurn(false);

      const response = await fetch(
        `http://localhost:8000/api/games/${gameId}/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ row, col }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send move request");
      }

      const moveResult = await response.json();
      console.log("Move result:", moveResult);

      dispatch({
        type: "MOVE_RESULT",
        payload: {
          isPlayerMove: true,
          moveRow: row,
          moveCol: col,
          isHit: moveResult.isHit,
          hitShipId: moveResult.hitShipId || null,
          isSunk: moveResult.isSunk || false,
          isGameOver: moveResult.isGameOver || false,
          nextTurn: moveResult.isGameOver ? null : "opponent",
        },
      });

      setError("");

      if (moveResult.isGameOver) {
        dispatch({
          type: "SET_GAME_MESSAGE",
          payload: { message: "You won!" },
        });

        await fetch(`http://localhost:8000/api/games/${gameId}/end`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ winnerId: user._id }),
        });

        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
    } catch (error) {
      console.error("Move error:", error);
      setError(error.message);
      clickDisabledRef.current = false;
      await checkGameStatus();
    }
  };

  const handleLeaveGame = useCallback(() => {
    console.log("Attempting to leave game");

    if (gameId && token) {
      try {
        fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then(() => {
            console.log("Successfully left game");
            if (pollInterval) {
              clearInterval(pollInterval);
            }
            navigate("/games");
          })
          .catch((error) => {
            console.error("Error leaving game:", error);
            navigate("/games");
          });
      } catch (error) {
        console.error("Error in leave game function:", error);
        navigate("/games");
      }
    } else {
      navigate("/games");
    }
  }, [gameId, token, navigate, pollInterval]);

  const handleReady = async () => {
    console.log("Start game button clicked");
    console.log("Game state:", state);

    try {
      const response = await fetch(
        `http://localhost:8000/api/games/${gameId}/ready`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ships: state.playerShips,
            board: state.playerBoard,
          }),
        }
      );

      const responseData = await response.json();
      console.log("Ready response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Preparation failed");
      }

      dispatch({
        type: "PLAYER_READY",
      });

      if (pollInterval) {
        clearInterval(pollInterval);
      }

      const newInterval = setInterval(() => {
        checkGameStatus();
      }, 1000);

      setPollInterval(newInterval);
    } catch (error) {
      console.error("Ready error:", error);
      setError(error.message);
    }
  };

  console.log("Rendering MultiplayerGamePage, state:", {
    gameStatus: state.gameStatus,
    currentTurn: state.currentTurn,
    isMyTurn,
    opponentUser,
  });

  if (loading) {
    return (
      <main>
        <h1>Loading game...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>Error</h1>
        <p className="error-message">{error}</p>
        <button className="return-btn" onClick={() => navigate("/games")}>
          Return to game list
        </button>
      </main>
    );
  }

  if (state.gameStatus === "waiting") {
    return (
      <main>
        <h1>Multiplayer - Waiting for opponent</h1>
        <div className="game-message">
          <h2>Waiting for opponent to join the game...</h2>
        </div>
        <button className="cancel-btn" onClick={handleLeaveGame}>
          Leave game
        </button>
      </main>
    );
  }

  if (state.gameStatus === "placing" || state.gameStatus === "ready") {
    return (
      <main>
        <h1>Multiplayer - Ready to start</h1>
        <div className="game-message">
          <h2>All ships placed! Click "Start Game" to begin</h2>
        </div>
        <div className="placement-actions">
          <button className="start-game-btn" onClick={handleReady}>
            Start Game
          </button>
          <button className="cancel-btn" onClick={handleLeaveGame}>
            Leave Game
          </button>
        </div>
      </main>
    );
  }

  if (state.gameStatus === "waiting_opponent") {
    return (
      <main>
        <h1>Multiplayer - Waiting for opponent to get ready</h1>
        <div className="game-message">
          <h2>{state.gameMessage || "Waiting for opponent..."}</h2>
        </div>
        <button className="cancel-btn" onClick={handleLeaveGame}>
          Leave Game
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Multiplayer</h1>

      {state.gameMessage && (
        <div className="game-message">
          <h2>{state.gameMessage}</h2>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {opponentUser && (
        <div className="opponent-info">
          <p>Opponent: {opponentUser.username}</p>
          <p>Current turn: {isMyTurn ? "Your turn" : "Opponent's turn"}</p>
        </div>
      )}

      <div className="game-container">
        <div className="board-section">
          <GameBoard
            board={
              state.opponentBoard ||
              Array(10)
                .fill()
                .map(() => Array(10).fill(null))
            }
            isEnemy={true}
            onCellClick={handleCellClick}
          />
          <p className="board-label">Opponent's ships</p>
        </div>

        <div className="board-section">
          <GameBoard
            board={
              state.playerBoard ||
              Array(10)
                .fill()
                .map(() => Array(10).fill(null))
            }
            isEnemy={false}
            onCellClick={() => {}}
          />
          <p className="board-label">Your ships</p>
        </div>
      </div>

      <div className="game-controls">
        <button className="leave-game-btn" onClick={handleLeaveGame}>
          Leave Game
        </button>
      </div>
    </main>
  );
};

export default MultiplayerGamePage;
