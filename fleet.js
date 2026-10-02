class Fleet {
    #ships
    #nextId
    #shipCount
    #shipsPerLength

    constructor(){
        this.#ships = []
        this.#nextId = 0
        this.#shipCount = 0
        // number of ships to find per length
        this.#shipsPerLength = Object.freeze({
            1: 4,
            2: 3,
            3: 2,
            4: 1
        })
    }

    get ships(){
        return this.#ships
    }
    
    get shipCount(){
        return this.#shipCount
    }

    get shipsPerLength(){
        return this.#shipsPerLength
    }

    // returns the number of ships (all) with a specific length
    countShipsWithLength(length){
        if(length < 1 || length > 4){
            console.error("Error: Invalid ship length. Must be between 1 and 4.")
            return 0
        }
        return this.#shipsPerLength[length]
    }

    // creates a new ship to the fleet and returns it
    newShip(){
        // adding a new ship to the fleet and updating the number of ships
        this.#shipCount = this.#ships.push(new Ship(this.#nextId))
        // creating a new id for a next ship
        this.#nextId += 1
        // returning the newly created ship
        return this.#ships[this.#shipCount - 1]
    }

    // returns the ship based on its id
    ship(id){
        return this.#ships.find((element) => element.id == id)
    }

    // remove = delete ship from the fleet 
    removeShip(ship){
        let index = this.#ships.indexOf(ship)
        this.#ships.splice(index, 1)
        this.#shipCount -= 1
    }

    // resets the fleet
    removeAllShips(){
        this.#ships = []
        this.#nextId = 0
        this.#shipCount = 0
    }

    // merges ship2 into ship1 and returns ship1
    mergeShips(ship1, ship2){
        // copy cells from ship2 to ship1
        for(let element of ship2.cells){
            ship1.addCell(element)
        }
        // delete ship2
        this.removeShip(ship2)
        return ship1
    }

    unmergeShip(ship, lastCell){
        let unmergedShip = fleet.newShip()
        let tempCells = [...ship.cells]
        for(let cell of tempCells){
            // if the cell id is bigger than the last cell's
            // add to a new ship and delete from this
            if(cell.id > lastCell.id){
                unmergedShip.addCell(cell)
                ship.removeCell(cell)
            }
        }
    }
    
    // collects all the ships that are found but not sunken
    notSunkenShips(){
        return this.#ships.filter((ship) => !ship.isSunken)
    }

    sunkenShips(){
        return this.#ships.filter((ship) => ship.isSunken)
    }

    sunkenShipsWithFreeNeighbours(){
        let sunkenShipsWithFreeNeighbours = []
        for(let ship of fleet.sunkenShips()){
            let freeNeighbours = getFreeNeighboursOfShip(ship.cells)
            if(freeNeighbours.length > 0){
                sunkenShipsWithFreeNeighbours.push(ship)
            }
        }
        return sunkenShipsWithFreeNeighbours
    }
    // number of all the ships that are found and sunken, per length
    countSunkenShipsPerLength(){
        let sunkenPerLenght = Object({
            1: 0,
            2: 0,
            3: 0,
            4: 0
        })
        for(let ship of this.sunkenShips()){
            sunkenPerLenght[ship.length] += 1
        }
        return sunkenPerLenght
    }

    // number of all the ships that are found but not sunken, per length
    countNotSunkenShipsPerLength(){
        let notSunkenShipsPerLength = Object({
            1: 0,
            2: 0,
            3: 0,
            4: 0
        })
        for(let ship of this.notSunkenShips()){
            notSunkenShipsPerLength[ship.length] += 1
        }
        return notSunkenShipsPerLength
    }

    // number of all the ships that has to be sunk (found and not found), per length
    countShipsToSinkPerLength(){
        let shipsToSinkPerLength = Object({
            1: 0,
            2: 0,
            3: 0,
            4: 0
        })
        for(let length = 1; length <= 4; length++){
            shipsToSinkPerLength[length] = this.countShipsWithLength(length) - this.countSunkenShipsPerLength()[length]
        }
        return shipsToSinkPerLength
    }

    maxShipToSinkLength(){
        let maxLength = 0
        for(let length = 4; length >= 1; length--){
            if(this.countShipsToSinkPerLength()[length] > 0){
                maxLength = length
                break
            }
        }
        return maxLength
    }

    countShipsToSinkLongerThan(length){
        let shipsToSink = 0
        for(let i=length+1; i<=4; i++){
            shipsToSink += this.countShipsToSinkPerLength()[i]
        }
        return shipsToSink
    }

    countShipsToSinkMinLength(length){
        let shipsToSink = 0
        for(let i=length; i<=4; i++){
            shipsToSink += this.countShipsToSinkPerLength()[i]
        }
        return shipsToSink
    }

    countNotSunkenShipsLongerThan(length){
        let count = 0
        for(let ship of this.notSunkenShips()){
            if(ship.length > length){
                count++
            }
        }
        return count
    }

    countNotSunkenShipsMinLength(length){
        let count = 0
        for(let ship of this.notSunkenShips()){
            if(ship.length >= length){
                count++
            }
        }
        return count
    }
}

class Ship {
    #id
    #length
    #cells
    #isSunken

    constructor(shipId){
        this.#id = shipId
        this.#length = 0
        this.#cells = []
        this.#isSunken = false
    }

    get id(){
        return this.#id
    }

    get cells(){
        return this.#cells
    }

    get length(){
        return this.#length
    }

    get isSunken(){
        return this.#isSunken
    }

    set isSunken(value){ // value = true or false
        this.#isSunken = value
    }

    // adds a cell to the ship
    addCell(cell){
        this.#cells.push(cell)
        this.#length += 1
    }

    // removes the cell from the ship if it's a part of it
    removeCell(cell){
        // if the cell is part of the ship remove it and update length
        let cellPosition = this.#cells.indexOf(cell)
        if(cellPosition >= 0 ){
            this.#cells.splice(cellPosition,1)
            this.#length -= 1
        // else throw an error
        } else {
            console.error("Error: Cell " + cell.id + " is not part of the ship.")
        }
    }

    // decides whether the cell is in the ship or not, returns true or false
    isCellInShip(cell){
        return this.#cells.includes(cell)
    }
}