import StatusDisplay from "./StatusDisplay";
import BottomRightButtons from "./BottomRightButtons";
import Legend from "./Legend";
import TimeViewer from "./TimeViewer";
import LiveCounts from "./LiveCounts";

export default function RunControls({ simState, modifySimState, runID }) { 
    return (
        <>
            <StatusDisplay simState={simState} runID={runID} />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
            <Legend />
            <TimeViewer seconds={simState.elapsedTime} />
            <LiveCounts simState={simState} />
        </>
    );
}