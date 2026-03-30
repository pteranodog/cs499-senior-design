import { latLngToCartesian } from "../utils/coords";
import * as behaviors from './behaviors.js'

function toCart(lat, lon) { // convert latlon to cartesian specifically for the Somalia Region 
    let xY = latLngToCartesian(lat, lon, {
        originLat: 9.5,
        originLon: 46
    })
    return xY;
}

// call this for every point we use in paths, assigning a cartesian two tuple:
let djibouti = toCart(11.6048, 43.1497);
let mumbai = toCart(18.9, 72.8);
let mombasa = toCart(-4.0717, 39.6730);
let dar_es_salaam = toCart(-6.7640, 39.2747)
let oman = toCart(16.9, 54.0);

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

export const somaliaPaths = {
    djibouti_To_Mombasa_Path: djibouti_To_Mombasa_Path,
    djibouti_To_Mumbai_Path: djibouti_To_Mumbai_Path,
    dar_Es_Salaam_To_Mumbai_Path: dar_Es_Salaam_To_Mumbai_Path,
    mombasa_To_Oman_Path: mombasa_To_Oman_Path
};