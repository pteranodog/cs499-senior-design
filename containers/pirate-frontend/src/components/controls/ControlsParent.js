import React, { useState } from "react";
import TopRightControls from "./TopRightControls";
import BottomRightControls from "./BottomRightControls";
import StartScreen from "./StartScreen";

export default function Simulation() {
  const [started, setStarted] = useState(false);

  const handleStart = () => setStarted(true);
  const handleTerminate = () => console.log("Simulation terminated");
  const handlePause = () => console.log("Simulation paused/resumed");
  const handleStep = () => console.log("Single-step executed");
  const handleSpeedChange = (speed) => console.log("Speed set to", speed);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {!started && <StartScreen onStart={handleStart} />}

      {started && <TopRightControls />}
      {started && (
        <BottomRightControls
          onTerminate={handleTerminate}
          onPause={handlePause}
          onStep={handleStep}
          onSpeedChange={handleSpeedChange}
        />
      )}

      {/* Your map component would go here */}
    </div>
  );
}
