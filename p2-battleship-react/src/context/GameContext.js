import React, { createContext, useContext, useReducer, useEffect } from "react";
import { placeShipsRandomly } from "../utils/shipPlacement";

const GameContext = createContext();

const getInitialState = () => {
  try {
    const savedState = localStorage.getItem("battleshipGameState");
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }

  return {
    playerBoard: Array(10)
      .fill()
      .map(() => Array(10).fill(null)),
    enemyBoard: Array(10)
      .fill()
      .map(() => Array(10).fill(null)),
    playerShips: [],
    enemyShips: [],
    gameStatus: "waiting",
    currentTurn: "player",
    winner: null,
    gameMode: null,
    gameTime: 0,
    isTimerRunning: false,
    placementPhase: false,
    shipsToPlace: [],
    selectedShip: null,
    shipOrientation: "horizontal",
  };
};

const initialState = getInitialState();

const saveStateToStorage = (state) => {
  try {
    localStorage.setItem("battleshipGameState", JSON.stringify(state));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

const clearStorage = () => {
  try {
    localStorage.removeItem("battleshipGameState");
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};

function isValidPlacement(board, startRow, startCol, shipSize, orientation) {
  if (orientation === "horizontal" && startCol + shipSize > 10) return false;
  if (orientation === "vertical" && startRow + shipSize > 10) return false;

  for (let i = 0; i < shipSize; i++) {
    const row = orientation === "horizontal" ? startRow : startRow + i;
    const col = orientation === "horizontal" ? startCol + i : startCol;

    if (row >= 10 || col >= 10) return false;

    if (board[row][col]?.hasShip) return false;
  }

  return true;
}

const gameReducer = (state, action) => {
  let newState;

  switch (action.type) {
    case "START_GAME":
      const { gameMode } = action.payload;
      console.log("Starting game with mode:", gameMode);

      const validMode = gameMode === "easy" ? "easy" : "normal";
      const { board: playerBoard, ships: playerShips } = placeShipsRandomly();
      const { board: enemyBoard, ships: enemyShips } = placeShipsRandomly();

      newState = {
        ...state,
        playerBoard,
        enemyBoard,
        playerShips,
        enemyShips,
        gameStatus: "playing",
        currentTurn: "player",
        winner: null,
        gameMode: validMode,
        gameTime: 0,
        isTimerRunning: true,
      };

      saveStateToStorage(newState);
      return newState;

    case "START_PLACEMENT_PHASE":
      const shipsToPlace = [
        { size: 5, id: "carrier" },
        { size: 4, id: "battleship" },
        { size: 3, id: "cruiser" },
        { size: 3, id: "submarine" },
        { size: 2, id: "destroyer" },
      ];

      return {
        ...state,
        placementPhase: true,
        shipsToPlace,
        selectedShip: shipsToPlace[0].id,
        playerBoard: Array(10)
          .fill()
          .map(() => Array(10).fill(null)),
        playerShips: [],
        gameStatus: "placement",
      };

    case "SELECT_SHIP":
      return {
        ...state,
        selectedShip: action.payload.shipId,
      };

    case "TOGGLE_ORIENTATION":
      return {
        ...state,
        shipOrientation:
          state.shipOrientation === "horizontal" ? "vertical" : "horizontal",
      };

    case "PLACE_SHIP":
      const { row, col, shipId } = action.payload;
      const shipToPlace = state.shipsToPlace.find((ship) => ship.id === shipId);

      if (!shipToPlace) return state;

      if (
        !isValidPlacement(
          state.playerBoard,
          row,
          col,
          shipToPlace.size,
          state.shipOrientation
        )
      ) {
        return state;
      }

      const newPlayerBoard = JSON.parse(JSON.stringify(state.playerBoard));
      const positions = [];

      for (let i = 0; i < shipToPlace.size; i++) {
        const posRow = state.shipOrientation === "horizontal" ? row : row + i;
        const posCol = state.shipOrientation === "horizontal" ? col + i : col;

        if (posRow >= 10 || posCol >= 10) continue;

        newPlayerBoard[posRow][posCol] = { hasShip: true };
        positions.push({ row: posRow, col: posCol });
      }

      const newPlayerShips = [
        ...state.playerShips,
        {
          id: shipToPlace.id,
          size: shipToPlace.size,
          positions,
          hits: 0,
        },
      ];

      const remainingShips = state.shipsToPlace.filter(
        (ship) => ship.id !== shipId
      );

      const allShipsPlaced = remainingShips.length === 0;

      return {
        ...state,
        playerBoard: newPlayerBoard,
        playerShips: newPlayerShips,
        shipsToPlace: remainingShips,
        selectedShip: allShipsPlaced ? null : remainingShips[0].id,
        placementPhase: !allShipsPlaced,
        gameStatus: allShipsPlaced ? "ready" : "placement",
      };

    case "START_GAME_WITH_PLACED_SHIPS":
      const { board: enemyBoardPlaced, ships: enemyShipsPlaced } =
        placeShipsRandomly();

      newState = {
        ...state,
        enemyBoard: enemyBoardPlaced,
        enemyShips: enemyShipsPlaced,
        gameStatus: "playing",
        currentTurn: "player",
        winner: null,
        gameMode: action.payload.gameMode || "normal",
        gameTime: 0,
        isTimerRunning: true,
        placementPhase: false,
      };

      saveStateToStorage(newState);
      return newState;

    case "PLAYER_MOVE":
      const { row: moveRow, col: moveCol } = action.payload;
      console.log(
        "Player move at:",
        moveRow,
        moveCol,
        "Current mode:",
        state.gameMode
      );

      if (
        state.gameStatus !== "playing" ||
        state.currentTurn !== "player" ||
        state.enemyBoard[moveRow][moveCol]?.isHit
      ) {
        return state;
      }

      const newEnemyBoard = JSON.parse(JSON.stringify(state.enemyBoard));
      const updatedEnemyShips = JSON.parse(JSON.stringify(state.enemyShips));

      let isHit = false;
      let hitShipIndex = -1;

      for (let i = 0; i < updatedEnemyShips.length; i++) {
        for (let position of updatedEnemyShips[i].positions) {
          if (position.row === moveRow && position.col === moveCol) {
            isHit = true;
            hitShipIndex = i;
            break;
          }
        }
        if (isHit) break;
      }

      if (isHit) {
        newEnemyBoard[moveRow][moveCol] = { isHit: true, hasShip: true };

        if (!updatedEnemyShips[hitShipIndex].hits) {
          updatedEnemyShips[hitShipIndex].hits = 0;
        }
        updatedEnemyShips[hitShipIndex].hits += 1;

        console.log(
          `Ship ${hitShipIndex} hit: ${updatedEnemyShips[hitShipIndex].hits}/${updatedEnemyShips[hitShipIndex].positions.length}`
        );
      } else {
        newEnemyBoard[moveRow][moveCol] = { isHit: true, hasShip: false };
      }

      const allEnemyShipsSunk = updatedEnemyShips.every(
        (ship) => ship.hits === ship.positions.length
      );

      console.log("All ships sunk?", allEnemyShipsSunk);
      console.log(
        "Ships status:",
        updatedEnemyShips.map(
          (ship, idx) =>
            `Ship ${idx}: ${ship.hits || 0}/${ship.positions.length}`
        )
      );

      const nextTurn = state.gameMode === "easy" ? "player" : "enemy";
      console.log("Next turn calculated as:", nextTurn);

      newState = {
        ...state,
        enemyBoard: newEnemyBoard,
        enemyShips: updatedEnemyShips,
        currentTurn: allEnemyShipsSunk ? "player" : nextTurn,
        gameStatus: allEnemyShipsSunk ? "gameOver" : "playing",
        winner: allEnemyShipsSunk ? "player" : null,
        isTimerRunning: !allEnemyShipsSunk,
      };

      if (allEnemyShipsSunk) {
        clearStorage();
      } else {
        saveStateToStorage(newState);
      }

      return newState;

    case "ENEMY_MOVE":
      console.log("Enemy move triggered");

      if (state.gameStatus !== "playing" || state.currentTurn !== "enemy") {
        console.log(
          "Enemy move aborted: wrong state",
          state.gameStatus,
          state.currentTurn
        );
        return state;
      }

      let randomRow, randomCol;
      const newPlayerBoardMove = JSON.parse(JSON.stringify(state.playerBoard));
      const updatedPlayerShips = JSON.parse(JSON.stringify(state.playerShips));

      do {
        randomRow = Math.floor(Math.random() * 10);
        randomCol = Math.floor(Math.random() * 10);
      } while (newPlayerBoardMove[randomRow][randomCol]?.isHit);

      console.log("Enemy attacks:", randomRow, randomCol);

      let playerIsHit = false;
      let hitPlayerShipIndex = -1;

      for (let i = 0; i < updatedPlayerShips.length; i++) {
        for (let position of updatedPlayerShips[i].positions) {
          if (position.row === randomRow && position.col === randomCol) {
            playerIsHit = true;
            hitPlayerShipIndex = i;
            break;
          }
        }
        if (playerIsHit) break;
      }

      if (playerIsHit) {
        newPlayerBoardMove[randomRow][randomCol] = {
          ...newPlayerBoardMove[randomRow][randomCol],
          isHit: true,
        };

        if (!updatedPlayerShips[hitPlayerShipIndex].hits) {
          updatedPlayerShips[hitPlayerShipIndex].hits = 0;
        }
        updatedPlayerShips[hitPlayerShipIndex].hits += 1;

        console.log(
          `Player ship ${hitPlayerShipIndex} hit: ${updatedPlayerShips[hitPlayerShipIndex].hits}/${updatedPlayerShips[hitPlayerShipIndex].positions.length}`
        );
      } else {
        newPlayerBoardMove[randomRow][randomCol] = {
          ...newPlayerBoardMove[randomRow][randomCol],
          isHit: true,
        };
      }

      const allPlayerShipsSunk = updatedPlayerShips.every(
        (ship) => ship.hits === ship.positions.length
      );

      console.log("All player ships sunk?", allPlayerShipsSunk);
      console.log(
        "Player ships status:",
        updatedPlayerShips.map(
          (ship, idx) =>
            `Ship ${idx}: ${ship.hits || 0}/${ship.positions.length}`
        )
      );

      newState = {
        ...state,
        playerBoard: newPlayerBoardMove,
        playerShips: updatedPlayerShips,
        currentTurn: "player",
        gameStatus: allPlayerShipsSunk ? "gameOver" : "playing",
        winner: allPlayerShipsSunk ? "enemy" : null,
        isTimerRunning: !allPlayerShipsSunk,
      };

      if (allPlayerShipsSunk) {
        clearStorage();
      } else {
        saveStateToStorage(newState);
      }

      return newState;

    case "UPDATE_TIMER":
      newState = {
        ...state,
        gameTime: state.gameTime + 1,
      };

      saveStateToStorage(newState);
      return newState;

    case "RESET_GAME":
      clearStorage();
      return getInitialState();

    default:
      return state;
  }
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    let timer;
    if (state.isTimerRunning) {
      timer = setInterval(() => {
        dispatch({ type: "UPDATE_TIMER" });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.isTimerRunning]);

  useEffect(() => {
    console.log(
      "AI turn effect triggered, currentTurn:",
      state.currentTurn,
      "gameStatus:",
      state.gameStatus
    );

    if (state.currentTurn === "enemy" && state.gameStatus === "playing") {
      console.log("Setting timeout for enemy move");
      const delay = setTimeout(() => {
        dispatch({ type: "ENEMY_MOVE" });
      }, 1000);

      return () => clearTimeout(delay);
    }
  }, [state.currentTurn, state.gameStatus, dispatch]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
