/* let allowedShipCount = [4,3,2,1] // number of allowed ships with length index+1
let maxShipLength = allowedShipCount.length // longest allowed shiplength

let undiscoveredShipCount = [4,3,2,1] // number of undiscovered ships with length index+1
let maxUndiscoveredShipLength = undiscoveredShipCount.length */

let fleet = new Fleet()

function calculateCellValues(){

}

// adds a new cell to a neighbour ship, or if there isn't any, creates a new one
// returns the ship, or -1 if there is an error
function addCellToShip(cell){
    let ship1
    let ship2
    let neighbourCells = []
    let neighbourHitCount = 0
    // searching through neighbour cells if they are in a ship,
    // if so, the cell can be added to that
    // checking if top cell is a hit
    if(cell.x-1 >= 0 && grid.cellByXY(cell.x - 1, cell.y).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x - 1, cell.y))
        neighbourHitCount += 1
    }
    // checking if bottom cell is a hit
    if(cell.x+1 < 10 && grid.cellByXY(cell.x + 1, cell.y).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x + 1, cell.y))
        neighbourHitCount += 1
    }
    // checking if left cell is a hit
    if(cell.y-1 >= 0 && grid.cellByXY(cell.x, cell.y - 1).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x, cell.y - 1))
        neighbourHitCount += 1
    }
    // checking if right cell is a hit
    if(cell.y+1 < 10 && grid.cellByXY(cell.x, cell.y + 1).state == "hit"){
        neighbourCells.push(grid.cellByXY(cell.x, cell.y + 1))
        neighbourHitCount += 1
    }
    // check how many hit neighbours the cell has
    switch(neighbourHitCount){
        case 0: // if there are no neighbour ships, then create a new
            ship1 = fleet.newShip()
            break
        case 1: // search the ship that belongs to the neighbour
            ship1 = searchShipByCell(neighbourCells[0])
            break
        case 2: // search the two neighbour ships
            ship1 = searchShipByCell(neighbourCells[0])
            ship2 = searchShipByCell(neighbourCells[1])
            break
        default:
            console.error("Error: There are too many neighbour ships of cell: " + cell.id)
            return -1
    }
    // check if ship length isn't bigger than allowed
    // add cell to the selected ship
    ship1.addCell(cell)

    // merge ships if there are neighbours
    // check if ship1.length + ship2.length isn't greater than the max allowed length
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
    console.log("Bounding box:")
    console.log(boundingBox)
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
    console.log("Free cells:")
    console.log(freeCells)
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