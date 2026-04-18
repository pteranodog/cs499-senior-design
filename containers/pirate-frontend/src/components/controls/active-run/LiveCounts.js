import Dropdown from 'react-bootstrap/Dropdown';

const MAP_CONTROL_CLEARANCE = 44;

export default function LiveCounts({ simState, runID }) {
    const run = typeof runID === 'number'
        ? simState?.runs?.[runID]
        : simState?.runs?.find((candidate) => candidate?.uuid === runID);

    const stats = run?.currentState?.stats ?? {};
    const ships = Object.values(run?.currentState?.ships ?? {});
    const captures = Number(stats.captures ?? 0);
    const evasions = Number(stats.evasions ?? 0);
    const rescues = Number(stats.rescues ?? 0);
    const sinks = Number(stats.sinks ?? 0);
    const merchantPirateEncounters = Number(stats.merchantPirateEncounters ?? 0);
    const patrolPirateEncounters = Number(stats.patrolPirateEncounters ?? 0);
    const totalPirateEncounters = Number(stats.totalPirateEncounters ?? 0);

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
                <Dropdown.Item disabled>Captures: {captures}</Dropdown.Item>
                <Dropdown.Item disabled>Rescues: {rescues}</Dropdown.Item>
                <Dropdown.Item disabled>Sinks: {sinks}</Dropdown.Item>
                <Dropdown.Item disabled>Merchant-Evasions: {evasions}</Dropdown.Item>
                <Dropdown.Item disabled>Active Ships: {ships.length}</Dropdown.Item>
                <Dropdown.Item disabled>Merchant-Pirate Encounters: {merchantPirateEncounters}</Dropdown.Item>
                <Dropdown.Item disabled>Patrol-Pirate Encounters: {patrolPirateEncounters}</Dropdown.Item>
                <Dropdown.Item disabled>Total Pirate Encounters: {totalPirateEncounters}</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}
