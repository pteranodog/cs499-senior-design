import seedrandom from 'seedrandom';

/*  CONVERT SHIPS PER DAY TO PROBABILITY OF A SPAWN IN A GIVEN MINUTE */
export function perDaytoProbability(ratePerDay, minPerTick = 1) {
    const minPerDay = 1440;
    
    return (ratePerDay / minPerDay) * minPerTick;
}

/* DETERMINE IF SHIP SHOULD SPAWN IN A STEP */
export function shouldSpawn(ratePerDay, seed, step, minPerTick = 1) {
    const rng = seedrandom(seed + '-' + step + '-' + ratePerDay);
    const prob = perDaytoProbability(ratePerDay, minPerTick);
    return rng() < prob;
}
