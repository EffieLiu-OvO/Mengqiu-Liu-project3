import React from "react";
import { useGame } from "../context/GameContext";

const GameControls = () => {
  const { state, dispatch } = useGame();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getGameStatus = () => {
    if (state.gameStatus === "waiting") {
      return "Game not started";
    } else if (state.gameStatus === "placement") {
      return "Place your ships";
    } else if (state.gameStatus === "ready") {
      return "Ready to start";
    } else if (state.gameStatus === "gameOver") {
      return `Game over! ${state.winner === "player" ? "You" : "AI"} Won!`;
    } else {
      return `${state.currentTurn === "player" ? "Your" : "AI's"} turn`;
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET_GAME" });
  };

  const handleStartGame = (mode) => {
    dispatch({
      type: "START_GAME",
      payload: { gameMode: mode },
    });
  };

  const handleStartPlacement = () => {
    dispatch({ type: "START_PLACEMENT_PHASE" });
  };

  const renderControls = () => {
    if (state.gameStatus === "waiting") {
      return (
        <>
          <div className="game-mode-selection">
            <button
              className="game-mode-btn"
              onClick={() => handleStartGame("normal")}
            >
              Quick Start (Auto Placement)
            </button>
            <button className="game-mode-btn" onClick={handleStartPlacement}>
              Manual Ship Placement
            </button>
          </div>
          <div className="difficulty-selection">
            <button
              className="difficulty-btn"
              onClick={() => handleStartGame("easy")}
            >
              Easy Mode
            </button>
            <button
              className="difficulty-btn"
              onClick={() => handleStartGame("normal")}
            >
              Normal Mode
            </button>
          </div>
        </>
      );
    }

    if (state.gameStatus === "ready") {
      return (
        <button
          className="start-game-btn"
          onClick={() =>
            dispatch({
              type: "START_GAME_WITH_PLACED_SHIPS",
              payload: { gameMode: "normal" },
            })
          }
        >
          Start Game
        </button>
      );
    }

    return (
      <button className="restart-btn" onClick={handleReset}>
        Reset
      </button>
    );
  };

  return (
    <div className="controls">
      {state.gameStatus !== "waiting" && state.gameStatus !== "placement" && (
        <p className="timer">
          Timer:{" "}
          <span className="time-value">{formatTime(state.gameTime)}</span>
        </p>
      )}
      <p className="status">
        Status: <span className="game-status">{getGameStatus()}</span>
      </p>
      {renderControls()}
    </div>
  );
};

export default GameControls;
