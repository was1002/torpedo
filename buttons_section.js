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
function setUndo(turnOffRecommendation = false){
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
                fleet.unmergeShip(lastShip, lastCell)
            }
            // remove the last cell from the ship
            lastShip.removeCell(lastCell)
        }
    }

    // check if there are sunken ships that are not fully enclosed by misses and unsunk them
    let sunkenShipsWithFreeNeighbours = fleet.sunkenShipsWithFreeNeighbours()
    for(let ship of sunkenShipsWithFreeNeighbours){
        ship.isSunken = false
        for(let cell of ship.cells){
            cell.state = "hit"
        }
    }
    if (turnOffRecommendation === true){
        calculateCellValues(grid.freeCells)
    }
    else {
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
            if (lastRecommendation.state === "free"){
                lastRecommendation.cellElement.style.setProperty("background-image", "")
            }
            recommendation.cellElement.style.setProperty("background-image", "url(\"./images/crosshair_middle.png\")")
            lastRecommendation = recommendation
        }
    }
}

// "newGame" button onclick function
function setNewGame(){
    lastCellIds = [0]
    for(let i=0; i<grid.size*grid.size;i++){
        grid.cell(i).state = "free"
    }
    fleet.removeAllShips()
    calculateCellValues(grid.freeCells)

    let recommendation = createRecommendation(grid.freeCells)
    if (recommendation !== -1){
        if (lastRecommendation.state === "free"){
            lastRecommendation.cellElement.style.setProperty("background-image", "")
        }
        recommendation.cellElement.style.setProperty("background-image", "url(\"./images/crosshair_middle.png\")")
        lastRecommendation = recommendation
    }
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