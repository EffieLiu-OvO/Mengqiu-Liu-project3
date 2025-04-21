const shipTypes = [
  { size: 5, count: 1 },
  { size: 4, count: 1 },
  { size: 3, count: 2 },
  { size: 2, count: 1 },
];

const canPlaceShip = (board, row, col, size, horizontal) => {
  if (horizontal) {
    if (col + size > 10) return false;
  } else {
    if (row + size > 10) return false;
  }

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = 0; k < size; k++) {
        const checkRow = horizontal ? row + i : row + k + i;
        const checkCol = horizontal ? col + k + j : col + j;

        if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
          if (board[checkRow][checkCol]?.hasShip) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

const placeShip = (board, row, col, size, horizontal) => {
  const positions = [];

  for (let i = 0; i < size; i++) {
    const shipRow = horizontal ? row : row + i;
    const shipCol = horizontal ? col + i : col;

    board[shipRow][shipCol] = { hasShip: true, isHit: false };
    positions.push({ row: shipRow, col: shipCol });
  }

  return {
    positions,
    size,
    horizontal,
  };
};

export const placeShipsRandomly = () => {
  const board = Array(10)
    .fill()
    .map(() => Array(10).fill(null));
  const ships = [];

  for (const shipType of shipTypes) {
    for (let i = 0; i < shipType.count; i++) {
      let placed = false;

      while (!placed) {
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const horizontal = Math.random() > 0.5;

        if (canPlaceShip(board, row, col, shipType.size, horizontal)) {
          const ship = placeShip(board, row, col, shipType.size, horizontal);
          ships.push(ship);
          placed = true;
        }
      }
    }
  }

  return { board, ships };
};
