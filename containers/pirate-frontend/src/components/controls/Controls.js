import {useState, useEffect} from 'react';
import Control from 'react-leaflet-custom-control';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';

function Controls()
function Controls({ pointsOfInterest = [], onStartCenterPointChange } = {}) 
{
  // STATES
  const [seconds, setSeconds] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);

  // CONFIGURATION STATE
  const [simName, setSimName] = useState('');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState('');
  const [merchantRate, setMerchantRate] = useState(50);
  const [pirateRate, setPirateRate] = useState(50);
  const [securityRate, setSecurityRate] = useState(0);
  const [weather, setWeather] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startCenterPointId, setStartCenterPointId] = useState('');

   // SKELETON: this stores a chosen POI id from the Start modal.
  // Later can persist this in the global sim config instead of the local component state.
  const [startCenterPointId, setStartCenterPointId] = useState("");
  
  // LIVE METRICS COUNTING (DROPDOWN)
  const [entries, setEntries] = useState(0);
  const [exits, setExits] = useState(0);
  const [captures, setCaptures] = useState(0);
  const [defeats, setDefeats] = useState(0);
  const [rescues, setRescues] = useState(0);
  const [evasions, setEvasions] = useState(0);

  const minDuration = 1;
  const maxDuration = 180;
  const totalPercentage = merchantRate + pirateRate + securityRate;
  const percentValid = totalPercentage <= 100;

  const durationValid =
    duration !== '' &&
    Number(duration) >= minDuration &&
    Number(duration) <= maxDuration;

  const startTimeValid =
    startHour !== '' &&
    startMinute !== '' &&
    Number(startHour) >= 0 &&
    Number(startHour) <= 23 &&
    Number(startMinute) >= 0 &&
    Number(startMinute) <= 59;

  const isSetupValid =
    simName.trim() !== '' &&
    region !== '' &&
    durationValid &&
    startTimeValid &&
    weather !== '' &&
    percentValid;

  const resetMetrics = () => {
    setEntries(0);
    setExits(0);
    setCaptures(0);
    setDefeats(0);
    setRescues(0);
    setEvasions(0);
  };

  const applyMetricTick = () => {
    setEntries((prev) => prev + Math.floor(Math.random() * 2));
    setExits((prev) => prev + Math.floor(Math.random() * 2));
    setCaptures((prev) => prev + Math.floor(Math.random() * 2));
    setDefeats((prev) => prev + Math.floor(Math.random() * 2));
    setRescues((prev) => prev + Math.floor(Math.random() * 2));
    setEvasions((prev) => prev + Math.floor(Math.random() * 2));
  };

  const resolveStartCenterPoint = () => {
    if (!startCenterPointId) {
      return null;
    }

    return pointsOfInterest.find((point) => point.id === startCenterPointId) || null;
  };

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const durationInSeconds = Number(duration) * 60;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (durationInSeconds > 0 && next >= durationInSeconds) {
          setIsRunning(false);
          setShowEndScreen(true);
          return durationInSeconds;
        }
        return next;
      });

      applyMetricTick();
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isRunning, duration, speed]);

  useEffect(() => {
    if (!isRunning && !showEndScreen) {
      return undefined;
    }

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning, showEndScreen]);

  useEffect(() => {
    if (startHour === '' || startMinute === '') {
      return;
    }

    const totalSimulatedMinutes =
      Number(startHour) * 60 + Number(startMinute) + Math.floor(seconds / 60);
    const simulatedHour = Math.floor(totalSimulatedMinutes / 60) % 24;
    const night = simulatedHour < 6 || simulatedHour >= 18;
    setTimeOfDay(night ? 'Night' : 'Day');
  }, [seconds, startHour, startMinute]);

  const formatTime = (value) => {
    const hrs = String(Math.floor(value / 3600)).padStart(2, '0');
    const mins = String(Math.floor((value % 3600) / 60)).padStart(2, '0');
    const secs = String(value % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const getSimulatedClock = () => {
    if (startHour === '' || startMinute === '') {
      return '00:00';
    }

    const totalSimulatedMinutes =
      Number(startHour) * 60 + Number(startMinute) + Math.floor(seconds / 60);
    const hour = Math.floor(totalSimulatedMinutes / 60) % 24;
    const minute = totalSimulatedMinutes % 60;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };
  
  // SKELETON: resolves selected POI id into the full point object.
  // This keeps the UI simple and lets PirateMap own actual map movement behavior.
  const resolveStartCenterPoint = () => {
    if (!startCenterPointId) {
      return null;
    }

    return pointsOfInterest.find((point) => point.id === startCenterPointId) || null;
  };

  const handleStart = () => {
    if (!isSetupValid) {
      return;
    }

     // SKELETON CONTRACT:
    // - null => keep existing center
    // - point object => center map on selected POI
    // TODO: replace with a single start-config payload when simulation config is centralized.
    if (typeof onStartCenterPointChange === 'function') {
      onStartCenterPointChange(resolveStartCenterPoint());

    // SET INITIAL TIME OF DAY IMMEDIATELY
    const initialHour = Number(startHour);
    setTimeOfDay(initialHour >= 6 && initialHour < 18 ? "Day" : "Night");

    if (typeof onSimulationStart === 'function') {
      onSimulationStart({
        simulationName: simName.trim(),
        region,
        weather,
        durationMinutes: Number(duration),
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        populationDistribution: {
          merchant: merchantRate,
          pirate: pirateRate,
          security: securityRate,
        },
        startCenterPoint: selectedPoint,
      });
    }

    const initialHour = Number(startHour);
    setTimeOfDay(initialHour >= 6 && initialHour < 18 ? 'Day' : 'Night');
    resetMetrics();
    setSeconds(0);
    setShowEndScreen(false);
    setShowStartScreen(false);
    setIsRunning(true);
  };

  const handleTerminate = () => {
    const confirmed = window.confirm(
      'Are you sure you want to terminate this run?\nBy terminating, this simulation will end and your summary outcome will be presented.',
    );
    if (!confirmed) {
      return;
    }

    setIsRunning(false);
    setShowEndScreen(true);
  };

  const handleRestart = () => {
    const confirmed = window.confirm(
      'Are you sure you wish to restart? You will be unable to save the current simulation after.',
    );
    if (!confirmed) {
      return;
    }

    setIsRunning(false);
    setShowEndScreen(false);
    setShowStartScreen(true);
    setSeconds(0);
    resetMetrics();
  };

  const handleStep = () => {
    if (isRunning || showStartScreen || showEndScreen) {
      return;
    }

    const durationInSeconds = Number(duration) * 60;
    setSeconds((prev) => {
      const next = prev + 1;
      if (durationInSeconds > 0 && next >= durationInSeconds) {
        setShowEndScreen(true);
        return durationInSeconds;
      }
      return next;
    });

    applyMetricTick();
  };

  const handleSpeed = () => {
    setSpeed((prev) => {
      if (prev === 1) {
        return 2;
      }
      if (prev === 2) {
        return 4;
      }
      return 1;
    });
  };

  const handleExport = (format = 'json') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runData = {
      simulationName: simName,
      region,
      weather,
      durationMinutes: Number(duration),
      elapsedTime: formatTime(seconds),
      outcomes: { entries, exits, captures, defeats, rescues, evasions },
    };

    let fileContent = '';
    let fileType = '';
    let fileExtension = '';

    if (format === 'json') {
      fileContent = JSON.stringify(runData, null, 2);
      fileType = 'application/json';
      fileExtension = 'json';
    } else if (format === 'csv') {
      fileContent = `Simulation Name,${simName}
Region,${region}
Weather,${weather}
Duration (minutes),${duration}
Elapsed Time,${formatTime(seconds)}
Entries,${entries}
Exits,${exits}
Captures,${captures}
Defeats,${defeats}
Rescues,${rescues}
Evasions,${evasions}`;
      fileType = 'text/csv';
      fileExtension = 'csv';
    }

    const blob = new Blob([fileContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${simName || 'simulation'}-${timestamp}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

    fileType = "text/csv";
    fileExtension = "csv";
  }

  const blob = new Blob([fileContent], { type: fileType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${simName || "simulation"}-${timestamp}.${fileExtension}`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

return (
  <>
    {/* START SCREEN (CENTERED) AND LIVE METRIC TRACKING DROPDOWN (TOP RIGHT) */}
    <Control prepend position="topright">
      <div onClick={(e) => e.stopPropagation()}>

        {/* START SCREEN IN CENTER */}
        {showStartScreen && (
          <div
            className="position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
            style={{ zIndex: 2000, minWidth: "400px" }}
          >
            <h5 className="mb-3">Configure Simulation</h5>

            {/* CONFIG INFO GOES HERE */}
            {/* SET SIM NAME */}
            <div className = "mb-3">
              <label className = "form-label"> Simulation Name </label>
              <input
                type = "text"
                className = "form-control"
                value = {simName}
                onChange = {(e) => setSimName(e.target.value)}
                disabled = {isRunning}
              />
            </div>

            {/* SET TIME WINDOW */}
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

            {/* SET DURATION */}
            <div className = "mb-3">
              <label className = "form-label"> Duration (minutes) </label>
              <input
                type = "number"
                className = "form-control"
                value = {duration}
                min = {minDuration}
                max = {maxDuration}
                onChange = {(e) => setDuration(e.target.value)}
                disabled = {isRunning}
              />
              {duration !== "" && Number(duration) < minDuration && (
                <div className="text-danger small">
                  Duration must be at least {minDuration} minute{minDuration > 1 ? "s" : ""}
                </div>
              )}
              {duration !== "" && Number(duration) > maxDuration && (
                <div className="text-danger small">
                  Duration cannot exceed {maxDuration} minutes
                </div>
              )}              
            </div>

            {/* SET REGION */}
            <div className = "mb-3">
              <label className = "form-label"> Region </label>
              <select
                className = "form-select"
                value = {region}
                onChange = {(e) => setRegion(e.target.value)}
                disabled = {isRunning}
              >
                <option value = ""> Select Region </option>
                <option value = "Gulf of Guinea"> Gulf of Guinea </option>
                <option value = "Gulf of Aden/Somalian Coast"> Gulf of Aden/Somalian Coast </option>
                <option value = "Malacca Strait"> Malacca Strait </option>
              </select>
            </div>

            {/* SET WEATHER CONDITIONS */}
            <div className = "mb-3">
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

              {/* SKELETON UI: choose optional map center point for start */}
            <div className = "mb-3">
              <label className = "form-label">Center map on Start (optional)</label>
              <select
                className = "form-select"
                value = {startCenterPointId}
                onChange = {(e) => setStartCenterPointId(e.target.value)}
                disabled = {isRunning}
              >
                <option value="">Keep current center</option>
                {pointsOfInterest.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name || point.id}
                  </option>
                ))}
              </select>
            </div>

            {/* INLINE WARNING FOR SLIDER PERCENTAGES SUM*/}
            {merchantRate + pirateRate + securityRate > 100 && (
              <div className = "text-danger small">
                Total of Merchant, Pirate, and Security percentages cannot exceed 100%
              </div>
            )}

            {/* SET MERCHANT PRESENCE PERCENTAGE */}
            <div className = "mb-3">
              <label className = "form-label"> Merchant Presence: {merchantRate}% </label>
              <input
                type = "range"
                min = "0"
                max = "100"
                value = {merchantRate}
                className = "form-range"
                onChange = {(e) => setMerchantRate(Number(e.target.value))}
                disabled = {isRunning}
              />
            </div>

            {/* SET PIRATE PRESENCE PERCENTAGE */}
            <div className = "mb-3">
              <label className = "form-label"> Pirate Presence: {pirateRate}% </label>
              <input
                type = "range"
                min = "0"
                max = "100"
                value = {pirateRate}
                className = "form-range"
                onChange = {(e) => setPirateRate(Number(e.target.value))}
                disabled = {isRunning}
              />
            </div>

            {/* SET SECURITY PRESENCE PERCENTAGE */}
            <div className = "mb-3">
              <label className = "form-label"> Security Presence: {securityRate}% </label>
              <input
                type = "range"
                min = "0"
                max = "100"
                value = {securityRate}
                className = "form-range"
                onChange = {(e) => setSecurityRate(Number(e.target.value))}
                disabled = {isRunning}
              />
            </div>

            {/* START BUTTON */}
            <div className="d-grid mt-4">
              <button 
                className = "btn btn-success" 
                onClick={handleStart}
                disabled = {!isSetupValid}
              >
                Start Simulation
              </button>
            </div>
          </div>
        )}

        {/* SHOW ELAPSED TIME */}
        <Card bg="light" text="dark" className="mb-2 p-2 small">
          <div><strong>Time Elapsed:</strong> {formatTime(seconds)}</div>
        </Card>

        {/* DROPDOWN */}
        <div>
          <Dropdown>
            <Dropdown.Toggle variant="light" size="sm">
              View Live Counts
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item disabled>Entries: {entries}</Dropdown.Item>
              <Dropdown.Item disabled>Exits: {exits}</Dropdown.Item>
              <Dropdown.Item disabled>Captures: {captures}</Dropdown.Item>
              <Dropdown.Item disabled>Defeats: {defeats}</Dropdown.Item>
              <Dropdown.Item disabled>Rescues: {rescues}</Dropdown.Item>
              <Dropdown.Item disabled>Evasions: {evasions}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </Control>

    {/* ALWAYS VISIBLE STATUS DISPLAY (TOP RIGHT) */}
    <Control prepend position = "topleft">
      <div onClick={(e) => e.stopPropagation()}>
        <Row className="mb-2">
          <Col md="auto">
            <Card
              bg={timeOfDay === "Night" ? "dark" : "light"}
              text={timeOfDay === "Night" ? "light" : "dark"}
              className="rounded shadow"
              style={{ minWidth: "100px" }}
            >
              <Card.Body className="p-2 small">
                <div><strong>Sim Name:</strong>{simName}</div>
                <div><strong>Start Time:</strong> {getSimulatedClock()}</div>
                <div><strong>Mode:</strong> {timeOfDay}</div>
                <div><strong>Duration: </strong>{duration} minutes</div>
                <div><strong>Region:</strong> {region}</div>
                <div><strong>Weather:</strong> {weather}</div>
                <div><strong>Merchant Presence:</strong> {merchantRate}%</div>
                <div><strong>Pirate Presence:</strong> {pirateRate}%</div>
                <div><strong>Security Presence:</strong> {securityRate}%</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Control>

    {/* BOTTOM RIGHT CONTROLS */}
    <Control prepend position="bottomright">
      <div onClick={(e) => e.stopPropagation()} className="d-flex gap-2">
       
        {/* PAUSE/RESUME TOGGLE BUTTON */}
        <button 
          className="btn btn-primary btn-sm"
          onClick = {() => setIsRunning(prev => !prev)}
          disabled = {showStartScreen}
          >
            {showStartScreen ? "Pause" : isRunning ? "Pause" : "Resume"}
        </button>

        {/* STEP BUTTON (ONE STEP PER CLICK) */}
        <button 
          className="btn btn-primary btn-sm"
          onClick = {handleStep}
          disabled = {isRunning || showStartScreen}
        >
          Step
        </button>

        {/* SPEED ADJUSTMENT BUTTON */}
        <button 
          className="btn btn-warning btn-sm"
          onClick={handleSpeed}
          disabled = {showStartScreen}
        >
          Speed ({speed}x)
        </button>
        
        {/* TERMINATE BUTTON */}
        <button 
          className="btn btn-danger btn-sm" 
          onClick = {handleTerminate}
          disabled = {showStartScreen}
        >
          Terminate
        </button>
      </div>
    </Control>

    {/* LEGEND */}
    <Control prepend position = "bottomleft">
      <div
        className="bg-light text-dark p-3 rounded shadow"
        style={{ minWidth: "160px"}}
      >
      </StartScreen>

      <ConfigDisplay 
      simName={simName}
      region={region}
      weather={weather}
      duration={duration}

      merchantRate={merchantRate}
      pirateRate={pirateRate}
      securityRate={securityRate}

      timeOfDay={timeOfDay}
      getSimulatedClock={getSimulatedClock}
      >
      </ConfigDisplay>

      <StepRateControls 
      isRunning={isRunning}
      setIsRunning={setIsRunning}
      speed={speed}
      showStartScreen={showStartScreen}
      showEndScreen={showEndScreen}
      handleStep={handleStep}
      handleSpeed={handleSpeed}
      handleTerminate={handleTerminate}
      >
      </StepRateControls>

      <Legend/>

      <EndScreen 
      showEndScreen={showEndScreen}
      simName={simName}
      region={region}
      seconds={seconds}
      formatTime={formatTime}
      entries={entries}
      exits={exits}

      captures={captures}
      defeats={defeats}
      rescues={rescues}
      evasions={evasions}
      handleExport={handleExport}
      handleRestart={handleRestart}
      >
      </EndScreen>

      <ElapsedTime
        seconds={seconds}
        formatTime={formatTime}
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
      </LiveCounts>
    </>
  );
}

export default Controls;