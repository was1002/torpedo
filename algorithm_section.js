let fleet = new Fleet()

function calculateCellValues(cells){
    let freeCells = cells.filter((cell) => cell.state == "free")
    let weights = fleet.countShipsToSinkPerLength()
    // calculating for every cell
    for(let cell of freeCells){
        cell.value = 0
        // calculating the number of possible placements for every ship length at that cell
        for(let shipLength = 1; shipLength <= 4; shipLength++){
            if (weights[shipLength] == 0){
                continue
            }
            let horizontalOptions = countPlacement(cell, shipLength, "horizontal")
            let verticalOptions = 0
            if (!(shipLength == 1)){ // if shipLength is 1, vertical and horizontal are the same
                verticalOptions = countPlacement(cell, shipLength, "vertical")
            }
            cell.value += (horizontalOptions + verticalOptions) * weights[shipLength]
        }
    }

    // looking for cells with value 0, and setting them to miss, because no ship can be there
    for(let fCell of freeCells){
        if (fCell.value === 0 ){
            fCell.state = "miss"
            lastCellIds.push(fCell.id)
            sinkEnclosedShips(collectNeighbourShipCells(fCell))
        }
    }
    // updating the array of free cells and setting their colors
    freeCells = cells.filter((cell) => cell.state == "free")
    updateColors(freeCells)
}

// placement options for a specific ship in one direction
function countPlacement(cell, shipLength, direction) {
    // initialize variables based on direction of placement
    let cellCoord1
    let cellCoord2
    if (direction == "horizontal"){
        cellCoord1 = cell.x
        cellCoord2 = cell.y
    } else if (direction == "vertical"){
        cellCoord1 = cell.y
        cellCoord2 = cell.x
    } else {
        console.error("Invalid direction value. Valid options: horizontal, vertical")
        return 0
    }

    let options = 0;
    // iterating through all possible placements (shifting along the selected direction) of that specific ship
    for (let i = 0; i < shipLength; i++) {
        // collecting the cells that would be occupied by the ship with i offset
        let shipCells = []
        for (let j = 0; j < shipLength; j++) {
            let coord1 = cellCoord1 + j - i
            let coord2 = cellCoord2
            if (coord1 < 0 || coord1 >= 10) {
                break
            }

            let shipCell
            if (direction == "horizontal"){
                shipCell = grid.cellByXY(coord1, coord2)
            } else if (direction == "vertical"){
                shipCell = grid.cellByXY(coord2, coord1)
            }
            if (shipCell.state === "miss" || shipCell.state === "sunken") {
                break
            }

            shipCells.push(shipCell)
        }
        // if the ship length isn't maximal, it can't be placed there
        if (shipCells.length !== shipLength) {
            continue
        }

        // getting all neighbour cells of the shipCells and checking if they are invalid
        let neighbourCells = getNeighboursOfShip(shipCells)
        let isInvalidCell = false
        for (let neighbourCell of neighbourCells) {
            if (neighbourCell.state === "hit" || neighbourCell.state === "sunken") {
                isInvalidCell = true
                break
            }
        }
        if (isInvalidCell){
            continue
        }
        
        // checking if the ship would enclose another with invalid length
        let isInvalidShipLength = false
        for (let neighbourCell of neighbourCells){
            // collecting ship cells that touch the bounding box of the ship
            let neighbourShipCells = collectNeighbourShipCells(neighbourCell)
            // removing the ships own cells to leave only ship cells from the outside
            let validNeighbourShipCells = neighbourShipCells.filter((cell) => !neighbourCells.includes(cell))
            // checking if one of the ships would be enclosed with invalid length
            for (let vCell of validNeighbourShipCells){
                // finding the ship
                vShip = searchShipByCell(vCell)
                let freeNeighboursOfShip = getFreeNeighboursOfShip(vShip.cells)
                if (freeNeighboursOfShip.length === 1 &&
                        freeNeighboursOfShip[0] == neighbourCell &&
                        fleet.countShipsToSinkPerLength()[vShip.length] == 0){
                    isInvalidShipLength = true
                    break
                }
            }

            if (isInvalidShipLength){
                break
            }
        }
        if (isInvalidShipLength){
            continue
        }

        options++
    }

    return options
}

// recommends a cell to click from the given cells
function createRecommendation(cells){
    // calculation of values so they are up to date
    calculateCellValues(grid.freeCells)

    let maxValue = 0
    let maxValueCells = []
    for (let cell of cells){
        if (cell.value > maxValue){
            maxValue = cell.value
        }
    }

    if (maxValue === 0){
        console.error("Maximum value is 0, can't add any ships.")
        return -1
    }

    for (let cell of cells){
        if (cell.value == maxValue){
            maxValueCells.push(cell)
        }
    }

    if (maxValueCells.length === 0){
        console.error("Recommendation error: no cell found with max value " + maxValue)
        return -1
    }
    // only one cell with max value, it is the recommended cell
    else if(maxValueCells.length === 1){ 
        return maxValueCells[0]
    }
    // multiple cells with max value, selecting between them
    else {
        // the current sum of all values on the grid
        let currentValueSum = grid.freeCells.reduce((sum,curr)=>sum+curr.value,0)

        // calculating a ratio for the reduction weights: remaining hits/all free cells = hit probability
        let weightRatio = 0
        let notSunkenShips = fleet.countShipsToSinkPerLength()
        for (let i = 1; i<=4; i++){
            weightRatio += notSunkenShips[i] * i
        }
        weightRatio /= grid.freeCells.length

        // calculating for each cell how much it would reduce the sum of the values if clicked
        let maxCellReductions = Array(maxValueCells.length)
        for (let i=0; i < maxValueCells.length; i++){
            let maxCell = maxValueCells[i]
            let missReduction = calculateReduction(maxCell, currentValueSum, "miss", weightRatio)
            let hitReduction = calculateReduction(maxCell, currentValueSum, "hit", weightRatio)
            let sunkenReduction = calculateReduction(maxCell, currentValueSum, "sunken", weightRatio)

            maxCellReductions[i] = missReduction + hitReduction + sunkenReduction
        }
        console.log("Reductions:\n" + maxCellReductions)
        // selecting the ones with the most reduction
        let mostReduction = maxCellReductions[0]
        let mostReductionIdx = [0]
        for ( let i = 1; i < maxCellReductions.length; i++){
            if (maxCellReductions[i] > mostReduction){
                mostReduction = maxCellReductions[i]
                mostReductionIdx = [i]
            }
            else if (maxCellReductions[i] === mostReduction){
                mostReductionIdx.push(i)
            }
        }
        // if there is only one with the most reduction
        if (mostReductionIdx.length === 1){
            return maxValueCells[mostReductionIdx[0]]
        }
        // if there is more then one with the most reduction, selecting a random cell
        else {
            let recommendedCells = []
            for ( let i = 0; i < mostReductionIdx.length; i++){
                recommendedCells.push(maxValueCells[mostReductionIdx[i]])
            }
            return recommendedCells[Math.floor(Math.random() * recommendedCells.length)]
        }
    }
}

// weighted calculation of the reduction
function calculateReduction(cell, currentSum, type, weightRatio){
    let lastCellIdsCopy = lastCellIds
    let shipLength = 0
    let cellValue = cell.value
    let reductionWeight = 0

    let isSuccessful = -1

    switch(type){
        case "miss":
            isSuccessful = setMissState(cell)
            if(isSuccessful != -1){
                reductionWeight = 1 - weightRatio
            }
            break
        case "hit":
            isSuccessful = setHitState(cell)
            if(isSuccessful != -1){
                shipLength = searchShipByCell(cell).length
                reductionWeight = weightRatio * (cellValue - fleet.countShipsToSinkPerLength()[shipLength]) / cellValue
            }
            break
        case "sunken":
            isSuccessful = setSunkenState(cell)
            if(isSuccessful != -1){
                shipLength = searchShipByCell(cell).length
                reductionWeight = weightRatio * (fleet.countShipsToSinkPerLength()[shipLength] + 1) / cellValue
            }
            break
    }
    calculateCellValues(grid.freeCells)
    let newSum = grid.freeCells.reduce((sum,curr)=>sum+curr.value,0)

    // resetting everything
    setUndo(true)

    lastCellIds = lastCellIdsCopy
    return reductionWeight * (currentSum - newSum)
}

// setting the color of the cells based on their values
function updateColors(cells){
    // determine value range
    let minValue = Math.min(...cells.map((cell)=>cell.value))
    let maxValue = Math.max(...cells.map((cell)=>cell.value))
    
    // initializing variables for cells that have ship neighbours
    let firstNeighbour = true
    let neighbourCells = []
    let neighbourMinValue = 0
    let neighbourMaxValue = 0
    for(let cell of cells){
        // if the cell has a ship neighbour it gets a different color
        if (collectNeighbourShipCells(cell).length > 0){
            if(firstNeighbour){
                firstNeighbour = false
                neighbourMinValue = cell.value
                neighbourMaxValue = cell.value
                neighbourCells.push(cell)
            } else {
                neighbourMinValue = cell.value < neighbourMinValue ? cell.value : neighbourMinValue
                neighbourMaxValue = cell.value > neighbourMaxValue ? cell.value : neighbourMaxValue
                neighbourCells.push(cell)
            }
            continue
        }

        // all normal cells get their color based on the interpolation from their value between min and max value
        let proportion = maxValue == minValue ? 0 : Math.pow((cell.value - minValue)/(maxValue - minValue), 2)
        let colorNumR = Math.floor(CELL_COLOR_NUM[0] + proportion * (CELL_MAXCOLOR_NUM[0] - CELL_COLOR_NUM[0]))
        let colorNumG = Math.floor(CELL_COLOR_NUM[1] + proportion * (CELL_MAXCOLOR_NUM[1] - CELL_COLOR_NUM[1]))
        let colorNumB = Math.floor(CELL_COLOR_NUM[2] + proportion * (CELL_MAXCOLOR_NUM[2] - CELL_COLOR_NUM[2]))
        cell.color = '#' + colorNumR.toString(16).padStart(2, '0').toUpperCase() +
                           colorNumG.toString(16).padStart(2, '0').toUpperCase() +
                           colorNumB.toString(16).padStart(2, '0').toUpperCase()
    }

    // ship neighbour cells get their colors
    for(let nCell of neighbourCells){
        let proportion = neighbourMaxValue == neighbourMinValue ? 1 : Math.pow((nCell.value - neighbourMinValue)/(neighbourMaxValue - neighbourMinValue), 2)
        let colorNumR = Math.floor(CELL_COLOR_NUM[0] + proportion * (CELL_HIT_NEIGHBOUR_NUM[0] - CELL_COLOR_NUM[0]))
        let colorNumG = Math.floor(CELL_COLOR_NUM[1] + proportion * (CELL_HIT_NEIGHBOUR_NUM[1] - CELL_COLOR_NUM[1]))
        let colorNumB = Math.floor(CELL_COLOR_NUM[2] + proportion * (CELL_HIT_NEIGHBOUR_NUM[2] - CELL_COLOR_NUM[2]))
        nCell.color = '#' + colorNumR.toString(16).padStart(2, '0').toUpperCase() +
                            colorNumG.toString(16).padStart(2, '0').toUpperCase() +
                            colorNumB.toString(16).padStart(2, '0').toUpperCase()
    }
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

// collect all of the neighbour and corner neighbour cells of a ship
function getNeighboursOfShip(shipCells){
    // calculating the cell coordinate bounds of the neighbours
    let boundingBox = {
        Xmin: Math.max(Math.min(...shipCells.map(cell => cell.x)) - 1, 0),
        Xmax: Math.min(Math.max(...shipCells.map(cell => cell.x)) + 1, 9),
        Ymin: Math.max(Math.min(...shipCells.map(cell => cell.y)) - 1, 0),
        Ymax: Math.min(Math.max(...shipCells.map(cell => cell.y)) + 1, 9)
    }
    
    // collecting free cells in bounding box
    let neighbourCells = []
    // searches the whole bounding box and adds the cell if it is not part of the ship
    for(let i = boundingBox.Xmin; i<=boundingBox.Xmax; i++ ){
        for(let j = boundingBox.Ymin; j<=boundingBox.Ymax; j++){
            let neighbourCell = grid.cellByXY(i,j)
            if (!shipCells.includes(neighbourCell)){
                neighbourCells.push(neighbourCell)
            }
        }
    }
    
    return neighbourCells
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
            if(neighbourCell.state == "free" && !shipCells.includes(neighbourCell)){
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