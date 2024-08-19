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
const sunkButton = document.getElementById("sunk")
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
let lastState = "free"
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
        let tmp_state = cell.state
        if(tmp_state == "free" ){
            lastCellIds = []
            switch(selectedState){
                case "miss":
                    cell.state = selectedState
                    lastCellIds[0] = clickedElement.id
                    break
                case "hit":
                    cell.state = selectedState
                    // adding cell to a ship
                    addCellToShip(cell)
                    //adding cell to cell history
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
                case "sunk":
                    // setting the cell into a hit first to get the hit look
                    cell.state = "hit"
                    // adding cell to a ship
                    let ship = addCellToShip(cell)
                    // setting the cells of the ship to "sunk"
                    let shipCells = ship.cells
                    for(let element of shipCells){
                        element.state = selectedState
                    }
                    // setting the ship state to "sunken"
                    ship.isSunken = true
                    // setting the side and corner neighbour cells to a miss
                    // and adding the clicked cell and the misses to lastCellIds
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
            lastState = tmp_state
            console.log("lastCellIds: " + lastCellIds)
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

// "sunk" button onclick function
function setSunk(){
    resetButtons()
    setButtonStyle(sunkButton)
    selectedState = "sunk"
}

// "undo" button onclick function
function setUndo(){
    let lastCell = grid.cell(lastCellIds[0])
    switch(lastCell.state){
        case "miss":
            lastCell.state = "free"
            break
        case "hit":
            // set back previous ship data
            setPreviousShipData()
            // set back previous states
            for(let i of lastCellIds){
                grid.cell(i).state = "free"
            }
            break
        case "sunk":
            //getting ship cells
            let shipCells = getShipCellsBasedOnCell(lastCell)
            //setting ship cells to hit
            for(let i of shipCells){
                i.state = "hit"
                console.log(i)
            }
            //setting lastCellIds to free
            for(let i of lastCellIds){
                grid.cell(i).state = "free"
            }
            // set back previous ship data
            setPreviousShipData()
            break
    }
    calculateCellValues()
}

// "newGame" button onclick function
function setNewGame(){
    lastState = "free"
    lastCellIds = [0]
    // discoveredShips = []
    shipLength = []
    for(let i=0; i<grid.size*grid.size;i++){
        grid.cell(i).state = "free"
    }
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
/* let discoveredShipsHistory = []
let shipLength = [] */

function calculateCellValues(){

}

function getShipCellsBasedOnCell(shipCell){
    let shipIndex = searchShipByCell(shipCell)
    let cellsOfShip = []
    for(let id of discoveredShips[shipIndex]){
        cellsOfShip.push(grid.cell(id))
    }
    return cellsOfShip
}

function addCellToShip(cell){
    // saving current ship data into a temporary variable
//    discoveredShipsHistory = discoveredShips.map((ship) => ship.slice())

    let ship
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
            ship = fleet.newShip()
            break
        case 1: // search the ship that belongs to the neighbour
            ship = searchShipByCell(neighbourCells[0])
            break
        case 2: // search the two neighbour ships
            ship = searchShipByCell(neighbourCells[0])
            ship2 = searchShipByCell(neighbourCells[1])
            break
        default:
            console.error("Error: There are too many neighbour ships of cell: " + cell.id)
    }
    // check if ship length isn't bigger than allowed
    // add cell to the selected ship
    ship.addCell(cell)

    // merge ships if there are neighbours
    // check if ship.length + ship2.length isn't greater than the max allowed length
    if(neighbourHitCount == 2){
        ship = fleet.mergeShips(ship, ship2)
    }
    return ship
}

function setPreviousShipData(){
    // reset to the previous state of the ships
    discoveredShips = discoveredShipsHistory.map((ship) => ship.slice())
    console.log("discoveredShips:")
    console.log(discoveredShips)
}

function searchShipByCell(shipCell){
    // returns the ship or undefined if the cell is not in a ship
    return fleet.ships.find((ship) => ship.isCellInShip(shipCell))
}

function getFreeNeighboursOfShip(shipCells){
    // calculating the cell coordinate bounds of the neighbours
    let shipNeighbourMinMax = {
        Xmin: Math.max(Math.min(...shipCells.map(cell => cell.x)) - 1, 0),
        Xmax: Math.min(Math.max(...shipCells.map(cell => cell.x)) + 1, 9),
        Ymin: Math.max(Math.min(...shipCells.map(cell => cell.y)) - 1, 0),
        Ymax: Math.min(Math.max(...shipCells.map(cell => cell.y)) + 1, 9)
    }
    console.log(shipNeighbourMinMax)
    // collecting free cells in bounding box
    let freeCells = []
    for(let i = shipNeighbourMinMax.Xmin; i<=shipNeighbourMinMax.Xmax; i++ ){
        for(let j = shipNeighbourMinMax.Ymin; j<=shipNeighbourMinMax.Ymax; j++){
            let neighbourCell = grid.cellByXY(i,j)
            if(neighbourCell.state == "free"){
                freeCells.push(neighbourCell)
            }
        }
    }
    console.log(freeCells)
    return freeCells
}