var socket;

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

var grid;
var cols = 80;
var rows = 40;
var w = 40;

var legend;
var userField;
var legendShown = true;

var totalBees = 100;

var username = "Thaibo";
var users = [];

function setup() {
	offlineGrid();
	socket = io.connect("http://localhost:3000");
	socket.on('grid', loadGrid);
	socket.on('mouseClick', remotePress);
	socket.on('placeFlag', placeFlag);
	socket.on('endGame', gameOver);
	socket.on('userList', updateUserList);

	createCanvas(3201, 1601);
	legend = document.getElementById("legend");
	userField = document.getElementById("username");
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
	var bombs = data.bombs;
	var revealed = data.revealed;
	var flagged = data.flagged;
	grid = make2DArray(cols, rows);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j] = new Cell(i, j, w);
	}
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].bee = bombs[i][j];
		grid[i][j].revealed = revealed[i][j];
		grid[i][j].flagged = flagged[i][j];
	}
	console.log('Grid data loaded');
	console.table(data);
	console.table(grid);
	countBees();
}

function gameOver() {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].revealed = true;
	}
}

function placeFlag(data) {
	grid[data.x][data.y].flagged = data.flagged;
}

function keyPressed() {
	if (key == 'f') {
		for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
			if (grid[i][j].contains(mouseX, mouseY)) {
				grid[i][j].flagged = !grid[i][j].flagged;
				var data = {
					x: i,
					y: j,
					flagged: grid[i][j].flagged
				}
				socket.emit('flag', data);
			}
		}
	} else if (key == 'h' && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
		console.log('h pressed');
		toggleLegend();
	}
}

function toggleLegend() {
	legendShown = !legendShown;
	legend.style.opacity = legendShown ? 1 : 0;
}

function sendStateChange() {
	var state = make2DArray(cols, rows);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		state[i][j] = grid[i][j].revealed;
	}
	socket.emit('stateChange', state);
}

function mouseMoved() {
	var user = {
		x: mouseX,
		y: mouseY
	}
	socket.emit('update', user);
}

function mousePressed() {
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		if (grid[i][j].contains(mouseX, mouseY)) {
			grid[i][j].reveal();
			if (!grid[i][j].bee || grid[i][j].flagged) {
				var data = {
					x: i,
					y: j
				}
				socket.emit('click', data);
				sendStateChange();
			}
			if (grid[i][j].bee && !grid[i][j].flagged) {
				socket.emit('gameOver');
				gameOver();
			}
		}
	}
	
}

function remotePress(data) {
	grid[data.x][data.y].reveal();
}

function draw() {
	background(255);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j].show();
	}

	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.username != username) {
			fill(0);
			noStroke();
			ellipse(user.x, user.y, 10);
			text(user.username, user.x, user.y - 5);
		}
	}
}

function submitUsername() {
	var user = {
		username: userField.value,
	}
	username = userField.value;
	console.log(username);
	socket.emit('submitUsername', user);
}

function updateUserList(userList) {
	users = userList;
}