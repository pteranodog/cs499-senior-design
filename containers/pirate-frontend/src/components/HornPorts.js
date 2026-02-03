import 'leaflet/dist/leaflet.css';
import {Marker, Popup } from 'react-leaflet';

/* The purpose of this element is to provide markers for 
the ports associated with the deafult region for the simulation
(the ones relevant to Somalian Piracy). In the future,
we will likely have a way to dynamically create ports at will, so
do not expect this file to stay; I just like being able to
visualize these port locations easily for the time being. :)
Also: may add more/ remove some once we get a better idea of the
exact parameters of the default sim area. */

function HornPorts() {
  return (
    <>
      <Marker position={[31.268591553342564, 32.3080159013517]}>
        <Popup>
          Port Said (Egypt)
        </Popup>
      </Marker>

      <Marker position={[-4.0717176235876895, 39.67302089897652]}>
        <Popup>
          Mombasa (Kenya)
        </Popup>
      </Marker>

      <Marker position={[-6.764025272071542, 39.27479457164424]}>
        <Popup>
          Dar es Salaam (Tanzania)
        </Popup>
      </Marker>


      <Marker position={[11.604819989415411, 43.14977135115654]}>
        <Popup>
          Djibouti
        </Popup>
      </Marker>    
    </>
  )
}

export default HornPorts;
