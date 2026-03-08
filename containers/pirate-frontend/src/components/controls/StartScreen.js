import Control from 'react-leaflet-custom-control';
import LiveCounts from './LiveCounts';
import ElapsedTime from './ElapsedTime';

export default function StartScreen ({
  // These are all the props that need passing from Controls.js:
  showStartScreen,
  isRunning,

  simName,
  setSimName,

  startHour,
  setStartHour,

  startMinute,
  setStartMinute,

  duration,
  setDuration,

  region,
  setRegion,

  weather,
  setWeather,

  startCenterPointId,
  setStartCenterPointId,

  merchantRate,
  setMerchantRate,

  pirateRate,
  setPirateRate,

  securityRate,
  setSecurityRate,

  percentValid,
  isSetupValid,
  minDuration,
  maxDuration,

  pointsOfInterest,

  handleStart,

  seconds,
  formatTime,

  entries,
  exits,
  captures,
  defeats,
  rescues,
  evasions}) {

    return (
      <Control prepend position="topright">
        <div onClick={(e) => e.stopPropagation()}>
          {showStartScreen && (
            <div
              className="position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
              style={{ zIndex: 2000, minWidth: '400px' }}
            >
              <h5 className="mb-3">Configure Simulation</h5>

              <div className="mb-3">
                <label className="form-label">Simulation Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Start Time (HH:MM)</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="HH"
                    min="0"
                    max="23"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    disabled={isRunning}
                  />
                  <span className="align-self-center">:</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="MM"
                    min="0"
                    max="59"
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={duration}
                  min={minDuration}
                  max={maxDuration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isRunning}
                />
                {duration !== '' && Number(duration) < minDuration && (
                  <div className="text-danger small">
                    Duration must be at least {minDuration} minute{minDuration > 1 ? 's' : ''}
                  </div>
                )}
                {duration !== '' && Number(duration) > maxDuration && (
                  <div className="text-danger small">
                    Duration cannot exceed {maxDuration} minutes
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Region</label>
                <select
                  className="form-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">Select Region</option>
                  <option value="Gulf of Guinea">Gulf of Guinea</option>
                  <option value="Gulf of Aden/Somalian Coast">Gulf of Aden/Somalian Coast</option>
                  <option value="Malacca Strait">Malacca Strait</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Weather Condition</label>
                <select
                  className="form-select"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">Select Weather</option>
                  <option value="Clear">Clear</option>
                  <option value="Storm">Storm</option>
                  <option value="Fog">Fog</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Center map on Start (optional)</label>
                <select
                  className="form-select"
                  value={startCenterPointId}
                  onChange={(e) => setStartCenterPointId(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">Keep current center</option>
                  {pointsOfInterest.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name || point.id}
                    </option>
                  ))}
                </select>
              </div>

              {!percentValid && (
                <div className="text-danger small mb-2">
                  Total of Merchant, Pirate, and Security percentages cannot exceed 100%
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Merchant Presence: {merchantRate}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={merchantRate}
                  className="form-range"
                  onChange={(e) => setMerchantRate(Number(e.target.value))}
                  disabled={isRunning}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Pirate Presence: {pirateRate}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pirateRate}
                  className="form-range"
                  onChange={(e) => setPirateRate(Number(e.target.value))}
                  disabled={isRunning}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Security Presence: {securityRate}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={securityRate}
                  className="form-range"
                  onChange={(e) => setSecurityRate(Number(e.target.value))}
                  disabled={isRunning}
                />
              </div>

              <div className="d-grid mt-4">
                <button className="btn btn-success" onClick={handleStart} disabled={!isSetupValid}>
                  Start Simulation
                </button>
              </div>
            </div>
          )}

          {/*<ElapsedTime 
          seconds={seconds}
          formatTime = {formatTime}
          >

          </ElapsedTime>

          <LiveCounts 
          entries={entries}
          exits={exits}
          captures={captures}
          defeats={defeats}
          rescues={rescues}
          evasions={evasions}
          >
          </LiveCounts>*/}

        </div>
      </Control>
    )
}