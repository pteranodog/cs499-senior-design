import { useEffect, useState } from 'react';

import EndScreen from './EndScreen';
import StartScreen from './StartScreen';
import ConfigDisplay from './ConfigDisplay';
import Legend from './Legend';
import StepRateControls from './StepRateControls';
import LiveCounts from './LiveCounts';
import ElapsedTime from './ElapsedTime';

function Controls({
  pointsOfInterest = [],
  onStartCenterPointChange,
  onSimulationStart,
} = {}) {
  // SIMULATION RUNTIME STATE
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

  // METRICS
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

  return (
    <>
      <StartScreen 
      showStartScreen={showStartScreen}
      isRunning={isRunning}

      simName={simName}
      setSimName={setSimName}
      startHour={startHour}
      setStartHour={setStartHour}
      startMinute={startMinute}
      setStartMinute={setStartMinute}
      duration={duration}
      setDuration={setDuration}
      region={region}
      setRegion={setRegion}
      weather={weather}
      setWeather={setWeather}
      startCenterPointId={startCenterPointId}
      setStartCenterPointId={setStartCenterPointId}
      merchantRate={merchantRate}
      setMerchantRate={setMerchantRate}
      pirateRate={pirateRate}
      setPirateRate={setPirateRate}
      securityRate={securityRate}
      setSecurityRate={setSecurityRate}

      percentValid={percentValid}
      isSetupValid={isSetupValid}
      minDuration={minDuration}
      maxDuration={maxDuration}
      pointsOfInterest={pointsOfInterest}

      handleStart={handleStart}

      seconds={seconds}
      formatTime={formatTime}
      entries={entries}
      exits={exits}
      captures={captures}
      defeats={defeats}
      rescues={rescues}
      evasions={evasions}
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