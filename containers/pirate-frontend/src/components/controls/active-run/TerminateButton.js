
//Handle Terminate Function
const handleTerminate = () => {
    const confirmed = window.confirm(
      'Are you sure you want to terminate this run?\nBy terminating, this simulation will end and your summary outcome will be presented.',
    );
    if (!confirmed) {
      return;
    }

    setIsRunning(false);
    setShowEndScreen(true);
    if (typeof onSimulationStop === 'function') {
      onSimulationStop();
    }
  };