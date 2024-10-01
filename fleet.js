class Fleet {
    #ships
    #nextId
    #shipCount

    constructor(){
        this.#ships = []
        this.#nextId = 0
        this.#shipCount = 0
    }

    get ships(){
        return this.#ships
    }
    
    get shipCount(){
        return this.#shipCount
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
    
    // collects all the ships that are found but not sunken
    notSunkenShips(){
        return this.#ships.filter((ship) => !ship.isSunken)
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