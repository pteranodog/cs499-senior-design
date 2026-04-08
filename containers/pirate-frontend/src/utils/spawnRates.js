/*  CONVERT SHIPS PER DAY TO PROBABILITY OF A SPAWN IN A GIVEN MINUTE */
export function perDaytoProbability(ratePerDay, minPerTick = 1) {
    const minPerDay = 1440;
    
    return (ratePerDay / minPerDay) * minPerTick;
}

/* DETERMINE IF SHIP SHOULD SPAWN IN A STEP */
export function shouldSpawn(ratePerDay, minPerTick = 1) {
    const prob = perDaytoProbability(ratePerDay, minPerTick);
    return Math.random() < prob;
}