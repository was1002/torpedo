export default class Fleet {
    #ships

    constructor(){
        this.#ships = []
    }

    addShip(ship){
        this.#ships.push = ship
    }
}

export class Ship {
    #length
    #cells
    #isSunken

    constructor(){
        this.#length = 0
        this.#cells = []
        this.#isSunken = false
    }
}