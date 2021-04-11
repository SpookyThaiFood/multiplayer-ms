// Methods for creating the grid -----------------------------

const cols = 40;
const rows = 20;
const w = 40;

var grid = make2DArray(cols, rows);

const totalBombs = 100;

function make2DArray(cols, rows) {
	var arr = new Array(cols);
	for (var i = 0; i < arr.length; i++) {
		arr[i] = new Array(rows);
	}
	return arr;
}

function createGrid(cols, rows) {
	grid = make2DArray(cols, rows);
	for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
		grid[i][j] = false;
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
		grid[i][j] = true;
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

	socket.emit('grid', grid);

	socket.on('click', clickClients);
	socket.on('flag', flagClients);
	socket.on('gameOver', gameOver);

	function clickClients(data) {
		socket.broadcast.emit('mouseClick', data);
	}

	function flagClients(data) {
		socket.broadcast.emit('placeFlag', data);
	}

	function gameOver() {
		socket.broadcast.emit('endGame');
		createGrid(cols, rows);
		console.log(socket.id + ' lost the game');
		socket.emit('grid', grid);
		socket.broadcast.emit('grid', grid);
		console.log('sent out new grid');
	}
}

