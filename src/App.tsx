import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Scoreboard from "./components/Scoreboard";
import BoardSizeSelector from "./components/BoardSizeSelector";
import ReactConfetti from "react-confetti";
import PreviousGamePopup from "./components/PreviousGamePopup";

interface FinishedGame {
  id: number;
  board: (string | null)[];
  board_size: number; // add this
  current_player: string;
  status: string;
  created_at: string;
}

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
  const [previousGames, setPreviousGames] = useState<FinishedGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<FinishedGame | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedFinishedGameId, setSelectedFinishedGameId] = useState<
    number | null
  >(null);

  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("start");
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [refreshScoreboard, setRefreshScoreboard] = useState(0);
  useEffect(() => {
    async function fetchFinishedGames() {
      const { data, error } = await supabase
        .from("games")
        .select()
        .in("status", ["draw", "Player X won", "Player O won"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading previous games: ", error);
        return;
      }
      setPreviousGames(data || []);
      if (data && data.length > 0) {
        setSelectedFinishedGameId(data[0].id);
        setSelectedGame(data[0]);
      }
    }

    fetchFinishedGames();
  }, [refreshScoreboard]);

  const [xStats, setXStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [oStats, setOStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  useEffect(() => {
    let interval: number | null = null;

    if (timerActive) {
      interval = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [timerActive]);

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
    if (status === "start") {
      setTimerActive(true); // start timer on first move
    }

    if (newStatus !== "in_progress" && newStatus !== "start") {
      setTimerActive(false); // stop timer on game end
    }

    if (newStatus === "Player X won" || newStatus === "Player O won") {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }

    // Statistics update after checking winner
    if (result?.winner === "X") {
      setXStats((stats) => ({ ...stats, wins: stats.wins + 1 }));
      setOStats((stats) => ({ ...stats, losses: stats.losses + 1 }));
    } else if (result?.winner === "O") {
      setOStats((stats) => ({ ...stats, wins: stats.wins + 1 }));
      setXStats((stats) => ({ ...stats, losses: stats.losses + 1 }));
    } else if (result?.winner === "draw") {
      setXStats((stats) => ({ ...stats, draws: stats.draws + 1 }));
      setOStats((stats) => ({ ...stats, draws: stats.draws + 1 }));
    }

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
    setSecondsElapsed(0);
    setTimerActive(false);
    setShowConfetti(false);
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
      <div
        className={`fixed inset-0 -z-10 opacity-70 bg-gradient-to-tr ${
          theme === "dark"
            ? "from-blue-900 via-slate-900 to-indigo-900"
            : "from-slate-200 via-sky-100 to-blue-300"
        }`}
      ></div>

      <div className="fixed top-70 left-27 z-20 p-3">
        <BoardSizeSelector
          boardSize={boardSize}
          setBoardSize={setBoardSize}
          resetGame={resetGame}
        />
      </div>
      {showConfetti && <ReactConfetti />}

      <div className="mb-4 fixed top-110 left-30 bg-white dark:bg-gray-700 shadow-lg rounded-lg px-6 py-3 font-semibold text-lg text-gray-700 dark:text-gray-200 cursor-default select-none transform transition-transform duration-300 hover:scale-105 text-center max-w-[120px]">
        <div>Game Timer</div>
        <div className="text-green-600">
          {Math.floor(secondsElapsed / 60)
            .toString()
            .padStart(2, "0")}
          :{(secondsElapsed % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <div
        className={`min-h-screen w-screen flex items-center justify-center ${
          theme === "dark" ? "bg-transparent" : "bg-transparent"
        }`}
      >
        {/* Main flex container with vertical centering */}
        <div className="flex flex-row items-center justify-center w-full max-w-6xl mx-auto min-h-[600px]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1
              className={`text-5xl font-extrabold mb-14 underline tracking-wide ${
                theme === "dark" ? "text-gray-100" : "text-gray-800"
              } animate-bounce select-none`}
            >
              Tic-Tac-Toe
            </h1>
            <div className="mb-8 flex justify-center space-x-6 text-md">
              <div className="bg-blue-100 text-blue-700 rounded px-3 py-1 font-semibold">
                X — Wins: {xStats.wins} | Losses: {xStats.losses} | Draws:{" "}
                {xStats.draws}
              </div>
              <div className="bg-green-100 text-green-700 rounded px-3 py-1 font-semibold">
                O — Wins: {oStats.wins} | Losses: {oStats.losses} | Draws:{" "}
                {oStats.draws}
              </div>
            </div>

            <div
              className="bg-white rounded-xl shadow-md p-6 max-w-sm w-full flex flex-col items-center transition-shadow duration-500"
              style={{
                boxShadow:
                  currentPlayer === "X"
                    ? "0 0 25px 10px rgba(59, 130, 246, 0.7)" // blue glow for X
                    : currentPlayer === "O"
                    ? "0 0 25px 10px rgba(34, 197, 94, 0.4)" // green glow for O
                    : "0 0 25px 10px rgba(0, 0, 0, 0.15)", // fallback subtle shadow
              }}
            >
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
                className="grid gap-2 w-full"
                style={{
                  gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                }}
              >
                {board.map((cell, idx) => {
                  const isWinningCell = winningLine.includes(idx);
                  return (
                    <button
                      key={idx}
                      className={`w-full aspect-square flex items-center justify-center text-3xl font-bold border-2 rounded-md transition focus:outline-none focus:ring-2 ${
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

          <div className="flex flex-col ml-12 space-y-6 w-[370px] justify-center">
            <div className="mb-10 flex flex-col items-center">
              <div className="z-50 border-blue-400 border-2">
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-black dark:text-white font-semibold"
                >
                  Switch to {theme === "light" ? "Dark" : "Light"} Mode
                </button>
              </div>
            </div>
            <Scoreboard refreshKey={refreshScoreboard} />
            <div
              className={`mb-4 flex flex-col items-center rounded-lg p-4 w-full max-w-[370px] border-4 ${
                theme === "dark" ? "border-white" : "border-gray-700"
              }`}
            >
              <label
                className={`text-xl font-bold mb-2 text-center ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                View Previous Finished Games
              </label>
              <select
                id="finishedGamesDropdown"
                value={selectedFinishedGameId || ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  setSelectedFinishedGameId(selectedId);
                  const game =
                    previousGames.find((g) => g.id === selectedId) || null;
                  setSelectedGame(game);
                  setPopupVisible(true);
                }}
                className="w-35 p-2 rounded border font-bold border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {previousGames.length === 0 && (
                  <option value="" disabled>
                    No finished games found
                  </option>
                )}
                {previousGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    Game #{game.id}
                  </option>
                ))}
              </select>
            </div>

            <PreviousGamePopup
              show={popupVisible}
              onClose={() => setPopupVisible(false)}
              game={selectedGame}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
