import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Scoreboard from "./components/Scoreboard";
import BoardSizeSelector from "./components/BoardSizeSelector";

// Generate all winning lines dynamically for n x n board
function generateWinningLines(n: number): number[][] {
  const lines: number[][] = [];

  // Check for all Rows
  for (let r = 0; r < n; r++) {
    const rowLine = [];
    for (let c = 0; c < n; c++) {
      rowLine.push(r * n + c);
    }
    lines.push(rowLine);
  }

  // Check for all Columns
  for (let c = 0; c < n; c++) {
    const colLine = [];
    for (let r = 0; r < n; r++) {
      colLine.push(r * n + c);
    }
    lines.push(colLine);
  }

  //Check for the Main diagonal
  const mainDiag = [];
  for (let i = 0; i < n; i++) {
    mainDiag.push(i * (n + 1));
  }
  lines.push(mainDiag);

  // Check for the Anti diagonal
  const antiDiag = [];
  for (let i = 1; i <= n; i++) {
    antiDiag.push(i * (n - 1));
  }
  lines.push(antiDiag);

  return lines;
}

function checkWinnerByLines(
  board: (string | null)[],
  winningLines: number[][]
) {
  for (const line of winningLines) {
    const first = board[line[0]];
    if (!first) continue;

    if (line.every((idx) => board[idx] === first)) {
      return { winner: first, winningLine: line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", winningLine: [] };
  }
  return null;
}

function createInitialBoard(size: number) {
  return Array(size * size).fill(null);
}

function App() {
  const [boardSize, setBoardSize] = useState(3);
  const [board, setBoard] = useState<(string | null)[]>(
    createInitialBoard(boardSize)
  );
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("start");
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [refreshScoreboard, setRefreshScoreboard] = useState(0);
  const [history, setHistory] = useState<
    {
      board: (string | null)[];
      currentPlayer: string;
      status: string;
      winningLine: number[];
    }[]
  >([]);
  const [theme, setTheme] = useState("light");
  const [winningLines, setWinningLines] = useState<number[][]>(
    generateWinningLines(boardSize)
  );

  // When board size changes, reset board and winning lines appropriately
  useEffect(() => {
    setBoard(createInitialBoard(boardSize));
    setWinningLines(generateWinningLines(boardSize));
    setHistory([
      {
        board: createInitialBoard(boardSize),
        currentPlayer: "X",
        status: "start",
        winningLine: [],
      },
    ]);
    setStatus("start");
    setCurrentPlayer("X");
    setWinningLine([]);
  }, [boardSize]);

  // Save game to Supabase DB on every user move
  async function saveGame(
    boardState: (string | null)[],
    player: string,
    gameStatus: string
  ) {
    const { data, error } = await supabase
      .from("games")
      .insert([
        { board: boardState, current_player: player, status: gameStatus },
      ]);
    if (error) console.error(error);
  }

  function handleClick(index: number) {
    if (board[index] || (status !== "in_progress" && status !== "start"))
      return;

    const newBoard = board.slice(); // shallow copy for seamless rendering
    newBoard[index] = currentPlayer;

    const result = checkWinnerByLines(newBoard, winningLines);

    let newStatus;
    if (status === "start") {
      newStatus = "in_progress";
    } else {
      newStatus = result?.winner
        ? result.winner === "draw"
          ? "draw"
          : `Player ${result.winner} won`
        : "in_progress";
    }

    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    setWinningLine(result?.winningLine || []);
    setStatus(newStatus);

    saveGame(newBoard, currentPlayer, newStatus).then(() =>
      setRefreshScoreboard((prev) => prev + 1)
    );

    setHistory((prev) => [
      ...prev,
      {
        board: newBoard,
        currentPlayer: currentPlayer === "X" ? "O" : "X",
        status: newStatus,
        winningLine: result?.winningLine || [],
      },
    ]);
  }

  function resetGame() {
    const newInitialBoard = createInitialBoard(boardSize);
    setBoard(newInitialBoard);
    setCurrentPlayer("X");
    setStatus("start");
    setWinningLine([]);
    setHistory([
      {
        board: newInitialBoard,
        currentPlayer: "X",
        status: "start",
        winningLine: [],
      },
    ]);
  }

  function undoMove() {
    if (history.length > 1) {
      const prev = history[history.length - 2];
      setBoard(prev.board);
      setCurrentPlayer(prev.currentPlayer);
      setStatus(prev.status);
      setWinningLine(prev.winningLine);
      setHistory(history.slice(0, history.length - 1));
    }
  }

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }

  return (
    <>
      <div className="fixed top-80 left-30 z-20 bg-gray-200 p-3 rounded shadow border-blue-400 border-2">
        <BoardSizeSelector
          boardSize={boardSize}
          setBoardSize={setBoardSize}
          resetGame={resetGame}
        />
      </div>
      <div
        className={`min-h-screen w-screen flex items-center justify-center ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <div className="fixed top-10 left-20 z-50  border-blue-400 border-2">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white font-semibold"
          >
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>
        <div className="flex flex-row items-start justify-center w-full max-w-6xl mx-auto">
          <div className="flex flex-row items-start justify-center w-full max-w-6xl mx-auto">
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1
                className={`text-4xl font-bold mb-10 ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                TicTacToe Game
              </h1>

              <div className="bg-white rounded-xl shadow-md p-8 max-w-lg w-full flex flex-col items-center">
                <div className="w-full mb-5 text-center">
                  <h2 className="text-xl font-semibold">
                    {status === "start"
                      ? "Click to start"
                      : status === "in_progress"
                      ? "Game in Progress"
                      : "Game Ended"}
                  </h2>
                </div>

                <div
                  className="grid gap-3 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                  }}
                >
                  {board.map((cell, idx) => {
                    const isWinningCell = winningLine.includes(idx);
                    return (
                      <button
                        key={idx}
                        className={`w-full aspect-square flex items-center justify-center text-4xl font-bold border-2 rounded-md transition focus:outline-none focus:ring-2 ${
                          isWinningCell
                            ? "bg-green-200 border-green-500 focus:ring-green-600 hover:bg-green-300"
                            : "bg-gray-100 border-blue-400 focus:ring-blue-600 hover:bg-blue-100"
                        }`}
                        onClick={() => handleClick(idx)}
                      >
                        {cell}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col items-center justify-center mt-6 space-y-4">
                  {history.length > 1 && (
                    <button
                      onClick={undoMove}
                      className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700 transition font-semibold shadow focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      Undo
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Start New Game
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-none w-[370px] ml-12">
              <h2
                className={`text-2xl font-bold mb-6 text-center ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                Last 10 results
              </h2>
              <Scoreboard refreshKey={refreshScoreboard} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
