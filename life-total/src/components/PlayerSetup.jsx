import { useState } from "react";
import LifeCounter from "./LifeCounter";

export default function PlayerSetup({ onStart }) {
  const [players, setPlayers] = useState(2);
  const [startingLife, setStartingLife] = useState(40);

  const handleStart = () => {
    onStart(players, startingLife);
  };

  return (
		<div>
			<div className="setup">
				<h2>Setup Game</h2>

				<label>Number of Players:</label>
				<input
					type="number"
					min="2"
					max="6"
					value={players}
					onChange={(e) => setPlayers(Number(e.target.value))}
				/>

				<label>Starting Life:</label>
				<input
					type="number"
					min="1"
					value={startingLife}
					onChange={(e) => setStartingLife(Number(e.target.value))}
				/>

				<button onClick={handleStart}>Start Game</button>
			</div>
			<div className="board">
				{
					Array.from({ length:players}, (_, i) => (
						<LifeCounter
							key={i}
							id={`player_${i}`}
							startingLife = {startingLife}
						/>
					))
				}
			</div>
		</div>
  );
}
