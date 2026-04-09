import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

export default function ConfigDisplay({
  // These are all the props that need passing from Controls.js:
  simName,
  region,
  // weather, // TODO: Weather temporarily removed
  duration,

  merchantRate,
  pirateRate,
  securityRate,

  timeOfDay,
  getSimulatedClock
}) {

    return (
        <div onClick={(e) => e.stopPropagation()}>
          <Row className="mb-2">
            <Col md="auto">
              <Card
                bg={timeOfDay === 'Night' ? 'dark' : 'light'}
                text={timeOfDay === 'Night' ? 'light' : 'dark'}
                className="rounded shadow"
                style={{ minWidth: '100px' }}
              >
                <Card.Body className="p-2 small">
                  <div>
                    <strong>Sim Name:</strong> {simName}
                  </div>
                  <div>
                    <strong>Sim Clock:</strong> {getSimulatedClock()}
                  </div>
                  <div>
                    <strong>Mode:</strong> {timeOfDay}
                  </div>
                  <div>
                    <strong>Duration:</strong> {duration || 0} minutes
                  </div>
                  <div>
                    <strong>Region:</strong> {region || 'n/a'}
                  </div>
                  {/* <div><strong>Weather:</strong> {weather || 'n/a'}</div> TODO: Weather temporarily removed */}
                  <div>
                    <strong>Merchant Presence:</strong> {merchantRate}
                  </div>
                  <div>
                    <strong>Pirate Presence:</strong> {pirateRate}
                  </div>
                  <div>
                    <strong>Security Presence:</strong> {securityRate}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
    )
}