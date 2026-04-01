import { latLngToCartesian } from "../utils/coords.js";
import * as behaviors from './behaviors.js'

function toCart(lat, lon) { // convert latlon to cartesian specifically for the Somalia Region 
    let xY = latLngToCartesian(lat, lon, {
        originLat: 9.5,
        originLon: 46
    })
    return xY;
}

// call this for every start and/or end point we use in paths, assigning a cartesian two tuple:

// ports
let djibouti = toCart(11.6048, 43.1497);
let mumbai = toCart(18.9, 72.8);
let mombasa = toCart(-4.0717, 39.6730);
let dar_es_salaam = toCart(-6.7640, 39.2747)
let oman = toCart(16.9, 54.0);

// coves
let cove1 = toCart(11.1705, 47.4048);
let cove2 = toCart(5.0659, 48.2978);

// patrol bases
let campLem = toCart(11.5434, 43.1790);
let mombasaBase = toCart(-4.3, 39.6);
let mahé = toCart(-4.67, 55.47);



// assemble path objects
let djibouti_To_Mumbai_Path = behaviors.assemblePath(behaviors.newPath(
    [djibouti, toCart(11.5, 57.3), toCart(13.2, 64.5), mumbai], 
    1  
));

let djibouti_To_Mombasa_Path = behaviors.assemblePath(behaviors.newPath(
    [djibouti, toCart(12.6, 49.0), toCart(14.6, 55.6,), toCart(10.7, 59.5), toCart(3.2, 55.2), toCart(-2.1, 47.2), mombasa],
    2
));

let dar_Es_Salaam_To_Mumbai_Path = behaviors.assemblePath(behaviors.newPath(
    [dar_es_salaam, toCart(-1.0, 51.3), toCart(5.4, 54.4), toCart(12.0, 54.9), toCart(16.8, 63.4), mumbai], 
    3
));

let mombasa_To_Oman_Path = behaviors.assemblePath(behaviors.newPath(
    [mombasa, toCart(-4.2, 48.4), toCart(0.5, 52.2), toCart(4.6, 56.3), toCart(10.8, 58.6), oman], 
    4
));




let cove2_Loop = behaviors.assemblePath(behaviors.newPath(
    [cove2, toCart(4.8, 52.8), toCart(1.4, 54.1), toCart(-5.4, 43.6), toCart(-2.5, 42.1)],
    5
));

let cove1_Loop = behaviors.assemblePath(behaviors.newPath(
    [cove1, toCart(13.5, 55.6), toCart(8.1, 52.2), toCart(14.4, 53.6), toCart(11.5, 44.5)],
    6
));



let camp_Lem_Patrol_Path = behaviors.assemblePath(behaviors.newPath(
    [campLem, toCart(11.0, 44.6), toCart(12.9, 53.0), toCart(17.5, 58.3), toCart(14.2, 51.2), campLem], // "loops"
    7
));

let mombasa_Base_Patrol_Path = behaviors.assemblePath(behaviors.newPath(
    [mombasaBase, toCart(0.2, 44.2), toCart(2.8, 47.7), toCart(6.5, 49.9), toCart(10.2, 51.9), toCart(11.5, 51.7)],
    8
));

let mahé_Patrol_Path = behaviors.assemblePath(behaviors.newPath(
    [mahé, toCart(5.5, 60.1), toCart(3.7, 52.4), toCart(-5.8, 48.1), mahé], // "loops"
    9
));



// export paths as obj structured as LUT based on key names of export in regions.js;
// note that, since a one-to-many relationship between points is possbile,
// some values for such keys are arrays containing all the outgoing paths from
// that point

export const somaliaMerchantPaths = { 
    "p4": [djibouti_To_Mombasa_Path, djibouti_To_Mumbai_Path],
    "p3": [dar_Es_Salaam_To_Mumbai_Path],
    "p2": [mombasa_To_Oman_Path]
};

export const somaliaPiratePaths = {
    "p7": [cove1_Loop],
    "p8": [cove2_Loop]
};

export const somaliaPatrolPaths = {
    "p9": [camp_Lem_Patrol_Path],
    "p10": [mombasa_Base_Patrol_Path],
    "p11": [mahé_Patrol_Path]
};

