import Control from "react-leaflet-custom-control";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";

export default function BottomRightControls({ isRunning, onPause, onStep, onTerminate, onSpeedChange }) {
  return (
    <Control prepend position="bottomright">
      <div onClick={(e) => e.stopPropagation()}>
        <Row className="mb-2">
          <Col md="auto">
            <Card bg="secondary" className="rounded shadow">
              <Card.Body className="p-2 small text-center">
                <Button size="sm" variant="danger" className="me-1" onClick={onTerminate}>
                  Terminate
                </Button>

                <Button size="sm" variant={isRunning ? "warning" : "success"} className="me-1" onClick={onPause}>
                  {isRunning ? "Pause" : "Resume"}
                </Button>

                <Button size="sm" variant="info" className="me-1" onClick={onStep}>
                  Step
                </Button>

                <Dropdown className="d-inline">
                  <Dropdown.Toggle variant="light" size="sm">
                    Speed
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => onSpeedChange(1)}>1x</Dropdown.Item>
                    <Dropdown.Item onClick={() => onSpeedChange(10)}>10x</Dropdown.Item>
                    <Dropdown.Item onClick={() => onSpeedChange(60)}>60x</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Control>
  );
}
