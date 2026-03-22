export default function StepRateControls(
  // These are all the props that need passing from Controls.js:
  {isRunning,
  setIsRunning,
  speed,
  showStartScreen,
  showEndScreen,
  handleStep,
  handleSpeed,
  handleTerminate}) {
  return (
      <div onClick={(e) => e.stopPropagation()} className="d-flex gap-2">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsRunning((prev) => !prev)}
          disabled={showStartScreen || showEndScreen}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={handleStep}
          disabled={isRunning || showStartScreen || showEndScreen}
        >
          Step
        </button>

        <button
          className="btn btn-warning btn-sm"
          onClick={handleSpeed}
          disabled={showStartScreen || showEndScreen}
        >
          Speed ({speed}x)
        </button>

        <button
          className="btn btn-danger btn-sm"
          onClick={handleTerminate}
          disabled={showStartScreen || showEndScreen}
        >
          Terminate
        </button>
      </div>
  )
}