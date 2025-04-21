import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GameBoard from "../components/GameBoard";
import GameControls from "../components/GameControls";
import ShipPlacementBoard from "../components/ShipPlacementBoard";
import { useGame } from "../context/GameContext";
import "../styles/Game.css";

const GamePage = () => {
  const { mode, id: gameId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const gameContainerRef = useRef(null);
  const [gameMessage, setGameMessage] = useState("");

  // 获取当前用户信息和令牌
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem("token");

  // 获取对手ID (在真实多人游戏中，这应该从服务器获取)
  const [opponentId, setOpponentId] = useState(null);

  // 游戏结束时调用此函数
  const handleGameEnd = async (winnerId) => {
    if (!token || !gameId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/games/${gameId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ winnerId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "结束游戏失败");
      }

      // 游戏成功结束后的逻辑
      const gameData = await response.json();

      // 显示胜利者信息
      if (gameData.winner) {
        const winnerName = gameData.winner.username;
        setGameMessage(`${winnerName} 获胜!`);
      }
    } catch (error) {
      console.error("结束游戏错误:", error);
    }
  };

  // 检查游戏是否结束
  const checkGameEnd = useCallback(() => {
    // 检查对手的所有船只是否被击沉
    const allEnemyShipsSunk =
      state.enemyBoard.ships &&
      state.enemyBoard.ships.every((ship) => ship.isSunk());

    if (allEnemyShipsSunk) {
      // 如果对手所有船只都被击沉，当前玩家胜利
      if (user && gameId) {
        handleGameEnd(user._id);
      }
      setGameMessage("你赢了!");
      dispatch({ type: "END_GAME", payload: { winner: "player" } });
      return true;
    }

    // 检查玩家的所有船只是否被击沉
    const allPlayerShipsSunk =
      state.playerBoard.ships &&
      state.playerBoard.ships.every((ship) => ship.isSunk());

    if (allPlayerShipsSunk) {
      // 如果玩家所有船只都被击沉，对手胜利
      if (opponentId && gameId) {
        handleGameEnd(opponentId);
      }
      setGameMessage("你输了!");
      dispatch({ type: "END_GAME", payload: { winner: "enemy" } });
      return true;
    }

    return false;
  }, [
    state.enemyBoard.ships,
    state.playerBoard.ships,
    user,
    opponentId,
    gameId,
    dispatch,
  ]);

  // Memoize handleCellTouch with useCallback to prevent unnecessary recreations
  const handleCellTouch = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.type === "touchend") {
        const cellElement = e.target.closest("td");
        if (cellElement) {
          const rowElement = cellElement.parentElement;
          const rowIndex = Array.from(
            rowElement.parentElement.children
          ).indexOf(rowElement);
          const colIndex = Array.from(rowElement.children).indexOf(cellElement);

          if (
            rowElement
              .closest(".game-board")
              .previousElementSibling.textContent.includes("Enemy")
          ) {
            if (
              state.currentTurn === "player" &&
              state.gameStatus === "playing"
            ) {
              dispatch({
                type: "PLAYER_MOVE",
                payload: { row: rowIndex, col: colIndex },
              });

              // 检查游戏是否结束
              setTimeout(() => {
                checkGameEnd();
              }, 300);
            }
          }
        }
      }
    },
    [state.currentTurn, state.gameStatus, dispatch, checkGameEnd]
  );

  useEffect(() => {
    if (mode !== "normal" && mode !== "easy" && mode !== "placement") {
      navigate("/");
      return;
    }

    if (mode === "placement" && state.gameStatus === "waiting") {
      dispatch({ type: "START_PLACEMENT_PHASE" });
      return;
    }

    if (state.gameStatus === "waiting" && mode !== "placement") {
      dispatch({
        type: "START_GAME",
        payload: { gameMode: mode },
      });
    }

    // 如果是多人游戏，从服务器获取游戏和玩家信息
    if (gameId && token) {
      const fetchGameInfo = async () => {
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
            const gameData = await response.json();
            // 设置对手ID
            if (gameData.players && gameData.players.length > 1) {
              const opponent = gameData.players.find(
                (player) => player.user._id !== user._id
              );
              if (opponent) {
                setOpponentId(opponent.user._id);
              }
            }
          }
        } catch (error) {
          console.error("获取游戏信息错误:", error);
        }
      };

      fetchGameInfo();
    }
  }, [mode, navigate, dispatch, state.gameStatus, gameId, token, user]);

  useEffect(() => {
    if (state.gameStatus === "placement" || state.gameStatus === "ready") {
      return;
    }

    const timer = setTimeout(() => {
      const cells = document.querySelectorAll(".game-board td");

      cells.forEach((cell) => {
        cell.removeEventListener("touchstart", handleCellTouch);
        cell.removeEventListener("touchend", handleCellTouch);

        cell.addEventListener("touchstart", handleCellTouch, {
          passive: false,
        });
        cell.addEventListener("touchend", handleCellTouch, { passive: false });
      });

      document.addEventListener(
        "dblclick",
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );

      const gameBoards = document.querySelectorAll(".game-board");
      gameBoards.forEach((board) => {
        board.addEventListener(
          "touchmove",
          (e) => {
            e.preventDefault();
          },
          { passive: false }
        );
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      const cells = document.querySelectorAll(".game-board td");
      cells.forEach((cell) => {
        cell.removeEventListener("touchstart", handleCellTouch);
        cell.removeEventListener("touchend", handleCellTouch);
      });
    };
  }, [state.enemyBoard, state.playerBoard, state.gameStatus, handleCellTouch]);

  // 添加AI回合结束后的游戏结束检查
  useEffect(() => {
    if (state.currentTurn === "player" && state.gameStatus === "playing") {
      checkGameEnd();
    }
  }, [state.currentTurn, state.gameStatus, checkGameEnd]);

  const handleCellClick = (row, col) => {
    if (state.currentTurn === "player" && state.gameStatus === "playing") {
      dispatch({
        type: "PLAYER_MOVE",
        payload: { row, col },
      });

      // 检查游戏是否结束
      setTimeout(() => {
        checkGameEnd();
      }, 300);
    }
  };

  const handleStartGameWithPlacedShips = () => {
    dispatch({
      type: "START_GAME_WITH_PLACED_SHIPS",
      payload: { gameMode: "normal" },
    });

    // 如果有游戏ID，跳转到该游戏页面
    if (gameId) {
      navigate(`/game/${gameId}`);
    } else {
      navigate("/game/normal");
    }
  };

  const containerStyle = {
    display: "flex",
    flexDirection: window.innerWidth > 768 ? "row" : "column",
    gap: "40px",
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
    padding: "0 10px",
  };

  const boardSectionStyle = {
    width: window.innerWidth > 768 ? "48%" : "100%",
    maxWidth: window.innerWidth > 768 ? "48%" : "500px",
    marginBottom: window.innerWidth > 768 ? "0" : "20px",
  };

  const renderContent = () => {
    if (
      mode === "placement" ||
      state.gameStatus === "placement" ||
      state.gameStatus === "ready"
    ) {
      return (
        <>
          <h1>Battleship Game - Place Your Ships</h1>
          <ShipPlacementBoard />
          {state.gameStatus === "ready" && (
            <div className="placement-actions">
              <button
                className="start-game-btn"
                onClick={handleStartGameWithPlacedShips}
              >
                Start Game
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  dispatch({ type: "RESET_GAME" });
                  navigate("/");
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <h1>
          Battleship Game -{" "}
          {mode === "normal" ? "Normal Mode" : "Free Play Mode"}
        </h1>

        {gameMessage && (
          <div className="game-message">
            <h2>{gameMessage}</h2>
          </div>
        )}

        <div
          className="game-container"
          ref={gameContainerRef}
          style={containerStyle}
        >
          <div className="board-section" style={boardSectionStyle}>
            <GameBoard
              board={state.enemyBoard}
              isEnemy={true}
              onCellClick={handleCellClick}
            />
          </div>

          {mode === "normal" && (
            <div className="board-section" style={boardSectionStyle}>
              <GameBoard
                board={state.playerBoard}
                isEnemy={false}
                onCellClick={() => {}}
              />
            </div>
          )}
        </div>

        <GameControls />
      </>
    );
  };

  return <main>{renderContent()}</main>;
};

export default GamePage;
