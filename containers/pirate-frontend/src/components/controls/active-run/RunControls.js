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
        const interval = setInterval(() => { // NEW: added step call to this, because it needed to be there -ljj
            modifySimState({ type: 'increment-run-time', index: runID, seconds: 1 });
            modifySimState({ type: 'step-run', index: runID });
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
            {/* NEW: passing down run ID as well so this run's exact data can be referenced -ljj */}
            <LiveCounts simState={simState} runID={runID} />
            <Modify run={run} runID={runID} modifySimState={modifySimState} />
        </>
    );
}
