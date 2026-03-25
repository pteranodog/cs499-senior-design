import StatusDisplay from "./StatusDisplay";
export default function RunControls({ simState, modifySimState, runID }) { 
    return (
        <>
            <StatusDisplay simState={simState} runID={runID} />
            {/*<TerminateButton simState={simState} modifySimState={modifySimState} runID={runID} />*/}
        </>
    );
}