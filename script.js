let selectedCell = null;
let correctGrid = [];
let currentGrid = [];
let draggedCell = null;
let draggedColor = null;
let longPressTimeout = null;
let cloneElement = null;
let level = localStorage.getItem('gameLevel') ? parseInt(localStorage.getItem('gameLevel'), 10) : 1;
document.getElementById('level-count').textContent = level;

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function rgbToHexColor(rgb) {
    const rgbValues = rgb.match(/\d+/g)
    if (!rgbValues) return rgb;
    const [r, g, b] = rgbValues;
    return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
}

function interpolateColors(startRGB, endRGB, steps) {
    const colorArray = [];
    for (let i = 1; i <= steps; i++) {
        const factor = i / (steps + 1);
        const r = Math.round(startRGB[0] + factor * (endRGB[0] - startRGB[0]));
        const g = Math.round(startRGB[1] + factor * (endRGB[1] - startRGB[1]));
        const b = Math.round(startRGB[2] + factor * (endRGB[2] - startRGB[2]));
        colorArray.push(rgbToHex(r, g, b));
    }
    return colorArray;
}

function getRandomGridDimensions() {
    const width = Math.floor(Math.random() * 9) + 4
    const height = Math.floor(Math.random() * 9) + 4
    console.log(`width: ${width}, height: ${height}`)
    return { width, height };
}
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateCornerColors() {
    const topLeft = generateRandomColor();
    const topRight = generateRandomColor();
    const bottomLeft = generateRandomColor();
    const bottomRight = generateRandomColor();
    return [topLeft, topRight, bottomLeft, bottomRight];
}

function setColors() {
    const { width, height } = getRandomGridDimensions();
    gridWidth = width;
    gridHeight = height;

    const [topLeft, topRight, bottomLeft, bottomRight] = generateCornerColors();
    const grid = [];
    const leftColumn = interpolateColors(hexToRgb(topLeft), hexToRgb(bottomLeft), height - 2);
    const rightColumn = interpolateColors(hexToRgb(topRight), hexToRgb(bottomRight), height - 2);
    for (let i = 0; i < height; i++) {
        if (i === 0) {
            grid.push([topLeft, ...interpolateColors(hexToRgb(topLeft), hexToRgb(topRight), width - 2), topRight]);
        } else if (i === height - 1) {
            grid.push([bottomLeft, ...interpolateColors(hexToRgb(bottomLeft), hexToRgb(bottomRight), width - 2), bottomRight]);
        } else {
            const row = interpolateColors(hexToRgb(leftColumn[i - 1]), hexToRgb(rightColumn[i - 1]), width - 2);
            grid.push([leftColumn[i - 1], ...row, rightColumn[i - 1]]);
        }
    }

    correctGrid = JSON.parse(JSON.stringify(grid));
    const movableSquares = [];
    for (let row = 0; row < height; row++) {
        for (let col = 1; col < width - 1; col++) {
            movableSquares.push(grid[row][col]);
        }
    }
    const shuffledMovable = shuffleArray([...movableSquares]);
    let shuffleIndex = 0;
    for (let row = 0; row < height; row++) {
        for (let col = 1; col < width - 1; col++) {
            grid[row][col] = shuffledMovable[shuffleIndex++];
        }
    }

    currentGrid = grid;
    return grid;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    if (!container) {
        console.error('Grid container not found');
        return;
    }
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gridWidth}, auto)`;
    container.style.gridTemplateRows = `repeat(${gridHeight}, auto)`;

    currentGrid.forEach((rowArray, row) => {
        rowArray.forEach((color, col) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = color;
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (col !== 0 && col !== gridWidth - 1) {
                cell.classList.add('movable');
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('touchstart', handleTouchStart);
                cell.addEventListener('touchend', handleTouchEnd);
                cell.addEventListener('touchmove', handleTouchMove);
            }

            container.appendChild(cell);
        });
    });
}

let isAnimating = false;

function handleCellClick(event) {
    console.log("handleCellClick triggered");
    if (isAnimating) {
        console.log("Animation in progress, click ignored.");
        return;
    }

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    console.log(`Clicked cell at row: ${row}, col: ${col}`);

    document.querySelectorAll('.selected').forEach(selected => selected.classList.remove('selected'));

    if (selectedCell) {
        console.log("A cell is already selected. Starting swap process.");
        isAnimating = true;

        const selectedRow = selectedCell.row;
        const selectedCol = selectedCell.col;
        const targetCell = document.querySelector(`[data-row="${selectedRow}"][data-col="${selectedCol}"]`);
        console.log(`Swapping selected cell at row: ${selectedRow}, col: ${selectedCol} with clicked cell at row: ${row}, col: ${col}`);
        const cellRect = cell.getBoundingClientRect();
        const targetRect = targetCell.getBoundingClientRect();
        const offsetX = targetRect.left - cellRect.left;
        const offsetY = targetRect.top - cellRect.top;
        console.log(`Animation offsets - X: ${offsetX}, Y: ${offsetY}`);
        Promise.all([
            animateSwap(cell, offsetX, offsetY),
            animateSwap(targetCell, -offsetX, -offsetY)
        ]).then(() => {
            console.log("Animation complete. Swapping colors in currentGrid.");
            const tempColor = currentGrid[selectedRow][selectedCol];
            currentGrid[selectedRow][selectedCol] = currentGrid[row][col];
            currentGrid[row][col] = tempColor;
            console.log("Swapped colors in currentGrid:");
            console.table(currentGrid);
            renderGrid();
            console.log("Resetting transform styles.");
            cell.style.transform = '';
            targetCell.style.transform = '';
            cell.classList.remove('selected');
            targetCell.classList.remove('selected');
            isAnimating = false;

            console.log("Checking if puzzle is solved.");

            checkIfSolved();
        }).catch(error => console.error("Animation promise error:", error));

        selectedCell = null;
        console.log("Reset selectedCell.");
    } else {
        selectedCell = { row, col };
        cell.classList.add('selected');
        console.log(`Selected cell at row: ${row}, col: ${col}`);
    }
}

function animateSwap(element, offsetX, offsetY) {
    console.log(`Animating swap for element at offsetX: ${offsetX}, offsetY: ${offsetY}`);
    return new Promise(resolve => {

        element.style.zIndex = '20';
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        element.addEventListener('transitionend', () => {
            console.log("Transition ended for element.");
            element.style.transition = '';
            element.style.zIndex = '';
            resolve();
        }, { once: true });
    });
}

function showLevelPopup() {
    const levelPopup = document.getElementById('level-popup');
    const levelNumber = document.getElementById('level-number');
    levelNumber.textContent = level;
    document.getElementById('level-count').textContent = level;
    levelPopup.classList.add('active');
}
function hideLevelPopup() {
    const levelPopup = document.getElementById('level-popup');
    levelPopup.classList.remove('active');
}
document.getElementById('next-level-button').addEventListener('click', () => {
    hideLevelPopup();
    level++;
    document.getElementById('level-count').textContent = level;
    localStorage.setItem('gameLevel', level);
    startNewBatch();
});

function checkIfSolved() {
    console.log("Checking if puzzle is solved.");
    let solved = true;
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const currentColor = currentGrid[row][col];
            const correctColor = correctGrid[row][col];
            if (col !== 0 && col !== gridWidth - 1 && currentColor !== correctColor) {
                console.log(`Mismatch found at row: ${row}, col: ${col}. Current: ${currentColor}, Correct: ${correctColor}`);
                solved = false;
                break;
            }
        }
        if (!solved) break;
    }
    if (solved) {
        console.log("Puzzle solved!");
        const overlay = document.getElementById('gradient-overlay');

        overlay.style.background = `linear-gradient(to bottom right, ${correctGrid[0][0]}, ${correctGrid[0][gridWidth - 1]}, ${correctGrid[gridHeight - 1][0]}, ${correctGrid[gridHeight - 1][gridWidth - 1]})`;
        overlay.style.opacity = 1;
        setTimeout(() => {
            overlay.style.opacity = 0;
        }, 1000);
        setTimeout(showLevelPopup, 1500);
    } else {
        console.log("Puzzle not yet solved.");
    }
}
let hintTimeout;

function showHint() {
    const cells = document.querySelectorAll('.movable');
    if (hintTimeout) {
        clearTimeout(hintTimeout);
    }
    cells.forEach(cell => cell.classList.remove('wrong'));
    void document.body.offsetWidth;
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const correctColor = correctGrid[row][col];
        const currentColor = currentGrid[row][col];

        if (currentColor !== correctColor) {
            cell.classList.add('wrong');
        }
    });
    hintTimeout = setTimeout(() => {
        cells.forEach(cell => cell.classList.remove('wrong'));
    }, 1000);
}
function handleDragStart(event) {
    draggedCell = event.target;
    draggedColor = event.target.style.backgroundColor;
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    const targetCell = event.target;
    const dropColor = targetCell.style.backgroundColor;
    targetCell.style.backgroundColor = draggedColor;
    draggedCell.style.backgroundColor = dropColor;

    checkIfSolved();
}

function handleTouchStart(event) {
    draggedCell = event.target;
    draggedColor = draggedCell.style.backgroundColor;

    const touch = event.touches[0];
    const rect = draggedCell.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;
    longPressTimeout = setTimeout(() => {

        cloneElement = draggedCell.cloneNode(true);
        cloneElement.classList.add('dragging');
        cloneElement.style.position = 'absolute';
        cloneElement.style.pointerEvents = 'none';
        cloneElement.style.zIndex = '1000';
        document.body.appendChild(cloneElement);
        draggedCell.classList.add('picked-up');
        draggedCell.style.backgroundColor = 'transparent';
        cloneElement.style.left = `${touch.clientX - touchOffsetX}px`;
        cloneElement.style.top = `${touch.clientY - touchOffsetY}px`;
    }, 500);
}

function handleTouchMove(event) {
    event.preventDefault();
    if (!cloneElement) return;

    const touch = event.touches[0];
    cloneElement.style.left = `${touch.clientX - touchOffsetX}px`;
    cloneElement.style.top = `${touch.clientY - touchOffsetY}px`;
}
function handleTouchEnd(event) {
    clearTimeout(longPressTimeout);

    if (cloneElement) {
        const touch = event.changedTouches[0];
        const targetCell = document.elementFromPoint(touch.clientX, touch.clientY);

        if (targetCell && targetCell.classList.contains('movable')) {
            const startRow = parseInt(draggedCell.dataset.row);
            const startCol = parseInt(draggedCell.dataset.col);
            const endRow = parseInt(targetCell.dataset.row);
            const endCol = parseInt(targetCell.dataset.col);
            const tempColor = currentGrid[startRow][startCol];
            currentGrid[startRow][startCol] = currentGrid[endRow][endCol];
            currentGrid[endRow][endCol] = tempColor;

            renderGrid();
            checkIfSolved();
            targetCell.classList.add('dropped');
            setTimeout(() => targetCell.classList.remove('dropped'), 150);
        } else {
            draggedCell.style.backgroundColor = draggedColor;
        }
        draggedCell.classList.remove('picked-up');
        document.body.removeChild(cloneElement);
        cloneElement = null;
    }
}
function startNewBatch() {
    setColors();
    renderGrid();
}

document.addEventListener('DOMContentLoaded', () => {
    const initialGrid = setColors();
    renderGrid(initialGrid);
});

document.getElementById('hint-button').addEventListener('click', showHint);