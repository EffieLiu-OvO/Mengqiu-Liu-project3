import React from "react";

const Cell = ({ cell, isEnemy, onClick }) => {
  let className = "";
  if (cell) {
    if (cell.isHit) {
      className = cell.hasShip ? "hit" : "miss";
    } else if (!isEnemy && cell.hasShip) {
      className = "ship";
    }
  }

  const getCellContent = () => {
    if (!cell) return "";

    if (cell.isHit) {
      if (cell.hasShip) {
        return "√";
      } else {
        return "X";
      }
    } else if (!isEnemy && cell.hasShip) {
      return "■";
    }

    return "";
  };

  const cellStyle = {
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  return (
    <td
      className={className}
      onClick={onClick}
      style={cellStyle}
      data-content={getCellContent()}
    >
      {getCellContent()}
    </td>
  );
};

export default Cell;
