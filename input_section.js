//
function setupInput() {
    window.addEventListener("click", onClickOnCell)
}

// event handler for clicks on cells
async function onClickOnCell(element) {
    let clickedElement = element.target
    // if clicked on a cell
    if(clickedElement.classList[0] == "cell"){
        let cell = getClickedCell(clickedElement.id)
        // setting the new state of the cell
        if(cell.state == "free" ){
            switch(selectedState){
                case "miss":
                    isSuccessful = setMissState(cell)
                    if(isSuccessful == -1){
                        return
                    }
                    break
                case "hit":
                    isSuccessful = setHitState(cell)
                    if(isSuccessful == -1){
                        return
                    }
                    break
                case "sunken":
                    isSuccessful = setSunkenState(cell)
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
        // calculating the new cell values and creating recommendation for next click
        let recommendation
        if (fleet.notSunkenShips().length > 0){
            let shipNeighbours = []
            for (let tCell of grid.freeCells){
                if (collectNeighbourShipCells(tCell).length > 0){
                    shipNeighbours.push(tCell)
                }
            }
            recommendation = createRecommendation(shipNeighbours)
        }
        else {
            recommendation = createRecommendation(grid.freeCells)
        }
        
        if (recommendation !== -1){
            recommendation.color = "#AA2222"
        }
    }
}

// getting clicked cell object
function getClickedCell(id){
    return grid.cell(id)
}

// setting the state of a cell to "miss" and saving history
function setMissState(cell){
    cell.state = "miss"

    // does it enclose a ship
    // looking at the neighbour cells of the cell, if they are in a ship
    let neighbourCells = collectNeighbourShipCells(cell)
    tempShipsToSinkPerLength = fleet.countShipsToSinkPerLength()
    for(let element of neighbourCells){
        let ship = searchShipByCell(element)
        let freeNeighbourCells = getFreeNeighboursOfShip(ship.cells)
        if(freeNeighbourCells.length == 0){
            if(tempShipsToSinkPerLength[ship.length] == 0){
                cell.state = "free"
                calculateCellValues([cell])
                console.error("The cell encloses a ship with invalid length " + ship.length)
                return -1
            } else{
                tempShipsToSinkPerLength[ship.length] -= 1
            }
        }
    }
    setMissHistory(cell)

    return 0
}

function setMissHistory(cell){
    lastCellIds = []
    lastCellIds[0] = cell.id

    let neighbourCells = collectNeighbourShipCells(cell)
    // if it passed the checks, see if it encloses a ship that needs to be sunk
    sinkEnclosedShips(neighbourCells)
    
}

// setting the state of a cell to "hit" and saving history
function setHitState(cell){
    if(cell.value === 0 ){
        console.error("Can't add a hit to a cell with value 0")
        return -1
    }

    cell.state = "hit"
    // adding cell to a ship
    let ship = addCellToShip(cell, "hit")
    // checking if cell added properly
    if(ship == -1){
        // there was an error
        // setting everything back
        cell.state = "free"
        calculateCellValues([cell])
        return -1
    }

    // sink the ship if it can't be longer
    if (fleet.maxShipToSinkLength() == ship.length || getFreeNeighboursOfShip(ship.cells).length == 0){
        sinkShip(ship)
        setSunkenHistory(ship.cells, cell)
        return
    }

    // see if the hit cell has a free corner neighbour that encloses a ship that needs to be sunk
    neighbourShipCells = []
    for(let cornerCell of collectFreeCornerNeighbours(cell)){
        neighbourShipCells.push(...collectNeighbourShipCells(cornerCell))
    }

    setHitHistory(cell)

    sinkEnclosedShips(neighbourShipCells)

    return 0
}

// setting the state of a cell and all other cells in the ship to "sunken" and saving history
function setSunkenState(cell){
    // setting the cell into a hit first to get the hit look
    cell.state = "hit"
    // adding cell to a ship
    let ship = addCellToShip(cell, "sunken")
    if(ship == -1){
        // there was an error, setting everything back
        cell.state = "free"
        calculateCellValues([cell])
        return -1
    }
    
    sinkShip(ship)
    setSunkenHistory(ship.cells, cell)

    return 0
}

function sinkShip(ship){
    // setting the cells of the ship to "sunken"
    let shipCells = ship.cells
    for(let element of shipCells){
        element.state = "sunken"
    }
    // setting the ship state to "sunken"
    ship.isSunken = true

    // if there is a ship with maximum length, then sink it
    let maxLengthShip = fleet.notSunkenShips().length > 0 ?fleet.notSunkenShips().reduce(
        (maxShip, currentShip) => !maxShip || currentShip.length > maxShip.length ? currentShip : maxShip, null)
        : {}
    if(fleet.maxShipToSinkLength() == maxLengthShip.length){
        sinkShip(maxLengthShip)
    }
}

function setHitHistory(cell){
    //adding cell to cell history
    lastCellIds = []
    lastCellIds[0] = cell.id
    // turn corner neighbour cells into a miss, because they can't be in a ship
    freeCornerNeighbours = collectFreeCornerNeighbours(cell)
    for(let element of freeCornerNeighbours){
        element.state = "miss"
        lastCellIds.push(element.id)
    }
}

function setSunkenHistory(shipCells, cell){
    // setting the side and corner neighbour cells to a miss
    // and adding the clicked cell and the misses to lastCellIds
    lastCellIds = []
    lastCellIds[0] = cell.id

    // collecting all free neighbour cells of sunken ships
    let sunkenShipsWithFreeNeighbours = fleet.sunkenShipsWithFreeNeighbours()
    let freeNeighbourCells = getFreeNeighboursOfShip(shipCells)
    for(let ship of sunkenShipsWithFreeNeighbours){
        freeNeighbourCells.push(...getFreeNeighboursOfShip(ship.cells))
    }

    // setting every free neighbour cell to a miss and adding it to history
    for(let element of freeNeighbourCells){
        element.state = "miss"
        lastCellIds.push(element.id)
    }
}

function sinkEnclosedShips(neighbourCells){
    for(let element of neighbourCells){
        let ship = searchShipByCell(element)
        let freeNeighbourCells = getFreeNeighboursOfShip(ship.cells)
        if(freeNeighbourCells.length == 0){
            if(fleet.countShipsToSinkPerLength()[ship.length] > 0){
                sinkShip(ship)
            }
        }
    }
}