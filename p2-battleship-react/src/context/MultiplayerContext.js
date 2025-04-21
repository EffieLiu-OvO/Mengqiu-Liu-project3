import React, { createContext, useContext, useReducer, useEffect } from "react";
import { placeShipsRandomly } from "../utils/shipPlacement";

const MultiplayerContext = createContext();

const initialState = {
  gameId: null,
  playerBoard: Array(10)
    .fill()
    .map(() => Array(10).fill(null)),
  opponentBoard: Array(10)
    .fill()
    .map(() => Array(10).fill(null)),
  playerShips: [],
  gameStatus: "waiting",
  currentTurn: null,
  winner: null,
  opponent: null,
  placementPhase: false,
  shipsToPlace: [],
  selectedShip: null,
  shipOrientation: "horizontal",
  gameMessage: "",
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

const multiplayerReducer = (state, action) => {
  switch (action.type) {
    case "SET_GAME_ID":
      return {
        ...state,
        gameId: action.payload.gameId,
      };

    case "SET_OPPONENT":
      return {
        ...state,
        opponent: action.payload.opponent,
      };

    case "INIT_PLAYER_BOARD":
      return {
        ...state,
        playerBoard: action.payload.board,
        playerShips: action.payload.ships,
      };

    case "INIT_GAME_BOARDS":
      return {
        ...state,
        playerBoard: action.payload.playerBoard,
        playerShips: action.payload.playerShips,
        opponentBoard: action.payload.opponentBoard,
      };

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
        gameStatus: "placing",
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
        gameStatus: allShipsPlaced ? "ready" : "placing",
      };

    case "PLAYER_READY":
      return {
        ...state,
        gameStatus: "waiting_opponent",
        gameMessage: "Waiting for opponent...",
      };

    case "SET_TURN":
      return {
        ...state,
        currentTurn: action.payload.currentTurn,
        gameMessage:
          action.payload.currentTurn === "player"
            ? "Your turn"
            : "Opponent's turn",
      };

    case "GAME_STARTED":
      const opponentBoard =
        state.opponentBoard && Array.isArray(state.opponentBoard)
          ? state.opponentBoard
          : Array(10)
              .fill()
              .map(() => Array(10).fill(null));

      const playerBoard =
        state.playerBoard && Array.isArray(state.playerBoard)
          ? state.playerBoard
          : Array(10)
              .fill()
              .map(() => Array(10).fill(null));

      return {
        ...state,
        gameStatus: "playing",
        currentTurn: action.payload.firstTurn,
        opponentBoard: opponentBoard,
        playerBoard: playerBoard,
        playerShips: action.payload.playerShips || state.playerShips,
        gameMessage:
          action.payload.firstTurn === "player"
            ? "Your turn"
            : "Opponent's turn",
      };

    case "PLAYER_MOVE_ATTEMPT":
      const newOpponentBoardAttempt = JSON.parse(
        JSON.stringify(state.opponentBoard)
      );
      if (!newOpponentBoardAttempt[action.payload.row][action.payload.col]) {
        newOpponentBoardAttempt[action.payload.row][action.payload.col] = {
          isHit: true,
          hasShip: false,
        };
      } else {
        newOpponentBoardAttempt[action.payload.row][
          action.payload.col
        ].isHit = true;
      }

      return {
        ...state,
        opponentBoard: newOpponentBoardAttempt,
        gameMessage: "Waiting for opponent confirmation...",
      };

    case "MOVE_RESULT":
      const {
        isPlayerMove,
        moveRow,
        moveCol,
        isHit,
        hitShipId,
        isSunk,
        isGameOver,
        nextTurn,
      } = action.payload;

      let newBoard, message;

      if (isPlayerMove) {
        newBoard = JSON.parse(JSON.stringify(state.opponentBoard));
        if (!newBoard[moveRow][moveCol]) {
          newBoard[moveRow][moveCol] = { isHit: true, hasShip: isHit };
        } else {
          newBoard[moveRow][moveCol].isHit = true;
          newBoard[moveRow][moveCol].hasShip = isHit;
        }

        message = isHit ? "Hit target!" : "Missed!";
        if (isSunk) message = `You sunk opponent's ${hitShipId}!`;
        if (isGameOver) message = "Congratulations, you won!";
      } else {
        newBoard = JSON.parse(JSON.stringify(state.playerBoard));
        if (!newBoard[moveRow][moveCol]) {
          newBoard[moveRow][moveCol] = { isHit: true, hasShip: isHit };
        } else {
          newBoard[moveRow][moveCol].isHit = true;
        }

        message = isHit ? "Opponent hit your ship!" : "Opponent missed!";
        if (isSunk) message = `Opponent sunk your ${hitShipId}!`;
        if (isGameOver) message = "Sorry, you lost!";
      }

      return {
        ...state,
        opponentBoard: isPlayerMove ? newBoard : state.opponentBoard,
        playerBoard: !isPlayerMove ? newBoard : state.playerBoard,
        currentTurn: nextTurn,
        gameStatus: isGameOver ? "gameOver" : "playing",
        winner: isGameOver ? (isPlayerMove ? "player" : "opponent") : null,
        gameMessage: message,
      };

    case "OPPONENT_LEFT":
      return {
        ...state,
        gameStatus: "gameOver",
        winner: "player",
        gameMessage: "Opponent has left the game, you win!",
      };

    case "SET_GAME_MESSAGE":
      return {
        ...state,
        gameMessage: action.payload.message,
      };

    case "RESET_GAME":
      return initialState;

    default:
      return state;
  }
};

export const MultiplayerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState);

  return (
    <MultiplayerContext.Provider value={{ state, dispatch }}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
};
