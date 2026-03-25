import StatusDisplay from "./StatusDisplay";
import BottomRightButtons from "./BottomRightButtons";

export default function RunControls({ simState, modifySimState, runID }) { 
    return (
        <>
            <StatusDisplay modifySimState={modifySimState} runID={runID} />
            <BottomRightButtons simState={simState} modifySimState={modifySimState} runID={runID} />
        </>
    );
}