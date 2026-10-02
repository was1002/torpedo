let fleet = new Fleet()

function calculateCellValues(){

}

// adds a new cell to a neighbour ship, or if there isn't any, creates a new one
// returns the ship, or -1 if there is an error
function addCellToShip(cell, state){
    let ship1
    let ship2
    let neighbourCells = []
    let neighbourHitCount = 0
    let ship1Length = 0
    let ship2Length = 0


    neighbourCells = collectNeighbourShipCells(cell)
    neighbourHitCount = neighbourCells.length
    // check how many hit neighbours the cell has
    switch(neighbourHitCount){
        case 0: // if there are no neighbour ships, then create a new
            ship1 = fleet.newShip()
            break
        case 1: // search the ship that belongs to the neighbour
            ship1 = searchShipByCell(neighbourCells[0])
            ship1Length = ship1.length
            break
        case 2: // search the two neighbour ships
            ship1 = searchShipByCell(neighbourCells[0])
            ship2 = searchShipByCell(neighbourCells[1])
            ship1Length = ship1.length
            ship2Length = ship2.length
            break
        default:
            console.error("Error: There are too many neighbour ships of cell: " + cell.id)
            return -1
    }

    // ----- CHECKS -----

    // check if ship length won't be bigger than allowed
    if(fleet.countNotSunkenShipsLongerThan(ship1Length + ship2Length) >= fleet.countShipsToSinkLongerThan(ship1Length + ship2Length)){
        console.error("Adding the cell would make a ship that is longer than allowed.")
        return -1
    }

    // check if adding the cell would enclose a ship with invalid length
    if(!isEnclosingInvalidShip(cell)){
        console.error("Adding the cell would enclose a ship with invalid length.")
        return -1
    }

    // check if adding the cell would make it an enclosed ship with invalid length
    let freeNeighbourCells = getFreeNeighboursOfShip([cell, ...ship1.cells, ...ship2?.cells ?? []])
    if(freeNeighbourCells.length == 0 && ship1Length > 0 &&
            fleet.countShipsToSinkPerLength()[ship1Length + ship2Length + 1] == 0){
        console.error("No more ships are allowed with length " + (ship1Length + ship2Length + 1) 
            + " and the ship would be enclosed by misses.")
        return -1
    }

    // if sunken, is it allowed to sink a ship with this length
    if(state == "sunken" && fleet.countShipsToSinkPerLength()[ship1Length + ship2Length + 1] == 0){
        console.error("No more ships are allowed to sink with length " + (ship1Length + ship2Length + 1))
        return -1
    }

    // ----- END OF CHECKS -----

    // add cell to the selected ship
    ship1.addCell(cell)

    // merge ships if there are neighbours
    if(neighbourHitCount == 2){
        ship1 = fleet.mergeShips(ship1, ship2)
    }

    return ship1
}

function searchShipByCell(shipCell){
    // returns the ship or undefined if the cell is not in a ship
    return fleet.ships.find((ship) => ship.isCellInShip(shipCell))
}

// collects all of the neighbour and corner neighbour cells of a ship that are free
function getFreeNeighboursOfShip(shipCells){
    // calculating the cell coordinate bounds of the neighbours
    let boundingBox = {
        Xmin: Math.max(Math.min(...shipCells.map(cell => cell.x)) - 1, 0),
        Xmax: Math.min(Math.max(...shipCells.map(cell => cell.x)) + 1, 9),
        Ymin: Math.max(Math.min(...shipCells.map(cell => cell.y)) - 1, 0),
        Ymax: Math.min(Math.max(...shipCells.map(cell => cell.y)) + 1, 9)
    }
    
    // collecting free cells in bounding box
    let freeCells = []
    // searches the whole bounding box and adds the cell if it is free
    for(let i = boundingBox.Xmin; i<=boundingBox.Xmax; i++ ){
        for(let j = boundingBox.Ymin; j<=boundingBox.Ymax; j++){
            let neighbourCell = grid.cellByXY(i,j)
            if(neighbourCell.state == "free"){
                freeCells.push(neighbourCell)
            }
        }
    }
    
    return freeCells
}

// checks if the cell is a middle cell of the ship
function isMiddleCell(ship, cell){
    let smallerIdCount = 0
    let biggerIdCount = 0

    // collects the ids that are smaller and bigger than the id of the cell
    for(let shipCell of ship.cells){
        if(shipCell.id < cell.id){
            smallerIdCount += 1
        } else if(shipCell.id > cell.id){
            biggerIdCount += 1
        }

    }
    // if there are both smaller and bigger ids, the cell is a middle cell
    return smallerIdCount > 0 && biggerIdCount > 0
}

// searching through neighbour cells if they are in a ship, if so, the cell can be added to that
function collectNeighbourShipCells(cell){
    let neighbourCells = []
    // checking if top cell is a hit
    if(cell.x-1 >= 0 && grid.cellByXY(cell.x - 1, cell.y).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x - 1, cell.y))
    }
    // checking if bottom cell is a hit
    if(cell.x+1 < 10 && grid.cellByXY(cell.x + 1, cell.y).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x + 1, cell.y))
    }
    // checking if left cell is a hit
    if(cell.y-1 >= 0 && grid.cellByXY(cell.x, cell.y - 1).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x, cell.y - 1))
    }
    // checking if right cell is a hit
    if(cell.y+1 < 10 && grid.cellByXY(cell.x, cell.y + 1).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x, cell.y + 1))
    }
    return neighbourCells
}

// checks if adding the cell would enclose a ship with invalid length
function isEnclosingInvalidShip(cell){
    // corner neighbour cells of the cell
    let cornerNeighbours = collectFreeCornerNeighbours(cell)
    
    // checking if a free corner neighbour would enclose a ship with invalid length
    tempShipsToSinkPerLength = fleet.countShipsToSinkPerLength()
    for(let cornerCell of cornerNeighbours){
        for(let ship of fleet.notSunkenShips()){
            // filtering ships that have a cell that is neighbour of the added cell,
            // because those ships would be merged with the added cell's ship
            if(ship.cells.some(shipCell => Math.abs(shipCell.x - cell.x) + Math.abs(shipCell.y - cell.y) <= 1)){
                continue
            }

            let freeNeighbours = getFreeNeighboursOfShip(ship.cells)
            if (freeNeighbours.length == 1 && 
                freeNeighbours[0].id == cornerCell.id){
                if(tempShipsToSinkPerLength[ship.length] == 0){
                    return false
                } else{
                    tempShipsToSinkPerLength[ship.length] -= 1
                }
            }
        }
    }
    return true
}

function collectFreeCornerNeighbours(cell){
    let freeCornerNeighbours = []
    if(cell.x-1 >= 0 && cell.y-1 >= 0 && grid.cellByXY(cell.x - 1, cell.y - 1).state == "free"){
        freeCornerNeighbours.push(grid.cellByXY(cell.x - 1, cell.y - 1))
    }
    if(cell.x-1 >= 0 && cell.y+1 < 10 && grid.cellByXY(cell.x - 1, cell.y + 1).state == "free"){
        freeCornerNeighbours.push(grid.cellByXY(cell.x - 1, cell.y + 1))
    }
    if(cell.x+1 < 10 && cell.y-1 >= 0 && grid.cellByXY(cell.x + 1, cell.y - 1).state == "free"){
        freeCornerNeighbours.push(grid.cellByXY(cell.x + 1, cell.y - 1))
    }
    if(cell.x+1 < 10 && cell.y+1 < 10 && grid.cellByXY(cell.x + 1, cell.y + 1).state == "free"){
        freeCornerNeighbours.push(grid.cellByXY(cell.x + 1, cell.y + 1))
    }
    return freeCornerNeighbours
}