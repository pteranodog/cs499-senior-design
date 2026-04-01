import StatusDisplay from "./StatusDisplay";
import BottomRightButtons from "./BottomRightButtons";
import Legend from "./Legend";
import TimeViewer from "./TimeViewer";
import LiveCounts from "./LiveCounts";
import { useEffect } from "react";
import Modify from "./Modify";

export default function RunControls({ simState, modifySimState, runID }) { 
    const run = typeof runID === 'number'
        ? simState?.runs?.[runID]
        : simState?.runs?.find((candidate) => candidate?.uuid === runID);
    const speed = run?.speed || 1;

    useEffect(() => {
        if (!run || run.status !== 'running') {
            return undefined;
        }
        const interval = setInterval(() => {
            modifySimState({ type: 'increment-run-time', index: runID, seconds: 1 });
        }, 1000 / speed);

    return () => clearInterval(interval);
    }, [run, runID, modifySimState, speed]);

    if (!run) {
        return null;
    }

    return (
        <>
            <StatusDisplay simState={simState} runID={runID} />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
            <Legend />
            <TimeViewer seconds={run.elapsedTime || 0} />
            {/*MERGE NOTE: passing runID down to LiveCounts because it needs it now -ljj*/}
            <LiveCounts simState={simState} runID={runID} /> 
            {/*<Modify run={run} runID={runID} modifySimState={modifySimState} /> MERGE NOTE: should this be commented out? -ljj */}
        </>
    );
}
