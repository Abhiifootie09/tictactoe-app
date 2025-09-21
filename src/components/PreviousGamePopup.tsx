import React from "react";
import ReactDOM from "react-dom";

interface PreviousGamePopupProps {
  show: boolean;
  onClose: () => void;
  game: {
    board: (string | null)[];
    status: string;
    id: number;
  } | null;
}

const PreviousGamePopup: React.FC<PreviousGamePopupProps> = ({
  show,
  onClose,
  game,
}) => {
  if (!show || !game) return null;

  const boardSize = Math.sqrt(game.board.length);

  // Cell size in vw (% of viewport width) to scale with screen size but capped
  const maxPopupWidthVw = 80; // max popup width is 80vw
  const cellSizeVw = Math.min(10, maxPopupWidthVw / boardSize); // Each cell takes min of 10vw or divided popup width

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `${cellSizeVw * boardSize}vw`,
          minWidth: "200px",
        }}
      >
        <h3 className="text-lg font-bold mb-4 truncate text-white text-center">
          Viewing Game #{game.id} - {game.status}
        </h3>

        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gridAutoFlow: "row",
          }}
        >
          {game.board.map((cell, idx) => (
            <button
              key={idx}
              disabled
              className="aspect-square text-2xl font-bold border rounded bg-gray-100 border-gray-400 flex items-center justify-center select-none"
              style={{ fontSize: `${cellSizeVw / 2}vw` }}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 w-1/2"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PreviousGamePopup;
