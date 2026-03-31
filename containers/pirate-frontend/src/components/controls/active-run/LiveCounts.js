import Dropdown from 'react-bootstrap/Dropdown';

export default function LiveCounts({ simState }) {
    return (
        <Dropdown
        bg="light"
        text="dark"
        className="p-2 small"
        style={{
            position: 'absolute',
            top: 50,
            right: 16,
            zIndex: 1000,
        }}
        >
                  <Dropdown.Toggle variant="light" size="sm">
                    View Live Counts
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item disabled>Entries: {simState.entries}</Dropdown.Item>
                    <Dropdown.Item disabled>Exits: {simState.exits}</Dropdown.Item>
                    <Dropdown.Item disabled>Captures: {simState.captures}</Dropdown.Item>
                    <Dropdown.Item disabled>Defeats: {simState.defeats}</Dropdown.Item>
                    <Dropdown.Item disabled>Rescues: {simState.rescues}</Dropdown.Item>
                    <Dropdown.Item disabled>Evasions: {simState.evasions}</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
    );
}
