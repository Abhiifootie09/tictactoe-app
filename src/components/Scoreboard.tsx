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
    <table className="min-w-full divide-y divide-gray-200 text-center shadow-lg rounded-lg justify-self-start">
      <thead className="bg-blue-200">
        <tr>
          <th className="px-4 py-2 font-bold text-gray-700">Game ID</th>
          <th className="px-4 py-2 font-bold text-gray-700">Result</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {scoreBoard.map((score) => (
          <tr key={score.id}>
            <td className="px-4 py-2 font-medium">{score.id}</td>
            <td className="px-4 py-2">{score.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Scoreboard;
