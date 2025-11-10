// src/App.js
import { useState } from "react";
import PlayerSetup from "./components/PlayerSetup";
import LifeCounter from "./components/LifeCounter";
import "./App.css";

export default function App() {
  const [game, setGame] = useState(null);

  const startGame = (numPlayers, startingLife) => {
    const playerArray = Array.from({ length: numPlayers }, (_, i) => ({
      id: i + 1,
      startingLife,
    }));
    setGame(playerArray);
  };

  const resetGame = () => setGame(null);

  if (!game) return <PlayerSetup onStart={startGame} />;

  return (
    <div className="board">
      <div className="header">
        <h1>Life Total Tracker</h1>
        <button onClick={resetGame}>New Game</button>
      </div>

      <div
        className="players"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${game.length}, 1fr)`,
          gap: "10px",
        }}
      >
        {game.map((player) => (
          <LifeCounter
            key={player.id}
            id={player.id}
            startingLife={player.startingLife}
          />
        ))}
      </div>
    </div>
  );
}
