
// Voronoi class
function Voronoi() {
    this.coordinates = new Float32Array([
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0
    ]);
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
    this.setBallPlayer();
    this.useWeights = false;
    this.useDelays = false;
    this.useExtents = false;
    this.linear = true;
    this.image = document.getElementById('pitch');
    this.aspect = this.image.width / this.image.height;
    this.initShaders();
    this.initBuffers();
}

Voronoi.prototype.initShaders = function() {
    var fragmentShader = getShader(gl,'shader-fs');
    var vertexShader = getShader(gl, 'shader-vs');
  
    // Create the shader program
  
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  
    gl.useProgram(shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    
    this.vertexCoordinateAttribute = gl.getAttribLocation(shaderProgram, 'aVertexCoordinate');
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);

    this.shaderProgram = shaderProgram;
}

Voronoi.prototype.initBuffers = function() {
    this.vertices = new Float32Array([
	1.0,  1.0,  0.0, // top right on screen
	-1.0, 1.0,  0.0, // top left on screen
	1.0,  -1.0, 0.0, // bottom right on screen
	-1.0, -1.0, 0.0  // bottom left on screen
    ]);

    gl.useProgram(this.shaderProgram);
    
    this.squareVerticesBuffer = gl.createBuffer();
    this.squareVerticesCoordinateBuffer = gl.createBuffer();

    this.texture = gl.createTexture();

    this.vertexCoordinateAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexCoordinate');

//    this.parameterUniform = gl.getUniformLocation(this.shaderProgram,'params');
    this.pointsUniform = gl.getUniformLocation(this.shaderProgram,'pts');
    this.paramsUniform = gl.getUniformLocation(this.shaderProgram,'params');
    this.teamsUniform = gl.getUniformLocation(this.shaderProgram,'tms');
    this.ballPlayerUniform = gl.getUniformLocation(this.shaderProgram,'bplyr');
    this.ballPositionUniform = gl.getUniformLocation(this.shaderProgram,'ball');
    this.useWeightsUniform = gl.getUniformLocation(this.shaderProgram,'wgts');
    this.useDelaysUniform = gl.getUniformLocation(this.shaderProgram,'dlys');
    this.useExtentsUniform = gl.getUniformLocation(this.shaderProgram,'exts');
    this.isLinearUniform = gl.getUniformLocation(this.shaderProgram,'lin');
    this.aspectUniform = gl.getUniformLocation(this.shaderProgram,'aspect');
}

Voronoi.prototype.doBindings = function() {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesCoordinateBuffer);
    gl.vertexAttribPointer(this.vertexCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordinates, gl.DYNAMIC_DRAW);
    
    //    gl.uniform2fv(this.parameterUniform, this.parameters);
    gl.uniform2fv(this.pointsUniform, this.points);
    gl.uniform3fv(this.paramsUniform, this.params);
    gl.uniform1f(this.aspectUniform, this.aspect);
    if (this.useWeights) {
	gl.uniform1f(this.useWeightsUniform, 1);
    } else {
	gl.uniform1f(this.useWeightsUniform, 0);
    }
    if (this.useDelays) {
	gl.uniform1f(this.useDelaysUniform, 1);
    } else {
	gl.uniform1f(this.useDelaysUniform, 0);
    }
    if (this.useExtents) {
	gl.uniform1f(this.useExtentsUniform, 1);
    } else {
	gl.uniform1f(this.useExtentsUniform, 0);
    }

    if (this.linear) {
	gl.uniform1f(this.isLinearUniform, 1);
    } else {
	gl.uniform1f(this.isLinearUniform, 0);
    }
    gl.uniform1f(this.teamsUniform, this.teams);
    gl.uniform2fv(this.ballPositionUniform, this.ballPosition);
    gl.uniform1f(this.ballPlayerUniform, this.ballPlayer);

    this.bindTexture();
}

Voronoi.prototype.bindTexture = function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'pitch'), 0);
//    gl.bindTexture(gl.TEXTURE_2D, null);

}

Voronoi.prototype.enableProgram = function() {
    gl.useProgram(this.shaderProgram);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);    
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);
    
}

Voronoi.prototype.draw = function(m) {
    this.enableProgram();
    this.doBindings();

    setMatrixUniforms(this.shaderProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.mvpMatrix = perspectiveMatrix.x(currentMatrix());
}

Voronoi.prototype.setTeams = function(b) {
    this.teams = b;
    this.setBallPlayer();
}

Voronoi.prototype.setLinear = function(b) {
    this.linear = b;
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
    this.useWeights = d;
    this.useDelays = e;
    this.useExtents = f;
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

Voronoi.prototype.isTouchedBy = function(e) {
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
    this.mouseIsMoving = false;
    this.mousept = convertPoint(e,this.mvpMatrix);
    var x,y,d,dd,p,st,ed;

    d = Math.pow(this.mousept.x - this.ballPosition[0],2) + Math.pow(this.mousept.y - this.ballPosition[1],2);
    p = -1;
    
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
	dd = Math.pow(this.mousept.x - x,2) + Math.pow(this.mousept.y - y,2);
	if (dd < d) {
	    d = dd;
	    p = 2*i;
	}
    }
    this.touchpt = p;
    if (p == -1) {
	this.touchOffset = [
	    this.mousept.x - this.ballPosition[0],
	    this.mousept.y - this.ballPosition[1]
	];
    } else {
	this.touchOffset = [
	    this.mousept.x - this.points[p],
	    this.mousept.y - this.points[p+1]
	];
    }
}

Voronoi.prototype.doMouseMove = function(e) {
    if (e.buttons != 1)
	return;
    this.mouseIsMoving = true;
    
    var pt = convertPoint(e,this.mvpMatrix);
    if (this.touchpt == -1) {
	this.ballPosition[0] = pt.x - this.touchOffset[0];
	this.ballPosition[1] = pt.y - this.touchOffset[1];
    } else {
	this.points[this.touchpt] = pt.x - this.touchOffset[0];
	this.points[this.touchpt+1] = pt.y - this.touchOffset[1];
    }
    this.setBallPlayer();
    this.draw();
}

Voronoi.prototype.doMouseUp = function(e) {
    if (e.button != 0)
	return;
    this.mouseIsMoving = false;
}

/*
  Needs implementing for touch screens
*/
Voronoi.prototype.doTouchStart = function(e) {
    this.touchIsMoving = false;
    this.mousept = convertPoint(e,this.mvpMatrix);

    var x,y,d,dd,p,st,ed;
    d = Math.pow(this.mousept.x - this.ballPosition[0],2) + Math.pow(this.mousept.y - this.ballPosition[1],2);
    p = -1;
    if (this.teams & 1 == 1) {
	st = 0;
    } else {
	st = 11;
    }
    if (this.teams & 2 == 2) {
	ed = 22;
    } else {
	ed = 11;
    }
    for (var i = st; i < ed; i++) {
	x = this.points[2*i];
	y = this.points[2*i+1];
	dd = Math.pow(this.mousept.x - x,2) + Math.pow(this.mousept.y - y,2);
	if (dd < d) {
	    d = dd;
	    p = 2*i;
	}
    }
    this.touchpt = p;
    if (p == -1) {
	this.touchOffset = [
	    this.mousept.x - this.ballPosition[0],
	    this.mousept.y - this.ballPosition[1]
	];
    } else {
	this.touchOffset = [
	    this.mousept.x - this.points[p],
	    this.mousept.y - this.points[p+1]
	];
    }
}

Voronoi.prototype.doTouchMove = function(e) {
    this.touchIsMoving = true;
    
    var pt = convertPoint(e,this.mvpMatrix);
    if (this.touchpt == -1) {
	this.ballPosition[0] = pt.x - this.touchOffset[0];
	this.ballPosition[1] = pt.y - this.touchOffset[1];
    } else {
	this.points[this.touchpt] = pt.x - this.touchOffset[0];
	this.points[this.touchpt+1] = pt.y - this.touchOffset[1];
    }
    this.setBallPlayer();
    this.draw();
}

Voronoi.prototype.doTouchEnd = function(e) {
    this.touchIsMoving = false;
}

// Auxiliary functions

function getShader(gl, ids, type) {
    var shaderScript, theSource, currentChild, shader;

    theSource = '';

    if (typeof ids === "string")
	ids = [ids];

    for (var i = 0; i < ids.length; i++) {
	shaderScript = document.getElementById(ids[i]);
  
	if (!shaderScript) {
	    return null;
	}
  
	theSource += shaderScript.text;
    }

    if (!type) {
	if (shaderScript.type == 'x-shader/x-fragment') {
	    type = gl.FRAGMENT_SHADER;
	} else if (shaderScript.type == 'x-shader/x-vertex') {
	    type = gl.VERTEX_SHADER;
	} else {
	    // Unknown shader type
	    return null;
	}
    }
    shader = gl.createShader(type);
    gl.shaderSource(shader, theSource);
    
    // Compile the shader program
    gl.compileShader(shader);  
    
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
	console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));  
	gl.deleteShader(shader);
	return null;  
    }
    
    return shader;
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
