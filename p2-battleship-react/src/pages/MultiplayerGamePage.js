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
  const lastGameStateRef = useRef(null);
  const initBoardAndShipsRef = useRef(false);
  const movesHistoryRef = useRef([]);
  const gameStartForcedRef = useRef(false);
  const readyStatusRef = useRef(false);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  const forceStartGame = useCallback(
    (gameData) => {
      console.log("FORCE STARTING GAME!");

      const gameDataShips = gameData.gameData.ships || {};
      const gameDataBoards = gameData.gameData.boards || {};

      const isPlayerTurn = gameData.gameData.currentTurn === user._id;
      const playerShips = gameDataShips[user._id] || state.playerShips;

      let opponentBoard = Array(10)
        .fill()
        .map(() => Array(10).fill(null));

      if (gameData.gameData.moves) {
        gameData.gameData.moves.forEach((move) => {
          if (move.player === user._id) {
            if (!opponentBoard[move.row]) {
              opponentBoard[move.row] = Array(10).fill(null);
            }

            if (!opponentBoard[move.row][move.col]) {
              opponentBoard[move.row][move.col] = {};
            }

            opponentBoard[move.row][move.col].isHit = true;
            opponentBoard[move.row][move.col].hasShip = move.isHit;
          }
        });
      }

      dispatch({
        type: "INIT_GAME_BOARDS",
        payload: {
          playerBoard: gameDataBoards[user._id] || state.playerBoard,
          playerShips: playerShips,
          opponentBoard: opponentBoard,
        },
      });

      dispatch({
        type: "GAME_STARTED",
        payload: {
          firstTurn: isPlayerTurn ? "player" : "opponent",
          playerShips: playerShips,
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

      setIsMyTurn(isPlayerTurn);
      gameStartForcedRef.current = true;
    },
    [user, state.playerBoard, state.playerShips, dispatch]
  );

  const handleAutoReady = async (board, ships) => {
    const maxRetries = 3;
    let retryCount = 0;

    const attemptReady = async () => {
      try {
        console.log("Auto-sending ready state with ships:", ships);

        const response = await fetch(
          `http://localhost:8000/api/games/${gameId}/ready`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ships: ships,
              board: board,
            }),
          }
        );

        const responseData = await response.json();
        console.log("Ready response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.message || "Auto-ready failed");
        }

        dispatch({
          type: "PLAYER_READY",
        });

        readyStatusRef.current = true;
        console.log("Player successfully ready");

        setTimeout(() => {
          checkGameStatus(true);
          setTimeout(() => checkGameStatus(true), 1000);
          setTimeout(() => checkGameStatus(true), 2000);
        }, 500);
      } catch (error) {
        console.error("Auto-ready error:", error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying auto-ready (${retryCount}/${maxRetries})...`);
          setTimeout(attemptReady, 1000);
        } else {
          setError(
            `Failed to send ship positions after ${maxRetries} attempts`
          );
        }
      }
    };

    attemptReady();
  };

  const checkGameStatus = useCallback(
    async (forceCheck = false) => {
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

        // Log current turn information for debugging
        console.log("Server game status:", gameData.status);
        console.log("Server current turn:", gameData.gameData?.currentTurn);
        console.log("Current user ID:", user._id);
        console.log("Current frontend turn state:", state.currentTurn);

        // Skip redundant updates unless forced
        if (
          !forceCheck &&
          lastGameStateRef.current &&
          JSON.stringify(lastGameStateRef.current) === JSON.stringify(gameData)
        ) {
          return false;
        }

        lastGameStateRef.current = gameData;

        // Check for game completion
        if (gameData.status === "completed") {
          console.log("Game is completed according to server!");
          const isWinner = gameData.winner === user._id;

          dispatch({
            type: "GAME_STATUS_UPDATE",
            payload: {
              status: "gameOver",
              winner: isWinner ? "player" : "opponent",
            },
          });

          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }

          return true;
        }

        // Check if all players are ready, even if game not started
        if (
          gameData.players &&
          gameData.players.length >= 2 &&
          gameData.players.every((p) => p.ready) &&
          !gameStartForcedRef.current
        ) {
          console.log("All players are ready! Attempting to force start game");

          if (gameData.status === "waiting") {
            setTimeout(() => checkGameStatus(true), 1000);
          } else if (gameData.status === "in_progress") {
            forceStartGame(gameData);
            return true;
          }
        }

        // Handle in-progress game updates
        if (gameData.status === "in_progress") {
          if (!gameData.gameData || !gameData.gameData.currentTurn) {
            return false;
          }

          // Check if opponent is still in the game
          if (gameData.players && gameData.players.length > 1) {
            const opponent = gameData.players.find(
              (player) => player.user && player.user._id !== user._id
            );

            if (opponent && opponent.user) {
              setOpponentUser(opponent.user);

              if (!state.opponent || state.opponent._id !== opponent.user._id) {
                dispatch({
                  type: "SET_OPPONENT",
                  payload: { opponent: opponent.user },
                });
              }
            } else {
              // Opponent no longer found in the player list
              console.log("Opponent no longer in game, they likely left");
              dispatch({
                type: "OPPONENT_LEFT",
              });

              if (pollInterval) {
                clearInterval(pollInterval);
                setPollInterval(null);
              }

              return true;
            }
          } else if (
            gameData.status !== "completed" &&
            state.gameStatus !== "gameOver"
          ) {
            // Only one player is left in an in-progress game
            console.log(
              "Only one player left in the game - opponent likely left"
            );
            dispatch({
              type: "OPPONENT_LEFT",
            });

            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }

            return true;
          }

          // Force start game if needed
          if (
            state.gameStatus === "waiting" ||
            state.gameStatus === "waiting_opponent" ||
            state.gameStatus === "ready" ||
            !gameStartForcedRef.current
          ) {
            console.log(
              "Game is in progress but frontend is still waiting, forcing start"
            );
            forceStartGame(gameData);
            return true;
          }

          const gameDataShips = gameData.gameData.ships || {};
          const gameDataBoards = gameData.gameData.boards || {};
          const gameDataMoves = gameData.gameData.moves || [];

          if (gameDataMoves.length > 0) {
            movesHistoryRef.current = gameDataMoves;
          }

          if (!gameDataShips[user._id] || !gameDataBoards[user._id]) {
            console.log(
              "Ship data missing for current user, sending auto-ready"
            );

            if (!initBoardAndShipsRef.current) {
              const { board, ships } = placeShipsRandomly();
              initBoardAndShipsRef.current = true;

              dispatch({
                type: "INIT_PLAYER_BOARD",
                payload: { board, ships },
              });

              handleAutoReady(board, ships);
            }
          }

          // Important: Update turn state based on server data
          const isPlayerTurn = gameData.gameData.currentTurn === user._id;

          // Only dispatch turn update if it's different from current state
          if (
            (isPlayerTurn && state.currentTurn !== "player") ||
            (!isPlayerTurn && state.currentTurn !== "opponent")
          ) {
            console.log(
              `Turn has changed! Setting turn to: ${
                isPlayerTurn ? "player" : "opponent"
              }`
            );

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

            setIsMyTurn(isPlayerTurn);
            clickDisabledRef.current = false;
          }

          if (state.gameStatus !== "playing") {
            const playerShips = gameDataShips[user._id] || state.playerShips;

            let opponentBoard = Array(10)
              .fill()
              .map(() => Array(10).fill(null));

            gameDataMoves.forEach((move) => {
              if (move.player === user._id) {
                if (!opponentBoard[move.row]) {
                  opponentBoard[move.row] = Array(10).fill(null);
                }

                if (!opponentBoard[move.row][move.col]) {
                  opponentBoard[move.row][move.col] = {};
                }

                opponentBoard[move.row][move.col].isHit = true;
                opponentBoard[move.row][move.col].hasShip = move.isHit;
              }
            });

            dispatch({
              type: "INIT_GAME_BOARDS",
              payload: {
                playerBoard: gameDataBoards[user._id] || state.playerBoard,
                playerShips: playerShips,
                opponentBoard: opponentBoard,
              },
            });

            dispatch({
              type: "GAME_STARTED",
              payload: {
                firstTurn: isPlayerTurn ? "player" : "opponent",
                playerShips: playerShips,
              },
            });

            return true;
          }
        }

        return false;
      } catch (error) {
        console.error("Error checking game status:", error);

        if (error.message !== "Failed to fetch") {
          setError("Unable to get game status");
        }
        return false;
      }
    },
    [
      gameId,
      token,
      user,
      dispatch,
      state.gameStatus,
      state.currentTurn,
      state.opponent,
      state.playerShips,
      state.playerBoard,
      pollInterval,
      forceStartGame,
    ]
  );

  useEffect(() => {
    if (!gameId || !token || !user) return;

    if (pollInterval) {
      clearInterval(pollInterval);
    }

    // Use shorter polling intervals for better responsiveness
    let intervalTime = 500; // Default to 500ms for faster updates

    if (state.gameStatus === "gameOver") {
      intervalTime = 2000; // Less frequent if game is over
    }

    const interval = setInterval(() => {
      checkGameStatus();
    }, intervalTime);

    setPollInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameId, token, user, state.gameStatus, checkGameStatus]);

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

        lastGameStateRef.current = gameData;

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

        // 检查是否所有玩家都已准备就绪，但游戏尚未开始
        if (
          gameData.players &&
          gameData.players.length >= 2 &&
          gameData.players.every((p) => p.ready) &&
          gameData.status !== "in_progress"
        ) {
          console.log("All players ready but game not started yet");
          setTimeout(() => checkGameStatus(true), 1000);
        }

        if (gameData.status === "in_progress") {
          console.log("Game already in progress, starting immediately");
          forceStartGame(gameData);
        } else if (gameData.status === "waiting") {
          if (!initBoardAndShipsRef.current) {
            const { board, ships } = placeShipsRandomly();

            initBoardAndShipsRef.current = true;

            dispatch({
              type: "START_PLACEMENT_PHASE",
            });

            dispatch({
              type: "INIT_PLAYER_BOARD",
              payload: { board, ships },
            });

            handleAutoReady(board, ships);

            dispatch({
              type: "SET_GAME_MESSAGE",
              payload: { message: "Game ready, waiting for opponent to join" },
            });
          }
        } else if (gameData.status === "completed") {
          const isWinner = gameData.winner && gameData.winner._id === user._id;

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
  }, [gameId, token, user, dispatch, checkGameStatus, forceStartGame]);

  const setGameMessage = (message) => {
    dispatch({
      type: "SET_GAME_MESSAGE",
      payload: { message },
    });
  };

  const handleCellClick = async (row, col) => {
    if (clickDisabledRef.current) {
      return;
    }

    if (state.gameStatus !== "playing" || !isMyTurn) {
      return;
    }

    if (
      state.opponentBoard &&
      state.opponentBoard[row] &&
      state.opponentBoard[row][col] &&
      state.opponentBoard[row][col].isHit
    ) {
      return;
    }

    try {
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
      console.log("Move result:", moveResult); // Add this log to debug

      movesHistoryRef.current.push({
        player: user._id,
        row,
        col,
        isHit: moveResult.isHit,
        timestamp: Date.now(),
      });

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

      // Add more explicit handling for game over condition
      if (moveResult.isGameOver) {
        console.log("Game is over! Setting game over state");

        // Update the game status immediately
        dispatch({
          type: "SET_GAME_MESSAGE",
          payload: { message: "You won!" },
        });

        // Stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }

        // Set the game status to gameOver
        dispatch({
          type: "GAME_STATUS_UPDATE",
          payload: { status: "gameOver", winner: "player" },
        });

        // Send the game end request to the server
        try {
          await fetch(`http://localhost:8000/api/games/${gameId}/end`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ winnerId: user._id }),
          });
          console.log("Game end request sent successfully");
        } catch (endError) {
          console.error("Error ending game:", endError);
        }
      }

      setTimeout(() => checkGameStatus(true), 500);
    } catch (error) {
      console.error("Move error:", error);
      setError(error.message);
    } finally {
      setTimeout(() => {
        clickDisabledRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    if (readyStatusRef.current && state.gameStatus === "waiting_opponent") {
      console.log("Checking if game has started...");
      const checkIfGameStarted = async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/api/games/${gameId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.status === "in_progress") {
              console.log("GAME HAS STARTED! FORCING UPDATE!");
              forceStartGame(data);
            }
          }
        } catch (error) {
          console.error("Error checking game status:", error);
        }
      };

      checkIfGameStarted();
      const interval = setInterval(checkIfGameStarted, 1000);

      return () => clearInterval(interval);
    }
  }, [state.gameStatus, gameId, token, forceStartGame]);

  const handleLeaveGame = useCallback(() => {
    if (gameId && token) {
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      try {
        fetch(`http://localhost:8000/api/games/${gameId}/leave`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then(() => {
            navigate("/games");
          })
          .catch(() => {
            navigate("/games");
          });
      } catch (error) {
        navigate("/games");
      }
    } else {
      navigate("/games");
    }
  }, [gameId, token, navigate, pollInterval]);

  const handleReady = async () => {
    try {
      console.log("Sending ready with ships:", state.playerShips);
      console.log("Board data:", state.playerBoard ? "YES" : "NO");

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

      if (!response.ok) {
        throw new Error(responseData.message || "Preparation failed");
      }

      readyStatusRef.current = true;
      dispatch({
        type: "PLAYER_READY",
      });

      setTimeout(() => {
        checkGameStatus(true);
        setTimeout(() => checkGameStatus(true), 1000);
      }, 500);
    } catch (error) {
      console.error("Ready error:", error);
      setError(error.message);
    }
  };

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
          <button
            className="retry-btn"
            onClick={() => checkGameStatus(true)}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Check Status
          </button>
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
