import Grid from "./grid.js"
import Fleet from "./fleet.js"

//creating gameboard
const gameBoard = document.getElementById("game-board")
//creating grid with cells
const grid = new Grid(gameBoard)

//initializing the buttons
    // getting button elements
const missButton = document.getElementById("miss")
const hitButton = document.getElementById("hit")
const sunkButton = document.getElementById("sunken")
const undoButton = document.getElementById("undo")
const newGameButton = document.getElementById("newGame")
    // setting button functionalities
missButton.onclick = setMiss
hitButton.onclick = setHit
undoButton.onclick = setUndo
sunkButton.onclick = setSunk
newGameButton.onclick = setNewGame
    // selecting default button
let selectedState = "miss"
setButtonStyle(missButton)

// initializing cell "history"
let lastCellIds = [0]

//handling clicks on cells
setupInput()

/*
----------- Input section --------------------------------
*/

//
function setupInput() {
        window.addEventListener("click", onClickOnCell)
}

// event handler for clicks on cells
async function onClickOnCell(element) {
    let clickedElement = element.originalTarget
    // if clicked on a cell
    if(clickedElement.classList[0] == "cell"){
        let cell = getClickedCell(clickedElement.id)
        // setting the new state of the cell
        if(cell.state == "free" ){
            switch(selectedState){
                case "miss":
                    cell.state = selectedState
                    lastCellIds = []
                    lastCellIds[0] = clickedElement.id
                    break
                case "hit":
                    cell.state = selectedState
                    // adding cell to a ship
                    let isCellAdded = addCellToShip(cell)
                    // checking if cell added properly
                    if(isCellAdded == -1){
                        // there was an error
                        // setting everything back
                        cell.state = "free"
                        return
                    }
                    //adding cell to cell history
                    lastCellIds = []
                    lastCellIds[0] = clickedElement.id
                    // turn corner neighbour cells into a miss, because they can't be in a ship
                    if(cell.x-1 >= 0 && cell.y-1 >= 0 && grid.cellByXY(cell.x - 1, cell.y - 1).state == "free"){
                        grid.cellByXY(cell.x - 1, cell.y - 1).state = "miss"
                        lastCellIds.push(grid.cellByXY(cell.x - 1, cell.y - 1).id)
                    }
                    if(cell.x-1 >= 0 && cell.y+1 < 10 && grid.cellByXY(cell.x - 1, cell.y + 1).state == "free"){
                        grid.cellByXY(cell.x - 1, cell.y + 1).state = "miss"
                        lastCellIds.push(grid.cellByXY(cell.x - 1, cell.y + 1).id)
                    }
                    if(cell.x+1 < 10 && cell.y-1 >= 0 && grid.cellByXY(cell.x + 1, cell.y - 1).state == "free"){
                        grid.cellByXY(cell.x + 1, cell.y - 1).state = "miss"
                        lastCellIds.push(grid.cellByXY(cell.x + 1, cell.y - 1).id)
                    }
                    if(cell.x+1 < 10 && cell.y+1 < 10 && grid.cellByXY(cell.x + 1, cell.y + 1).state == "free"){
                        grid.cellByXY(cell.x + 1, cell.y + 1).state = "miss"
                        lastCellIds.push(grid.cellByXY(cell.x + 1, cell.y + 1).id)
                    }
                    break
                case "sunken":
                    // setting the cell into a hit first to get the hit look
                    cell.state = "hit"
                    // adding cell to a ship
                    let ship = addCellToShip(cell)
                    // setting the cells of the ship to "sunken"
                    let shipCells = ship.cells
                    for(let element of shipCells){
                        element.state = selectedState
                    }
                    // setting the ship state to "sunken"
                    ship.isSunken = true
                    // setting the side and corner neighbour cells to a miss
                    // and adding the clicked cell and the misses to lastCellIds
                    lastCellIds = []
                    lastCellIds[0] = clickedElement.id
                    let freeNeighbourCells = getFreeNeighboursOfShip(shipCells)
                    for(let element of freeNeighbourCells){
                        element.state = "miss"
                        lastCellIds.push(element.id)
                    }
                    console.log("Ship:")
                    console.log(ship)
                    break
            }
            console.log("lefutottam")
            console.log("lastCellIds: " + lastCellIds)

            console.log("Fleet: ")
            console.log(fleet)
        }
    }
    // calculating the new cell values
    calculateCellValues()
}

// getting clicked cell object
function getClickedCell(id){
    return grid.cell(id)
}


/*
---------- Buttons section ---------------------------------
*/

// "miss" button onclick function
function setMiss(){
    resetButtons()
    setButtonStyle(missButton)
    selectedState = "miss"
}

// "hit" button onclick function
function setHit(){
    resetButtons()
    setButtonStyle(hitButton)
    selectedState = "hit"
}

// "sunken" button onclick function
function setSunk(){
    resetButtons()
    setButtonStyle(sunkButton)
    selectedState = "sunken"
}

// "undo" button onclick function
function setUndo(){
    // get last clicked cell and the ship that it's in
    let lastCell = grid.cell(lastCellIds[0])
    let lastShip = searchShipByCell(lastCell)
    // if the ship is sunken that means it sunk with the last cell
    if(lastShip != undefined && lastShip.isSunken == true){
        // set to not sunken
        lastShip.isSunken = false
        // set the cells to hit instead of sunken
        for(let shipCell of lastShip.cells){
            shipCell.state = "hit"
        }
    }
    // set all last occupied cells to free
    for(let i of lastCellIds){
        grid.cell(i).state = "free"
    }
    // checking if there is a modified ship (= last cell not a miss)
    if(lastShip != undefined){
        // check if the ship needs to be deleted
        if(lastShip.length == 1){
            fleet.removeShip(lastShip)
        } else {
            // are there cells with ID both smaller and greater
            // than the last added cell's
            if(isMiddleCell(lastShip,lastCell)){
                // unmerge the ships
                let unmergedShip = fleet.newShip()
                for(let cell of lastShip.cells){
                    // if the cell id is bigger than the last cell's
                    // add to a new ship and delete from this
                    if(cell.id > lastCell.id){
                        unmergedShip.addCell(cell)
                        lastShip.removeCell(cell)
                    }
                }
            }
            // remove the last cell from the ship
            lastShip.removeCell(lastCell)
        }
    }

    console.log("Fleet: ")
    console.log(fleet)

    calculateCellValues()
}

// "newGame" button onclick function
function setNewGame(){
    lastCellIds = [0]
    for(let i=0; i<grid.size*grid.size;i++){
        grid.cell(i).state = "free"
    }
    fleet.removeAllShips()
    calculateCellValues()
}

// setting button as "selected"
function setButtonStyle(button){
    button.classList.add('selectedTool')
}

// setting all buttons as "unselected"
function resetButtons(){
    missButton.classList.remove('selectedTool')
    hitButton.classList.remove('selectedTool')
    sunkButton.classList.remove('selectedTool')
}

/*
-------------- Algorithm Section ----------------------------------
*/

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