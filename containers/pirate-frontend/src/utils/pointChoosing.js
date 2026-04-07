import { defaultRegions } from "../data/regions";


let somalia = defaultRegions().r1; // used to get port locations

// TEMPORARY: defining prioritized arrays of lat/lon points that pirates/merchants use
// for destinations. In the future, these will likely be constructed by a function that
// analyzes an grayscale image of a heatmap to determine the actual most likely points for use
const somalianPirateHotspots = [ 
  {
    latlng: [12.5, 48.0], 
    prob: 0.6  
  },

  {

    latlng: [12.4, 56.3], 
    prob: 0.2 
  },

  {
    latlng: [1.1, 51.1],
    prob: 0.1
  },

  {
    latlng: [10.8, 56.4],
    prob: 0.1
  }
]

const somaliaPrioMerhcantPoints = [
    { // Upper left part of our Somalia region in the red sea
        latlng: [14.0, 42.6],
        prob: 0.5, // loads of ships coming and going through here
    },

    {
        latLng: [12.9, 57.0],
        prob: 0.2 
    },

    {
        latLng: [14.0, 48.9],
        prob: 0.2 
    },


    {
        latLng: [-8.0, 42.6],
        prob: 0.1
    }
]




function choosePirateHotspot(hotspotArr) {
  const p = Math.random(); // TODO: seed!
  let probSum = 0;
  for (const hotspot of hotspotArr) {
    probSum += hotspot.prob;
    if (p < probSum) {
      return hotspot.latlng;
    }
  }

  // fallback return in case probSum doesnt reach 1
  return hotspotArr[hotspotArr.length - 1].latlng;
}

function choosePort(portArr) {
  const p = Math.random(); // TODO: seed!
  let probSum = 0;
  for (const port of portArr) {
    probSum += port.prob;
    if (p < probSum) {
      return port.latlng;
    }
  }

  // fallback return in case probSum doesnt reach 1
  return portArr[portArr.length - 1].latlng;
}

// export somalia-specific destination getters
export function getSomaliaHotspot() {
    return choosePirateHotspot(somalianPirateHotspots);
}

export  function getSomaliaMerhchantDestination() {
    return choosePirateHotspot(somaliaPrioMerhcantPoints);
}

