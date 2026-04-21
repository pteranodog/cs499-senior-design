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
                <Dropdown.ItemText className="text-black">Captures: {captures}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Rescues: {rescues}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Pirates Sunk: {sinks}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Merchant-Evasions: {evasions}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Active Ships: {ships.length}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Merchant-Pirate Encounters: {merchantPirateEncounters}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Patrol-Pirate Encounters: {patrolPirateEncounters}</Dropdown.ItemText>
                <Dropdown.ItemText className="text-black">Total Pirate Encounters: {totalPirateEncounters}</Dropdown.ItemText>
            </Dropdown.Menu>
        </Dropdown>
    );
}
