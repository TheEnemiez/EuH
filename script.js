let selectedCell = null;
let correctGrid = []

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
    const [topLeft, topRight, bottomLeft, bottomRight] = generateCornerColors();

    const grid = [];

    const leftColumn = interpolateColors(hexToRgb(topLeft), hexToRgb(bottomLeft), 4);
    const rightColumn = interpolateColors(hexToRgb(topRight), hexToRgb(bottomRight), 4);

    for (let i = 0; i < 6; i++) {
        if (i === 0) {
            grid.push([topLeft, ...interpolateColors(hexToRgb(topLeft), hexToRgb(topRight), 4), topRight]);
        } else if (i === 5) {
            grid.push([bottomLeft, ...interpolateColors(hexToRgb(bottomLeft), hexToRgb(bottomRight), 4), bottomRight]);
        } else {
            const row = interpolateColors(hexToRgb(leftColumn[i - 1]), hexToRgb(rightColumn[i - 1]), 4);
            grid.push([leftColumn[i - 1], ...row, rightColumn[i - 1]]);
        }
    }

    correctGrid = JSON.parse(JSON.stringify(grid))

    const movableSquares = [];
    for (let row = 1; row < 5; row++) {
        for (let col = 1; col < 5; col++) {
            movableSquares.push(grid[row][col]);
        }
    }

    const shuffledMovable = shuffleArray([...movableSquares]);

    let shuffleIndex = 0;
    for (let row = 1; row < 5; row++) {
        for (let col = 1; col < 5; col++) {
            grid[row][col] = shuffledMovable[shuffleIndex++];
        }
    }

    return grid;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderGrid(grid) {
    const container = document.getElementById('grid-container');

    if (!container) {
        console.error('Grid container not found');
        return;
    }

    container.innerHTML = ''

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.backgroundColor = grid[row][col];
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (row > 0 && row < 5 && col > 0 && col < 5) {
                cell.classList.add('movable');
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('touchend', handleCellClick)
            }

            container.appendChild(cell);
        }
    }
}

let draggedColor = null;

function handleCellClick(event) {
    const cell = event.target;

    if (selectedCell === cell) {
        cell.classList.remove('selected');
        selectedCell = null;
    }
    else if (selectedCell === null) {
        cell.classList.add('selected');
        selectedCell = cell;
    }
    else {
        const tempColor = selectedCell.style.backgroundColor;
        selectedCell.style.backgroundColor = cell.style.backgroundColor;
        cell.style.backgroundColor = tempColor;
        selectedCell.classList.remove('selected');
        selectedCell = null;
        checkIfSolved()
    }
}

function checkIfSolved() {
    const grid = document.querySelectorAll('.movable');

    let solved = true;
    grid.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const correctColor = correctGrid[row][col];
        const currentColor = rgbToHexColor(cell.style.backgroundColor);

        if (currentColor !== correctColor) {
            solved = false;
        }
    });

    if (solved) {
        alert('Good job!')
        setTimeout(startNewBatch, 1000)
    }
}

function showHint() {
    const grid = document.querySelectorAll('.movable');

    grid.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const correctColor = correctGrid[row][col];
        const currentColor = rgbToHexColor(cell.style.backgroundColor);

        if (currentColor !== correctColor) {
            cell.classList.add('wrong')
        }
    });

    setTimeout(() => {
        grid.forEach(cell => {
            cell.classList.remove('wrong')
        });
    }, 1000);
}

function startNewBatch() {
    const newGrid = setColors();
    renderGrid(newGrid);
}

document.addEventListener('DOMContentLoaded', () => {
    const initialGrid = setColors();
    renderGrid(initialGrid);
});

document.getElementById('hint-button').addEventListener('click', showHint);
