
// Voronoi class
function Voronoi(gls,texture) {
    this.points = new Float32Array([
	0.9,0.5,
	0.7,0.3,
	0.7,0.7,
	0.75,0.5,
	0.3,0.2,
	0.3,0.8,
	0.52,0.35,
	0.52,0.65,
	0.4,0.6,
	0.4,0.4,
	0.27,0.5,
	0.1,0.5,
	0.3,0.3,
	0.3,0.7,
	0.25,0.5,
	0.7,0.2,
	0.7,0.8,
	0.48,0.35,
	0.48,0.65,
	0.6,0.6,
	0.6,0.4,
	0.73,0.5,
    ]);
    this.highlights = new Float32Array([
	0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
    ]);
    var params = [];
    for (var i = 0; i < 16; i++) {
	params.push(1+Math.random())
	params.push(Math.random()*.25)
	params.push(1+Math.random())
    }
    this.params = new Float32Array(params);
    this.teams = 1;
    this.ballPosition = new Float32Array([.5,.5]);
    this.ballPlayer = 0;
    this.texture = texture;

    var buffers = [
	['points', '2fv'],
	['params', '3fv'],
	['teams', '1f'],
	['regions', '1f'],
	['ballPlayer', '1f'],
	['ballPosition', '2fv'],
	['weights', '1f'],
	['delays', '1f'],
	['extents', '1f'],
	['linear', '1f'],
	['aspect', '1f'],
	['highlights', '1fv'],
	['highlightBall', '1f']
    ];

    this.pitch = new Image(gls[0], {
		fragment: 'shader-fs',
		vertex: 'shader-vs'
    });
    this.regions = new Image(gls[1], {
		fragment: 'shader-fs',
		vertex: 'shader-vs'
    });

    for (var i = 0; i < buffers.length; i++) {
	this.pitch.defineBuffer(...buffers[i]);
	this.regions.defineBuffer(...buffers[i]);
    }
    this.regions.setBuffer('regions', 1);

    var defaults = {
	teams: 1,
	linear: 1,
	aspect: this.texture.width / this.texture.height,
	points: this.points,
	params: this.params,
	ballPosition: this.ballPosition,
	highlights: this.highlights,
    };

    for (var label in defaults) {
	this.pitch.setBuffer(label, defaults[label]);
	this.regions.setBuffer(label, defaults[label]);
    }
    
    this.setBallPlayer();

    this.pitch.setTexture(texture);
    this.regions.setTexture(texture);
    
    this.pitch.initialise();
    this.regions.initialise();
}

Voronoi.prototype.drawPitch = function() {
    this.pitch.draw();
    this.mvpMatrix = perspectiveMatrix.x(currentMatrix());
}

Voronoi.prototype.drawRegions = function() {
    this.regions.draw();
}

Voronoi.prototype.setTeams = function(b) {
    this.teams = b;
    this.pitch.setBuffer('teams',b);
    this.regions.setBuffer('teams',b);
    this.setBallPlayer();
}

Voronoi.prototype.setLinear = function(b) {
    if (b) {
	this.linear = 1;
    } else {
	this.linear = 0;
    }
    this.pitch.setBuffer('teams',this.linear);
    this.regions.setBuffer('teams',this.linear);
}

Voronoi.prototype.setBallPlayer = function() {
    var x,y,d,dd,p,st,ed;

    d = 4;
    p = 0;
    
    if ( (this.teams & 1) == 1) {
	st = 0;
    } else {
	st = 11;
    }
    if ( (this.teams & 2) == 2) {
	ed = 22;
    } else {
	ed = 11;
    }

    for (var i = st; i < ed; i++) {
	x = this.points[2*i];
	y = this.points[2*i+1];
	dd = Math.pow(this.ballPosition[0] - x,2) + Math.pow(this.ballPosition[1] - y,2);
	if (dd < d) {
	    d = dd;
	    p = i;
	}
    }
    this.ballPlayer = p;
    this.pitch.setBuffer('ballPlayer', p);
    this.pitch.setBuffer('ballPosition', this.ballPosition);
}

Voronoi.prototype.setParams = function(a,b,c,d,e,f) {
    a = parseFloat(a);
    if (isNaN(a)) {
	a = 1;
    }
    b = parseFloat(b);
    if (isNaN(b)) {
	b = 0;
    }
    c = parseFloat(c);
    if (isNaN(c)) {
	c = 1;
    }

    this.dblparams[3] = a;
    this.dblparams[4] = b;
    this.dblparams[5] = c;
    if (d) {
	this.weights = 1;
    } else {
	this.weights = 0;
    }
    if (e) {
	this.delays = 1;
    } else {
	this.delays = 0;
    }
    if (f) {
	this.extents = 1;
    } else {
	this.extents = 0;
    }
}

Voronoi.prototype.regenerate = function() {
    var params = [];
    for (var i = 0; i < 16; i++) {
	params.push(1+Math.random())
	params.push(Math.random()*.25)
	params.push(1+Math.random())
    }
    this.params = new Float32Array(params);
}

Voronoi.prototype.setParameter = function(c) {
    this.parameters = new Float32Array(c);
}

Voronoi.prototype.resetHighlights = function() {
    for (var i = 0; i < this.highlights.length; i++) {
	this.highlights[i] = 0;
    }
}


Voronoi.prototype.isTouchedBy = function(e) {
    if (this.inTouch) return false;
    return this.isOnImage(e);
}

Voronoi.prototype.isOnImage = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    if (pt.x < 1 && pt.x > 0 && pt.y < 1 && pt.y > 0)
	return true;
    return false;
}

Voronoi.prototype.doWheel = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    var s = Math.pow(1.001,e.deltaY);
}

Voronoi.prototype.doMouseDown = function(e) {
    if (e.button != 0)
	return;
    this.processMouseDown(e);
}

Voronoi.prototype.processMouseDown = function(e) {
    // mouse down, start of a move or a click
    this.mouseIsMoving = false;
    // convert touch point to image coordinates 
    var mousept = convertPoint(e,this.mvpMatrix);
    var x,y,d,dd,p,st,ed;

    // initialise with the distance to the ball 
    d = Math.pow(mousept.x - this.ballPosition[0],2) + Math.pow(mousept.y - this.ballPosition[1],2);
    // index -1 indicates the nearest object is the ball
    p = -1;

    // figure out which teams are in play
    if ( (this.teams & 1) == 1) {
	st = 0;
    } else {
	st = 11;
    }
    if ( (this.teams & 2) == 2) {
	ed = 22;
    } else {
	ed = 11;
    }

    // iterate over the active players to see which is closest to the touch point
    for (var i = st; i < ed; i++) {
	x = this.points[2*i];
	y = this.points[2*i+1];
	dd = Math.pow(mousept.x - x,2) + Math.pow(mousept.y - y,2);
	if (dd < d) {
	    d = dd;
	    p = 2*i;
	}
    }

    // the index p corresponds to the closest object
    // it's actually 2i because the position array is flattened
    this.touchedPlayer = p;
    if (p == -1) {
	// the ball is the closest object, save the offset from the touch position to the touch point
	this.touchOffset = [
	    mousept.x - this.ballPosition[0],
	    mousept.y - this.ballPosition[1]
	];
	// highlight the ball
	this.pitch.setBuffer('highlightBall', 1);
	// un-highlight all the players
	this.resetHighlights()
    } else {
	// a player is the closest object, save the initial touch position
	this.lastTouch = mousept
	// un-highlight the ball
	this.pitch.setBuffer('highlightBall', 0);
    }
}

Voronoi.prototype.doMouseMove = function(e) {
    if (e.buttons != 1)
	return;
    this.processMouseMove(e);
}

Voronoi.prototype.processMouseMove = function(e) {
    // we're moving
    this.mouseIsMoving = true;

    // convert the touch point into the image coordinates
    var pt = convertPoint(e,this.mvpMatrix);
    if (this.touchedPlayer == -1) {
	// touched object was the ball, update its position
	this.ballPosition[0] = pt.x - this.touchOffset[0];
	this.ballPosition[1] = pt.y - this.touchOffset[1];
    } else {
	// closest object is a player, make sure it is highlighted
	this.highlights[this.touchedPlayer/2] = 1;

	// work out the delta of the touch point
	var dt = {x: pt.x, y: pt.y};
	dt.x -= this.lastTouch.x;
	dt.y -= this.lastTouch.y;

	// figure out which players are active
	var st,ed;
	if ( (this.teams & 1) == 1) {
	    st = 0;
	} else {
	    st = 11;
	}
	if ( (this.teams & 2) == 2) {
	    ed = 22;
	} else {
	    ed = 11;
	}

	// iterate over the active players
	for (var i = st; i < ed; i++) {
	    if (this.highlights[i] == 1) {
		// if selected, update their position
		this.points[2*i] += dt.x;
		this.points[2*i+1] += dt.y;
	    }
	}
	// update the last touch point
	this.lastTouch = pt;
    }
    // reset which player is closest to the ball
    this.setBallPlayer();
}

Voronoi.prototype.doMouseUp = function(e) {
    if (e.button != 0)
	return;
    this.processMouseUp(e);
}

Voronoi.prototype.processMouseUp = function(e) {
    if (this.mouseIsMoving) {
	// if the mouse is moving, reset the highlight
	this.resetHighlights();
    } else {
	if (this.touchedPlayer != -1) {
	    // if the mouse is not moving, this is a click so swap the selection of the touched player
	    
	    this.highlights[this.touchedPlayer/2] = 1 - this.highlights[this.touchedPlayer/2];
	}
    }
    this.mouseIsMoving = false;
    // regardless, de-highlight the ball
    this.pitch.setBuffer('highlightBall', 0);
}

/*
  Needs implementing for touch screens
*/
Voronoi.prototype.doTouchStart = function(e) {
    this.inTouch = true;
    return this.processMouseDown(e);
}
Voronoi.prototype.doTouchMove = function(e) {
    return this.processMouseMove(e);
}
Voronoi.prototype.doTouchEnd = function(e) {
    this.inTouch = false;
    return this.processMouseUp(e);
}

var corners = [
    Vector.create([1.0,  1.0,  0.0, 1.0]),
    Vector.create([-1.0, 1.0,  0.0, 1.0]),
    Vector.create([1.0,  -1.0, 0.0, 1.0]),
    Vector.create([-1.0, -1.0, 0.0, 1.0])
];

function convertPoint(e,m) {
    var v;
    var minx = 0;
    var maxx = 0;
    var miny = 0;
    var maxy = 0;
    for (var i = 0; i < corners.length; i++) {
	v = m.x(corners[i]);
	minx = Math.min(minx,v.e(1)/v.e(4));
	maxx = Math.max(maxx,v.e(1)/v.e(4));
	miny = Math.min(miny,v.e(2)/v.e(4));
	maxy = Math.max(maxy,v.e(2)/v.e(4));
    }
    var x,y;
    
    // Convert mouse point to normalised screen coordinates
    if (e.offsetX !== undefined && e.offsetY !== undefined) {
	x = e.offsetX;
	y = e.offsetY;
    } else if (e.layerX !== undefined && e.layerY !== undefined) {
        x = e.layerX;
	y = e.layerY;
    } else {
	x = e.pageX - e.target.offsetLeft;     
	y = e.pageY - e.target.offsetTop;
    };
    x *= 2/width;
    x -= 1;
    y *= 2/height;
    y -= 1;

    // Convert to proportions along the sides of the square
    x -= minx;
    x /= (maxx - minx);
    y -= miny;
    y /= (maxy - miny);
    // take account of the inversion in the y-coordinate
    y = 1 - y;

    return {x: x, y: y};
}


// This needs to have a simple shader, not the voronoi one

function Average(gl) {
    this.image = new Image(gl, {
	fragment: 'shader-default-fs',
	vertex: 'shader-vs'
    });

    this.gl = gl;
    this.image.initialise();
}

Average.prototype.setTexture = function(texture) {
    this.image.setTexture(texture);
}

Average.prototype.draw = function() {
    this.image.draw();
}

