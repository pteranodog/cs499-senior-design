import { useEffect, useState } from 'react';
import Control from 'react-leaflet-custom-control';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import ConfigDisplay from './ConfigDisplay';
import EndScreen from './EndScreen';
import { getTimeOfDayInfo } from '../../utils/timeOfDay.js';

function Controls({
  pointsOfInterest = [],
  onStartCenterPointChange,
  onSimulationStart,
  onSimulationStop,
  onConfigTimeChange,
} = {}) {
  // SIMULATION RUNTIME STATE
  const [seconds, setSeconds] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  // SET SPEED THROWING ERROR CURRENTLY. LOOK INTO LATER
  const [speed, setSpeed] = useState(1);
  const [stepRate, setStepRate] = useState(1);

  // CONFIGURATION STATE
  const [simName, setSimName] = useState('');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState('');
  const [merchantRate, setMerchantRate] = useState(50);
  const [pirateRate, setPirateRate] = useState(50);
  const [securityRate, setSecurityRate] = useState(0);
  // const [weather, setWeather] = useState(''); // TODO: Weather temporarily removed
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');

  // SKELETON: this stores a chosen POI id from the Start modal.
  // Later can persist this in the global sim config instead of the local component state.
  const [startCenterPointId, setStartCenterPointId] = useState('');

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
      // weather !== '' && // TODO: Weather temporarily removed
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
          if (typeof onSimulationStop === 'function') {
            onSimulationStop();
          }
          return durationInSeconds;
        }
        return next;
      });

      applyMetricTick();
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isRunning, duration, speed, onSimulationStop]);

  useEffect(() => {                             //THIS IS THE THING THAT NEEDS TO BE PUT BACK IN CODE FOR WARNING USER BEFORE EXITING
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

    const timeInfo = getTimeOfDayInfo({
      regionName: region,
      startHour,
      startMinute,
      elapsedTicks: seconds,
      ticksPerMinute: 60,
    });
    setTimeOfDay(timeInfo.label);

    if (typeof onConfigTimeChange === 'function') {
      onConfigTimeChange(timeInfo.totalMinutes);
    }
  }, [seconds, startHour, startMinute, region, onConfigTimeChange]);

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

    return getTimeOfDayInfo({
      regionName: '',
      startHour,
      startMinute,
      elapsedTicks: seconds,
      ticksPerMinute: 60,
    }).clockLabel;
  };

  const handleStart = () => {
    if (!isSetupValid) {
      return;
    }

    const selectedPoint = resolveStartCenterPoint();
    if (typeof onStartCenterPointChange === 'function') {
      onStartCenterPointChange(selectedPoint);
    }

    if (typeof onSimulationStart === 'function') {
      onSimulationStart({
        simulationName: simName.trim(),
        region,
        // weather, // TODO: Weather temporarily removed
        durationMinutes: Number(duration),
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        startTimeMinutes: Number(startHour) * 60 + Number(startMinute),
        populationDistribution: {
          merchant: merchantRate,
          pirate: pirateRate,
          security: securityRate,
        },
        startCenterPoint: selectedPoint,
      });
    }

    const initialTimeInfo = getTimeOfDayInfo({
      regionName: region,
      startHour,
      startMinute,
      elapsedTicks: 0,
      ticksPerMinute: 60,
    });
    setTimeOfDay(initialTimeInfo.label);
    resetMetrics();
    setSeconds(0);
    setShowEndScreen(false);
    setShowStartScreen(false);
    setIsRunning(true);
  };

  /*const handleRestart = () => {       CODE MIGHT BE USED FOR REFERENCE LATER
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
    if (typeof onSimulationStop === 'function') {
      onSimulationStop();
    }
  };*/

  /*
    Legacy orphaned block from the previous file version.
    This was outside any function and caused the syntax/runtime issues.
    Keeping it here commented out so the original data/intent remains visible.

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
  */

  const handleExport = (format = 'json') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runData = {
      simulationName: simName,
      region,
      // weather, // TODO: Weather temporarily removed
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

  return (
    <>
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
        handleRestart={handleStart}
      >
      </EndScreen>
    </>
  );
}

export default Controls;
