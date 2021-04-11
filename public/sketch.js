var socket;

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

var grid;
var cols = 40;
var rows = 20;
var w = 40;

var totalBees = 100;

function setup() {
	offlineGrid();
	socket = io.connect("http://localhost:3000");
	socket.on('grid', loadGrid);
	socket.on('mouseClick', remotePress);
	socket.on('placeFlag', placeFlag);
	socket.on('endGame', gameOver);

	createCanvas(1601, 801);
}

function offlineGrid() {
	grid = make2DArray(cols, rows);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j] = new Cell(i, j, w);
	}

	var options = [];
	for (var i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
		options.push([i, j]);
	}

	for (var n = 0; n < totalBees; n++) {
		var index = floor(random(options.length));
		var choice = options[index];
		var i = choice[0];
		var j = choice[1];
		options.splice(index, 1);
		grid[i][j].bee = true;
	}
	countBees();
}

function countBees() {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].countBees();
	}
}

function loadGrid(data) {
	grid = make2DArray(data.length, data[0].length);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j] = new Cell(i, j, w);
	}
	for (var i = 0; i < data.length; i++) for (var j = 0; j < data[0].length; j++) {
		grid[i][j].bee = data[i][j];
	}
	console.log('Grid data loaded');
	countBees();
}

function gameOver() {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].revealed = true;
	}
}

function placeFlag(data) {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		if (grid[i][j].contains(data.x, data.y)) {
			grid[i][j].flagged = !grid[i][j].flagged;
		}
	}
}

function keyPressed() {
	if (key == 'f') {
		for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
			if (grid[i][j].contains(mouseX, mouseY)) {
				grid[i][j].flagged = !grid[i][j].flagged;
			}
		}
		var data = {
			x: mouseX,
			y: mouseY
		}
		socket.emit('flag', data);
	}
}

function mousePressed() {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		if (grid[i][j].contains(mouseX, mouseY)) {
			grid[i][j].reveal();
			if (!grid[i][j].bee || grid[i][j].flagged) {
				var data = {
					x: mouseX,
					y: mouseY
				}
				socket.emit('click', data);
			}
			if (grid[i][j].bee && !grid[i][j].flagged) {
				socket.emit('gameOver');
				gameOver();
			}
		}
	}
	
}

function remotePress(data) {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		if (grid[i][j].contains(data.x, data.y)) {
			grid[i][j].reveal();
		}
	}
}

function draw() {
	background(255);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].show();
	}
}