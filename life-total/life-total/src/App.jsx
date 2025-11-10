import { useState } from "react";

function App() {
  const [life, setLife] = useState(20);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Life Total: {life}</h1>
      <button onClick={() => setLife(life + 1)}>+1</button>
      <button onClick={() => setLife(life - 1)}>-1</button>
      <button onClick={() => setLife(20)}>Reset</button>
    </div>
  );
}

export default App;
