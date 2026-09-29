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
                    setMissState(cell, clickedElement)
                    break
                case "hit":
                    isSuccessful = setHitState(cell, clickedElement)
                    if(isSuccessful == -1){
                        return
                    }
                    break
                case "sunken":
                    isSuccessful = setSunkenState(cell, clickedElement)
                    if(isSuccessful == -1){
                        return
                    }
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

// setting the state of a cell to "miss" and saving history
function setMissState(cell, clickedElement){
    cell.state = "miss"
    lastCellIds = []
    lastCellIds[0] = clickedElement.id
}

// setting the state of a cell to "hit" and saving history
function setHitState(cell, clickedElement){
    cell.state = "hit"
    // adding cell to a ship
    let isCellAdded = addCellToShip(cell)
    // checking if cell added properly
    if(isCellAdded == -1){
        // there was an error
        // setting everything back
        cell.state = "free"
        return -1
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
}

// setting the state of a cell and all other cells in the ship to "sunken" and saving history
function setSunkenState(cell, clickedElement){
    // setting the cell into a hit first to get the hit look
    cell.state = "hit"
    // adding cell to a ship
    let ship = addCellToShip(cell)
    if(ship == -1){
        // there was an error, setting everything back
        cell.state = "free"
        return -1
    }
    // setting the cells of the ship to "sunken"
    let shipCells = ship.cells
    for(let element of shipCells){
        element.state = "sunken"
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
}