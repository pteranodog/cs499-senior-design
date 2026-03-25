import StatusDisplay from "./StatusDisplay";
import BottomRightButtons from "./BottomRightButtons";
import Legend from "./Legend";

export default function RunControls({ simState, modifySimState, runID }) { 
    return (
        <>
            <StatusDisplay simState={simState} runID={runID} />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
            <Legend />
        </>
    );
}