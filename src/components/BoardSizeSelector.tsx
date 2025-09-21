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
    <div className="mb-4 bg-white dark:bg-gray-700 shadow-lg rounded-lg px-6 py-3 font-semibold text-md text-gray-700 dark:text-gray-200 cursor-default select-none transform transition-transform duration-300 hover:scale-105 text-center max-w-[120px]">
      <label htmlFor="board-size" className="block mb-1">
        Board Size:
      </label>
      <select
        id="board-size"
        value={boardSize}
        onChange={handleChange}
        className="w-full border border-gray-400 rounded px-2 py-1 bg-white text-sm dark:bg-gray-600 text-gray-900 dark:text-white cursor-pointer"
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
