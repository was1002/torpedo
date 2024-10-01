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