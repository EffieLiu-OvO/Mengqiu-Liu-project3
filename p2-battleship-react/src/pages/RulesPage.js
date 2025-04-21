import React from "react";
import "../styles/Rules.css";

const RulesPage = () => {
  return (
    <main>
      <h1>Game Rules</h1>
      <section className="rules-section">
        <h2>Rules</h2>
        <ol className="rules-list">
          <li>Each player has a fleet of ships placed on a grid.</li>
          <li>
            Players take turns guessing enemy ship locations by selecting grid
            coordinates.
          </li>
          <li>Hits and misses are marked on the board.</li>
          <li>The first player to sink all enemy ships wins the game.</li>
          <li>In normal mode, you and AI will take turns.</li>
          <li>
            In free play mode, AI will not take any turns, and you can practice
            freely.
          </li>
        </ol>
      </section>

      <section className="game-modes-section">
        <h2>Game Modes</h2>
        <ul className="game-modes-list">
          <li>
            <strong>Normal Mode:</strong> Standard Battleship game where you and
            the AI take turns.
          </li>
          <li>
            <strong>Free Play Mode:</strong> Only shows the opponent board. The
            AI does not take turns, allowing you to practice without risk.
          </li>
        </ul>
      </section>

      <section className="ship-types-section">
        <h2>Ship Types</h2>
        <ul className="ship-types-list">
          <li>1 Carrier (5 cells)</li>
          <li>1 Battleship (4 cells)</li>
          <li>2 Cruisers (3 cells each)</li>
          <li>1 Destroyer (2 cells)</li>
        </ul>
      </section>

      <section className="credits-section">
        <h2>Credits</h2>
        <div className="credits">
          <p>Created by Mengqiu Liu</p>
          <p>
            Email:
            <a href="mailto:liumengqiu23@gmail.com">liumengqiu23@gmail.com</a>
          </p>
          <p>
            GitHub:
            <a
              href="https://github.com/mengqiu97"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/mengqiu97
            </a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default RulesPage;
