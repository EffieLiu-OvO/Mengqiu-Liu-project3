import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import { useGame } from "../context/GameContext";
import battleshipImage from "../assets/battleship.jpg";

const HomePage = () => {
  const { dispatch } = useGame();

  const startGame = (mode) => {
    dispatch({
      type: "START_GAME",
      payload: { gameMode: mode },
    });
  };

  const startPlacement = () => {
    dispatch({ type: "RESET_GAME" });
    dispatch({ type: "START_PLACEMENT_PHASE" });
  };

  return (
    <main>
      <h1>Welcome to Battleship!</h1>
      <p>Select a game mode to begin:</p>

      <div className="game-modes">
        <div className="game-mode-section">
          <h2>Quick Start</h2>
          <div className="mode-buttons">
            <Link
              to="/game/normal"
              className="game-mode-button"
              onClick={() => startGame("normal")}
            >
              Normal Game
            </Link>
            <Link
              to="/game/easy"
              className="game-mode-button"
              onClick={() => startGame("easy")}
            >
              Free Play Mode
            </Link>
          </div>
        </div>

        <div className="game-mode-section">
          <h2>Custom Game</h2>
          <Link
            to="/game/placement"
            className="game-mode-button placement-button"
            onClick={startPlacement}
          >
            Place Ships Manually
          </Link>
          <p className="mode-description">
            Click to position your ships strategically
          </p>
        </div>
      </div>

      <div className="image-container">
        <img
          src={battleshipImage}
          alt="Battleship game"
          className="clickable-image"
        />
      </div>
    </main>
  );
};

export default HomePage;
