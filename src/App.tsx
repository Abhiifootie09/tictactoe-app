import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Scoreboard from "./components/Scoreboard";

interface Game {
  id: number;
  board: (string | null)[];
  current_player: string;
  status: string;
}

const initialBoard = Array(9).fill(null);

function checkWinner(board: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], winningLine: [a, b, c] };
    }
  }
  if (board.every((cell) => cell !== null))
    return { winner: "draw", winningLine: [] };
  return null;
}

function App() {
  const [board, setBoard] = useState<(string | null)[]>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [status, setStatus] = useState("start");
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [refreshScoreboard, setRefreshScoreboard] = useState(0);

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

    const newBoard = board.slice(); //slicing used to create a shallow copy for seamless rendering
    newBoard[index] = currentPlayer;
    const result = checkWinner(newBoard);

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
  }

  function resetGame() {
    setBoard(initialBoard);
    setCurrentPlayer("X");
    setStatus("start");
    setWinningLine([]);
  }

  return (
    <div className="min-h-screen w-screen bg-gray-100 flex items-center justify-center">
      <div className="flex flex-row items-start justify-center w-full max-w-6xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-10 text-gray-800">
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

            <div className="grid grid-cols-3 gap-3 w-full">
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
              {status !== "in_progress" && (
                <button
                  onClick={resetGame}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Start New Game
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-none w-[370px] ml-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Last 10 results
          </h2>
          <Scoreboard refreshKey={refreshScoreboard} />
        </div>
      </div>
    </div>
  );
}

export default App;
