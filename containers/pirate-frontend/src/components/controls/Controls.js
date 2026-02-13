import {useState, useEffect} from 'react';
import Control from 'react-leaflet-custom-control';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';

function Controls() 
{
  const [seconds, setSeconds] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const [weather, setWeather] = useState("Clear");
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // CONFIGURATION STATE FIELDS
  const [simName, setSimName] = useState("");
  const [region, setRegion] = useState("");
  const [duration, setDuration] = useState("");
  const [merchantRate, setMerchantRate] = useState(50);
  const [pirateRate, setPirateRate] = useState(50);
  const [securityRate, setSecurityRate] = useState(50);
  const [operationalCondition, setOperationalCondition] = useState("");

  const totalPercentage = merchantRate + pirateRate + securityRate;
  const percentValid = totalPercentage <= 100;
  const minDuration = 1;
  const maxDuration = 180;
  
  const durationValid = 
    duration !== "" &&
    Number(duration) >= minDuration &&
    Number(duration) <= maxDuration;

  const isSetupValid = 
    simName.trim() !== "" &&
    region !== "" &&
    durationValid &&
    operationalCondition !== "" &&
    percentValid;


  useEffect ( () => 
  {
    if (!isRunning) return;

    const durationInSeconds = Number(duration) * 60;

    const interval = setInterval ( () => {
      setSeconds((prev) => {
        const newSeconds = prev + 1;

        //AUTO TERMINATE WHEN DURATION IS REACHED
        if (durationInSeconds > 0 && newSeconds >= durationInSeconds) {
          handleTerminate();
        }
        return newSeconds;
      });
        
      const hour = new Date().getHours();
      setTimeOfDay (hour >= 6 && hour < 18 ? "Day" : "Night");

      setWeather("Clear");
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, duration]);


  const formatTime = (s) => 
  {
    const hrs = String(Math.floor(s / 3600)).padStart(2, "0");
    const mins = String(Math.floor(s % 3600 / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };


  const handleStart = () => 
  {
    if (!isSetupValid) return;

    setShowStartScreen(false);
    setIsRunning(true);
  };


  const handleTerminate = () => {
    setIsRunning(false);
    setShowEndScreen(true);
  }


return (
  <>
    {/* TOP RIGHT CONTROL */}
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

            {/* INLINE WARNING FOR SLIDER PERCENTAGES SUM*/}
            {merchantRate + pirateRate + securityRate > 100 && (
              <div className = "text-danger small">
                Total of Merchant, Pirate, and Security percentages cannot exceed 100%
              </div>
            )}

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

            {/* SET OOPERATIONAL CONDITION */}
            <div className="mb-3">
              <label className="form-label">Operational Condition</label>
              <div>
                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="operationalCondition"
                    value="Day"
                    checked={operationalCondition === "Day"}
                    onChange={(e) => setOperationalCondition(e.target.value)}
                    disabled = {isRunning}
                  />
                  <label className="form-check-label">Day</label>
                </div>

                <div className="form-check form-check-inline">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="operationalCondition"
                    value="Night"
                    checked={operationalCondition === "Night"}
                    onChange={(e) => setOperationalCondition(e.target.value)}
                    disabled = {isRunning}
                  />
                  <label className="form-check-label">Night</label>
                </div>
              </div>
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

        {/* SIMULATION END SCREEN */}
        {showEndScreen && (
          <div
            className="position-fixed top-50 start-50 translate-middle bg-dark text-light p-4 rounded shadow"
            style={{ zIndex: 2000, minWidth: "400px" }}
          >
            <h5 className="mb-3">Configure Simulation</h5>
            
            {/* END METRICS GO HERE */}
            <p className = "mb-4">Elapsed Time:  {formatTime(seconds)}</p>

            <div className = "d-grip">
              <button
                className = "btn btn-success"
                onClick = {() => {
                  setShowEndScreen(true);                 
                }}
              >
                Export
              </button>

              <button
                className = "btn btn-success"
                onClick = {() => {
                  setSeconds(0);
                  setShowEndScreen(false);
                  setShowStartScreen(true);
                }}
              >
                Restart
              </button>
              
            </div>
          </div>
        )}

        {/* STATUS DISPLAY */}
        <Row className="mb-2">
          <Col md="auto">
            <Card
              bg="dark"
              text="light"
              className="rounded shadow"
              style={{ minWidth: "100px" }}
            >
              <Card.Body className="p-2 small">
                <div><strong>Elapsed:</strong> {formatTime(seconds)}</div>
                <div><strong>Time:</strong> {timeOfDay}</div>
                <div><strong>Weather:</strong> {weather}</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* DROPDOWN */}
        <Row>
          <Col md="auto">
            <Card bg="secondary" className="rounded shadow">
              <Card.Body className="p-2">
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" disabled>
                    View Live Counts
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {/* Empty for now */}
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </div>
    </Control>

    {/* BOTTOM RIGHT CONTROLS */}
    <Control prepend position="bottomright">
      <div onClick={(e) => e.stopPropagation()} className="d-flex gap-2">
        <button className="btn btn-primary btn-sm">Step</button>
        <button className="btn btn-warning btn-sm">Speed</button>
        <button className="btn btn-danger btn-sm" onClick = {handleTerminate}>
          Terminate
        </button>
      </div>
    </Control>
  </>
);
}

export default Controls;
