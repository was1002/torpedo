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