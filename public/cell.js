function Cell(i, j, w) {
	this.i = i;
	this.j = j;
	this.x = i * w;
	this.y = j * w;
	this.w = w;
	this.neighbourCount = 0;
	
	this.bee = false;
	this.revealed = false;
	this.flagged = false;
}

Cell.prototype.show = function() {
	stroke(0);
	noFill();
	rect(this.x, this.y, this.w, this.w); 
	if (this.revealed && !this.flagged) {
		if (this.bee) {
			stroke(0);
			fill(127);
			ellipse(this.x+this.w*0.5, this.y+this.w*0.5, this.w * 0.5);
		} else {
			fill(127);
			stroke(0);
			rect(this.x, this.y, this.w, this.w);
			if (this.neighbourCount > 0) {
				textAlign(CENTER);
				fill(0);
				text(this.neighbourCount, this.x+this.w*0.5, this.y+this.w*0.5+3);
			}
			
		}
	}
	if (this.flagged) {
		stroke(0);
		fill(30);
		rect(this.x, this.y, this.w);
	}
}

Cell.prototype.countBees = function() {
	if (this.bee) {
		this.neighbourCount = -1;
		return;
	}
	var total = 0;
	for (var xOff = -1; xOff <= 1; xOff++) for (var yOff = -1; yOff <= 1; yOff++) {
		var i = this.i + xOff;
		var j = this.j + yOff;
		if (i > -1 && i < cols && j > -1 && j < rows) {
			var neighbour = grid[i][j];
			if (neighbour.bee) {
				total++;
			}
		}
		
	}
	this.neighbourCount = total;
}

Cell.prototype.contains = function(x, y) {
	return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.w);
}

Cell.prototype.reveal = function() {
	if (!this.flagged) {
		this.revealed = true;

		if (this.neighbourCount == 0) {
			this.floodFill();
		}
	}
}

Cell.prototype.floodFill = function() {
	for (var xOff = -1; xOff <= 1; xOff++) for (var yOff = -1; yOff <= 1; yOff++) {
		var i = this.i + xOff;
		var j = this.j + yOff;
		if (i > -1 && i < cols && j > -1 && j < rows) {
			var neighbour = grid[i][j];
			if (!neighbour.bee && !neighbour.revealed) {
				neighbour.reveal();
			}
		}
	}
}
