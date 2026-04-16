import seedrandom from 'seedrandom';
import { defaultRegions } from "../data/regions";


let somalia = defaultRegions().r1; // used to get port locations

// TEMPORARY: defining prioritized arrays of lat/lon points that pirates/merchants use
// for destinations. In the future, these will likely be constructed by a function that
// analyzes an grayscale image of a heatmap to determine the actual most likely points for use
const somalianPirateHotspots = [ 
  {
    latLng: [12.5, 48.0], 
    prob: 0.6  
  },

  {

    latLng: [12.4, 56.3], 
    prob: 0.2 
  },

  {
    latLng: [1.1, 51.1],
    prob: 0.1
  },

  {
    latLng: [10.8, 56.4],
    prob: 0.1
  }
]

const somaliaPrioMerhcantPoints = [
    { // Upper left part of our Somalia region in the red sea
        latLng: [14.0, 42.6],
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




function choosePirateHotspot(hotspotArr, seed) {
  const rng = seedrandom(seed);
  const p = rng();
  let probSum = 0;
  for (const hotspot of hotspotArr) {
    probSum += hotspot.prob;
    if (p < probSum) {
      return hotspot.latLng;
    }
  }

  // fallback return in case probSum doesnt reach 1
  return hotspotArr[hotspotArr.length - 1].latLng;
}

function choosePort(portArr, seed) {
  const rng = seedrandom(seed);
  const p = rng();
  let probSum = 0;
  for (const port of portArr) {
    probSum += port.prob;
    if (p < probSum) {
      return port.latLng;
    }
  }

  // fallback return in case probSum doesnt reach 1
  return portArr[portArr.length - 1].latLng;
}

// export somalia-specific destination getters
export function getSomaliaHotspot(seed) {
    return choosePirateHotspot(somalianPirateHotspots, seed);
}

export  function getSomaliaMerchantDestination(seed) {
    return choosePort(somaliaPrioMerhcantPoints, seed);
}

