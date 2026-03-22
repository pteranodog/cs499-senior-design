export default function EndScreen({
  // These are all the props that need passing from Controls.js:
  showEndScreen,

  simName,
  region,

  seconds,
  formatTime,

  entries,
  exits,
  captures,
  defeats,
  rescues,
  evasions,

  handleExport,
  handleRestart
}) {
  return (
    <>
      {showEndScreen && (
        <div
          className="position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
          style={{ zIndex: 2000, minWidth: '400px' }}
        >
          <h5 className="mb-3">Simulation Complete</h5>

          <p>
            <strong>Simulation Name:</strong> {simName}
          </p>
          <p>
            <strong>Region:</strong> {region}
          </p>
          <p>
            <strong>Elapsed Time:</strong> {formatTime(seconds)}
          </p>

          <hr />

          <p>
            <strong>Entries:</strong> {entries}
          </p>
          <p>
            <strong>Exits:</strong> {exits}
          </p>
          <p>
            <strong>Captures:</strong> {captures}
          </p>
          <p>
            <strong>Defeats:</strong> {defeats}
          </p>
          <p>
            <strong>Rescues:</strong> {rescues}
          </p>
          <p>
            <strong>Evasions:</strong> {evasions}
          </p>

          <div className="d-grid gap-2">
            <button className="btn btn-success" onClick={() => handleExport('json')}>
              Export as JSON
            </button>
            <button className="btn btn-success" onClick={() => handleExport('csv')}>
              Export as CSV
            </button>
            <button className="btn btn-success" onClick={handleRestart}>
              Restart
            </button>
          </div>
        </div>
      )}
    </>
  )
}