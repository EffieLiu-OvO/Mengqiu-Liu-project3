// src/components/GameBoard.js
import React from "react";
import Cell from "./Cell";

const GameBoard = ({ board, isEnemy, onCellClick }) => {
  // Check if board is valid
  if (!board || !Array.isArray(board) || board.length === 0) {
    console.error("Invalid board data:", board);
    return (
      <section className="board-section">
        <h2>{isEnemy ? "Enemy Board" : "Your Board"}</h2>
        <div>Error loading board</div>
      </section>
    );
  }

  return (
    <section className="board-section">
      <h2>{isEnemy ? "Enemy Board" : "Your Board"}</h2>
      <table className="game-board">
        <tbody>
          {board.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  cell={cell}
                  isEnemy={isEnemy}
                  onClick={() => isEnemy && onCellClick(rowIndex, colIndex)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default GameBoard;
