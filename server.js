// Methods for creating the grid -----------------------------

const cols = 80;
const rows = 40;
const w = 40;

var bombs;
var revealed;
var flagged;

const totalBombs = 500;

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
	console.log('Starting server on port ' + port);
});

app.use(express.static('public'));

var socket = require('socket.io');

var users = [];

var io = socket(server);

createGrid(cols, rows);

io.sockets.on('connection', (socket) => {
	console.log('new connection: ' + socket.id);

	user = {
		id: socket.id,
		username: "Thaibo",
		x: 0,
		y: 0,
		r: 0,
		g: 0,
		b: 0
	}
	users.push(user);

	socket.emit('grid', { 
		bombs: bombs, 
		revealed: revealed, 
		flagged: flagged 
	});

	socket.on('submitUsername', (user) => {
		var index = getUser(socket);
		console.log(users[index].username + ', ' + users[index].id + ' set their username to ' + user.username);
		users[index].username = user.username;
	})

	socket.on('submitColour', (colour) => {
		var index = getUser(socket);
		users[index].r = colour.r;
		users[index].g = colour.g;
		users[index].b = colour.b;
	})

	socket.on('update', (user) => {
		var index = getUser(socket)
		users[index].x = user.x;
		users[index].y = user.y;
		io.sockets.emit('userList', users);
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

	socket.on('disconnect', () => {
		console.log(socket.id + ' (' + getUser(socket).username + ') disconnected.');

		for (var i = 0; i < users.length; i++) {
			if (users[i].id == socket.id) {
				users.splice(i, 1);
			}
		}
	});
});

function getUser(socket) {
	for (var i = 0; i < users.length; i++) {
		if (users[i].id == socket.id) {
			return i;
		}
	}
}



