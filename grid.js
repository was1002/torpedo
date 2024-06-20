// declaring constants that are used in css
const GRID_SIZE = 10
const CELL_SIZE = 8
const CELL_GAP = 0.5
const CELL_COLOR = "#AAA"

export default class Grid {
    #cells
    #size

    //creating grid
    constructor(gridElement) {
        // setting grid appearance
        gridElement.style.setProperty("--grid-size", GRID_SIZE)
        gridElement.style.setProperty("--cell-size", `${CELL_SIZE}vmin`)
        gridElement.style.setProperty("--cell-gap", `${CELL_GAP}vmin`)
        // adding cells to the grid
        this.#cells = createCellElements(gridElement).map((cellElement, index) => {
            return new Cell(cellElement, index % GRID_SIZE, Math.floor(index / GRID_SIZE), "free", index)
        })
        this.#size = GRID_SIZE
    }

    //get gridsize
    get size(){
        return this.#size
    }

    // get cells that are free to shoot at
    get freeCells(){
        return this.#cells.filter(cell => cell.state == "free")
    }

    // get cells that cannot be shot at
    get inactiveCells(){
        return this.#cells.filter(cell => (cell.state == "miss") || (cell.state == "hit"))
    }

    cell(id){
        return this.#cells[id]
    }

    cellByXY(x,y){
        return this.#cells[x+10*y]
    }
    
}

export class Cell{
    #cellElement
    #x
    #y
    #state
    #id

    // creating cell
    constructor(cellElement, x, y, state, id) {
        cellElement.style.setProperty("--cell-color", CELL_COLOR) // cell background color
        this.#cellElement = cellElement
        this.#x = x
        this.#y = y
        this.#state = state
        this.#id = id
    }
    // the state of a cell can be free, miss, sunk or hit
    set state(value){
        if(value == "free" || value == "miss" || value == "hit" || value == "sunk"){
            if(this.#state == "free" || value == "free" || (value == "sunk" && this.#state == "hit") || (value == "hit" && this.#state == "sunk")){ //to not overwrite occupied cells, but be able to undo them
                this.#state = value
                setCellApperance(this.#cellElement, value)
            }
        } else {
            console.error("Value error: \"" + value + "\" is not a valid state (cell: " + this.#x + ", " + this.#y + ")")
        }
    }

    get state(){
        return this.#state
    }

    get cellElement(){
        return this.#cellElement
    }

    get x(){
        return this.#x
    }

    get y(){
        return this.#y
    }

    get id(){
        return this.#id
    }
}

// creating cell elements into a square grid
function createCellElements(gridElement){
    const cells = []
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement("div")
        cell.classList.add("cell", "cellHover")
        cell.id = i
        //cell.textContent = "27" //remove this line later
        cells.push(cell)
        gridElement.append(cell)
    }
    return cells
}

// setting the cells appearance based on its state
function setCellApperance(cell, state){
    switch(state){
        case "miss":
            cell.style.setProperty("background-image", "url(\"./images/dot.png\")")
            cell.classList.remove("cellHover")
            break
        case "hit":
            cell.style.setProperty("background-image", "url(\"./images/redX.png\")")
            cell.classList.remove("cellHover")
            cell.classList.remove("sunkenCell")
            break
        case "sunk":
            cell.classList.add("sunkenCell")
            break
        case "free":
            cell.style.setProperty("background-image", "")
            cell.classList.add("cellHover")
            cell.classList.remove("sunkenCell")
            break
    }
}