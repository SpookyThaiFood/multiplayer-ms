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
var colourPreview;
var legendShown = true;

var redSlider;
var greenSlider;
var blueSlider;

var totalBees = 100;

var username = "Thaibo";
var users = [];
var userPos = [];

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

	colourPreview = document.getElementById("colourPreview");

	redSlider = document.getElementById("redSlider");
	greenSlider = document.getElementById("greenSlider");
	blueSlider = document.getElementById("blueSlider");

	redSlider.addEventListener('input', setColour);
	greenSlider.addEventListener('input', setColour);
	blueSlider.addEventListener('input', setColour);
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

function setColour() {
	var red = redSlider.value;
	var green = greenSlider.value;
	var blue = blueSlider.value;
	var colour = 'rgb(' + red + ',' + green + ',' + blue + ')';
	colourPreview.style.backgroundColor = colour;
}

function submitColour() {
	var colour = {
		r: redSlider.value,
		g: greenSlider.value,
		b: blueSlider.value
	}
	socket.emit('submitColour', colour);
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

	updateUserPositions();

	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (user.username != username) {
			fill(user.r, user.g, user.b);
			stroke(0);
			strokeWeight(2);
			ellipse(user.x, user.y, 25);
			strokeWeight(1);
			fill(0);
			noStroke();
			text(user.username, user.x, user.y - 15);
		}
	}
}

function submitUsername() {
	var user = {
		username: userField.value,
	}
	username = user.username;
	socket.emit('submitUsername', user);
}

function updateUserPositions() {
	for (var i = 0; i < users.length; i++) {
		users[i].x = lerp(users[i].x, userPos[i].x, 0.3);
		users[i].y = lerp(users[i].y, userPos[i].y, 0.3);
	}
}

function updateUserList(userList) {
	userPos = userList;
	if (users.length != userPos.length) {
		users = userPos;
	}
	for (var i = 0; i < users.length; i++) {
		if (users[i].username != userPos[i].username || 
			users[i].id != userPos[i].id || 
			users[i].r != userPos[i].r ||
			users[i].g != userPos[i].g ||
			users[i].b != userPos[i].b) {
			users = userPos;
		}
	}
}