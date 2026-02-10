import Control from 'react-leaflet-custom-control';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

function TopRightControls() {
  return (
    <>
      <Control prepend position='topright'>
        <Row className='mb-2 text-end'><Col md="auto">
          <Card bg='primary' className='rounded'>
            <Card.Body className="p-2" onClick={() => console.log("Clicked control!")}>Control!</Card.Body>
          </Card>
        </Col></Row>
        <Row className='mb-2 text-end'><Col md="auto">
          <Card bg='secondary' className='rounded'>
            <Card.Body className="p-2" onClick={() => console.log("Clicked Second!")}>Second!</Card.Body>
          </Card>
        </Col></Row>
        <Row className='mb-2 text-end'><Col md="auto">
          <Card bg='light' className='rounded'>
            <Card.Body className="p-2" onClick={() => console.log("Clicked Other!")}>Other!</Card.Body>
          </Card>
        </Col></Row>
      </Control>
    </>
  )
}

export default TopRightControls;
