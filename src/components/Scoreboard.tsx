import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface Score {
  id: number;
  status: string;
}

interface ScoreboardProps {
  refreshKey: number;
}

function Scoreboard({ refreshKey }: ScoreboardProps) {
  const [scoreBoard, setScoreBoard] = useState<Score[]>([]);

  useEffect(() => {
    async function getScoreboard() {
      const { data, error } = await supabase.rpc("get_recent_games");
      if (error) {
        console.error(error);
      } else if (data) {
        setScoreBoard(data);
      }
    }
    getScoreboard();
  }, [refreshKey]);

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden w-full max-w-sm mx-auto">
      <h2 className="bg-gradient-to-r text-center from-blue-400 to-blue-600 text-white text-base font-semibold px-4 py-2">
        Last 10 Results
      </h2>
      <table className="w-full text-center border-collapse text-sm">
        <thead className="bg-blue-100">
          <tr>
            <th className="px-4 py-2 text-gray-700 font-semibold uppercase tracking-wide">
              #
            </th>
            <th className="px-4 py-2 text-gray-700 font-semibold uppercase tracking-wide">
              Result
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {scoreBoard.map((score, index) => (
            <tr
              key={score.id}
              className="hover:bg-blue-50 transition-colors duration-200"
            >
              <td className="px-4 py-2 font-medium text-gray-800">
                {index + 1}
              </td>
              <td className="px-4 py-2 text-gray-600">{score.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Scoreboard;
