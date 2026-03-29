import StatusDisplay from "./StatusDisplay";
import BottomRightButtons from "./BottomRightButtons";
import Legend from "./Legend";
import TimeViewer from "./TimeViewer";
import LiveCounts from "./LiveCounts";
import { useEffect } from "react";

export default function RunControls({ simState, modifySimState, runID }) { 
    const run = typeof runID === 'number'
        ? simState?.runs?.[runID]
        : simState?.runs?.find((candidate) => candidate?.uuid === runID);

    useEffect(() => {
        if (run.status !== 'running') {
            return undefined;
        }
        const interval = setInterval(() => {
            modifySimState({ type: 'increment-run-time', index: runID, seconds: 1 });
        }, 1000);

    return () => clearInterval(interval);
    }, [run.status, runID, modifySimState]);

    if (!run) {
        return null;
    }

    return (
        <>
            <StatusDisplay simState={simState} runID={runID} />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
            <Legend />
            <TimeViewer seconds={run.elapsedTime || 0} />
            <LiveCounts simState={simState} />
        </>
    );
}