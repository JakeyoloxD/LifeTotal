import { useState } from "react";

export default function LifeCounter({ id, startingLife }) {
  const [life, setLife] = useState(startingLife);

  return (
    <div className="player">
      <h3>Player {id}</h3>
      <h1>{life}</h1>
      <div className="controls">
        <button onClick={() => setLife(life + 1)}>+</button>
        <button onClick={() => setLife(life - 1)}>-</button>
        <button onClick={() => setLife(startingLife)}>Reset</button>
      </div>
    </div>
  );
}
