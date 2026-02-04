// Ship class def'ns; our three ship types inherit from base Ship class.
// TODO: add "advance/move" methods? i.e. SomePirate.advance() will  cause SomePirate to "make the next move"
// (would be called on each ship at every step of the sim)

const fs = require("fs") // 

class Ship {
    constructor(id, type, startPos, size, sightRange){
        this.id = id
        this.type = type
        this.pos = startPos
        this.size = size
        this.sightRange = sightRange

        this.state = 1
        this.fuel = 100
    }
}

class PirateShip extends Ship {
    constructor(id, startPos, size) {
        // infer type and sightrange?
        self.id = id
        self.pos = startPos
        self.size = size

        this.state = 1
        this.fuel = 100
    }
}

class PatrolShip extends Ship {
    constructor(id, startPos, size) {
        // infer type and sightrange?
        self.id = id
        self.pos = startPos
        self.size = size

        this.state = 1
        this.fuel = 100
    }
}

class MerchantShip extends Ship {
    constructor(id, startPos, size) {
        // infer type and sightrange?
        self.id = id
        self.pos = startPos
        self.size = size

        this.state = 1
        this.fuel = 100
    }
}

