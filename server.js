// Methods for creating the grid -----------------------------

const cols = 40;
const rows = 20;
const w = 40;

var bombs;
var revealed;
var flagged;

const totalBombs = 100;

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

function createGrid(cols, rows) {
	bombs = make2DArray(cols, rows);
	revealed = make2DArray(cols, rows);
	flagged = make2DArray(cols, rows);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		bombs[i][j] = false;
		revealed[i][j] = false;
		flagged[i][j] = false;
	}

	var options = [];
	for (var i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
		options.push([i, j]);
	}

	for (var n = 0; n < totalBombs; n++) {
		var index = Math.floor(Math.random() * options.length);
		var choice = options[index];
		var i = choice[0];
		var j = choice[1];
		options.splice(index, 1);
		bombs[i][j] = true;
	}
}

// Server handling -------------------------------------
var express = require('express');
require('dotenv').config();

var app = express();
const port = process.env.PORT || 3000;
var server = app.listen(port, () => {
	console.log('Starting server on port ${port}');
});

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server);
io.sockets.on('connection', newConnection);

createGrid(cols, rows);

function newConnection(socket) {
	console.log('new connection: ' + socket.id);

	socket.emit('grid', { 
		bombs: bombs, 
		revealed: revealed, 
		flagged: flagged 
	});

	socket.on('stateChange', (newState) => {
		revealed = newState;
	});
	socket.on('click', clickClients);
	socket.on('flag', flagClients);
	socket.on('gameOver', gameOver);

	function clickClients(data) {
		socket.broadcast.emit('mouseClick', data);
	}

	function flagClients(data) {
		socket.broadcast.emit('placeFlag', data);
		console.log(data);
		flagged[data.x][data.y] = data.flagged;
	}

	function gameOver() {
		socket.broadcast.emit('endGame');
		createGrid(cols, rows);
		console.log(socket.id + ' lost the game');
		var data = { 
			bombs: bombs, 
			revealed: revealed, 
			flagged: flagged 
		}
		socket.emit('grid', data);
		socket.broadcast.emit('grid', data);
		console.log('sent out new grid');
	}
}

