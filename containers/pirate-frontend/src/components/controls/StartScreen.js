//import LiveCounts from './LiveCounts';
//import ElapsedTime from './ElapsedTime';

export default function StartScreen ({ runID, runSettings, regions, modifySimState }) {
  const minDuration = 30;
  const maxDuration = 4800;
  // CONFIGURATION STATE
  return (
    <div onClick={(e) => e.stopPropagation()}>
        <div
          className="position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
          style={{ zIndex: 2000, minWidth: '400px' }}
        >
          <h5 className="mb-3">Configure Simulation</h5>


          {/* SIMULATION NAME TEXT BOX */}
          <div className="mb-3">
            <label htmlFor="simName" className="form-label">
              Simulation Name
            </label>
            <input
              id="simName"
              type="text"
              className="form-control"
              value={runSettings.name}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "name",
                "value": e.target.value
              })}
            />
          </div>


          {/* START TIME INPUT (HH:MM) */}
          <div className="mb-3">
            <label className="form-label">Start Time (HH:MM)</label>
            <div className="d-flex gap-2">
              <input
                type="number"
                className="form-control"
                placeholder="HH"
                min="0"
                max="23"
                value={runSettings.startHour}
                onChange={(e) => modifySimState({
                  "type": "modify-run",
                  "index": runID,
                  "setting": "startHour",
                  "value": e.target.value
                })}
              />
              <span className="align-self-center">:</span>
              <input
                type="number"
                className="form-control"
                placeholder="MM"
                min="0"
                max="59"
                value={runSettings.startMinute}
                onChange={(e) => modifySimState({
                  "type": "modify-run",
                  "index": runID,
                  "setting": "startMinute",
                  "value": e.target.value
                })}
              />
            </div>
          </div>


          {/* RUN TIME DURATION INPUT */}
          <div className="mb-3">
            <label htmlFor="duration" className="form-label">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              className="form-control"
              value={runSettings.duration}
              min={minDuration}
              max={maxDuration}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "duration",
                "value": e.target.value
              })}
            />
            {runSettings.duration !== '' && Number(runSettings.duration) < minDuration && (
              <div className="text-danger small">
                Duration must be at least {minDuration} minute{minDuration > 1 ? 's' : ''}
              </div>
            )}
            {runSettings.duration !== '' && Number(runSettings.duration) > maxDuration && (
              <div className="text-danger small">
                Duration cannot exceed {maxDuration} minutes
              </div>
            )}
          </div>


          {/* REGION SELECTION DROPDOWN */}
          <div className="mb-3">
            <label htmlFor="region" className="form-label">
              Region
            </label>
            <select
              id="region"
              className="form-select"
              value={runSettings.regionId}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "regionId",
                "value": e.target.value
              })}
            >
              {Object.entries(regions || {}).map(([regionId, region]) => {return (
                <option key={regionId} value={regionId}>{region.name}</option>
              )})}
            </select>
          </div>


          {/* WEATHER CONDTION SELECTION DROPDOWN */}
          <div className="mb-3">
            <label  htmlFor="weather" className="form-label">
              Weather Condition
            </label>
            <select
              id="weather"
              className="form-select"
              value={runSettings.weatherType}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "weatherType",
                "value": e.target.value
              })}
            >
              <option value="">Select Weather</option>
              <option value="Clear">Clear</option>
              <option value="Storm">Storm</option>
              <option value="Fog">Fog</option>
            </select>
          </div>

          {/* MERCHANT RATE SLIDER */}
          <div className="mb-3">
            <label htmlFor="merchant" className="form-label">
              Merchant Presence: {runSettings.maxMerchants}%
            </label>
            <input
              id="merchant"
              type="range"
              min="0"
              max="100"
              value={runSettings.maxMerchants}
              className="form-range"
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "maxMerchants",
                "value": e.target.value
              })}
            />
          </div>


          {/* PIRATE PRESENCE SLIDER */}
          <div className="mb-3">
            <label htmlFor="pirate" className="form-label">
              Pirate Presence: {runSettings.maxPirates}%
            </label>
            <input
              id="pirate"
              type="range"
              min="0"
              max="100"
              value={runSettings.maxPirates}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "maxPirates",
                "value": e.target.value
              })}
              className="form-range"
            />
          </div>


          {/* SECURITY PRESENCE SLIDER */}
          <div className="mb-3">
            <label htmlFor="security" className="form-label">
              Security Presence: {runSettings.maxPatrols}%
            </label>
            <input
              id="security"
              type="range"
              min="0"
              max="100"
              value={runSettings.maxPatrols}
              onChange={(e) => modifySimState({
                "type": "modify-run",
                "index": runID,
                "setting": "maxPatrols",
                "value": e.target.value
              })}
              className="form-range"
            />
          </div>

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
    </div>
  )
}
