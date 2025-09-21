interface BoardSizeSelectorProps {
  boardSize: number;
  setBoardSize: (size: number) => void;
  resetGame: () => void;
}

function BoardSizeSelector({
  boardSize,
  setBoardSize,
  resetGame,
}: BoardSizeSelectorProps) {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setBoardSize(Number(event.target.value));
    resetGame();
  }

  return (
    <div className="mb-6">
      <label htmlFor="board-size" className="block font-semibold mb-1">
        Board Size:
      </label>
      <select
        id="board-size"
        value={boardSize}
        onChange={handleChange}
        className="border border-black rounded px-2 py-1"
      >
        {[3, 4, 5, 6].map((size) => (
          <option key={size} value={size}>
            {size} x {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export default BoardSizeSelector;
