import Dropdown from 'react-bootstrap/Dropdown';

const MAP_CONTROL_CLEARANCE = 44;

export default function LiveCounts({ simState, runID }) {
    const run = typeof runID === 'number'
        ? simState?.runs?.[runID]
        : simState?.runs?.find((candidate) => candidate?.uuid === runID);

    const stats = run?.currentState?.stats ?? {};

    return (
        <Dropdown
            bg="light"
            text="dark"
            className="p-2 small"
            style={{
                position: 'absolute',
                top: 44,
                right: MAP_CONTROL_CLEARANCE,
                zIndex: 1000,
            }}
        >
            <Dropdown.Toggle variant="light" size="sm">
                View Live Counts
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item disabled>Captures: {stats.captures ?? 0}</Dropdown.Item>
                <Dropdown.Item disabled>Rescues: {stats.rescues ?? 0}</Dropdown.Item>
                <Dropdown.Item disabled>Sinks: {stats.sinks ?? 0}</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}
