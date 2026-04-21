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
    const ticksPerMinute = run?.ticksPerMinute || 1;

    useEffect(() => {
        if (!run || run.status !== 'running') {
            return undefined;
        }
        const interval = setInterval(() => {
            modifySimState({ type: 'increment-run-time', index: runID, ticks: 1 });
            modifySimState({ type: 'step-run', index: runID });
        }, 1000 / speed);

    return () => clearInterval(interval);
    }, [run, runID, modifySimState, speed]);

    useEffect(() => {
        if (!run || run.status !== 'completed') {
            return;
        }

        if (simState?.controls?.type !== 'end-run' || simState?.controls?.index !== runID) {
            modifySimState({ type: 'view-run-end', run: runID });
        }
    }, [run, runID, simState, modifySimState]);

    if (!run) {
        return null;
    }

    return (
        <>
            <StatusDisplay
                simState={simState}
                runID={runID}
                elapsedTicks={run.elapsedTime || 0}
                ticksPerMinute={ticksPerMinute}
            />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
            <Legend />
            <TimeViewer elapsedTicks={run.elapsedTime || 0} ticksPerMinute={ticksPerMinute} />
            {/*MERGE NOTE: passing runID down to LiveCounts because it needs it now -ljj*/}
            <LiveCounts simState={simState} runID={runID} /> 
            {/*<Modify run={run} runID={runID} modifySimState={modifySimState} /> MERGE NOTE: should this be commented out? -ljj */}
        </>
    );
}
