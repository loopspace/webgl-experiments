
// Fractal class
function Fractal(n,v,c) {
    this.name = n;
    this.viewport = v;
    this.defaultViewport = v.slice();
    this.colour = new Float32Array(c);
    this.parameters = new Float32Array([0,0]);

    this.setCoordinates();
    this.initShaders();
    this.initBuffers();
}

Fractal.prototype.initShaders = function() {
    var fragmentShader = getShader(gl,[ 'shader-pre-fs', 'shader-' + this.name + '-fs', 'shader-post-fs']);
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
    
    this.vertexColourAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColour');
    gl.enableVertexAttribArray(this.vertexColourAttribute);

    this.vertexCoordinateAttribute = gl.getAttribLocation(shaderProgram, 'aVertexCoordinate');
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);

    this.shaderProgram = shaderProgram;
}

Fractal.prototype.initBuffers = function() {
    this.vertices = new Float32Array([
	1.0,  1.0,  0.0, // top right on screen
	-1.0, 1.0,  0.0, // top left on screen
	1.0,  -1.0, 0.0, // bottom right on screen
	-1.0, -1.0, 0.0  // bottom left on screen
    ]);

    this.colours = new Float32Array ([
	1.0,  1.0,  1.0,  1.0,    // white
	1.0,  0.0,  0.0,  1.0,    // red
	0.0,  1.0,  0.0,  1.0,    // green
	0.0,  0.0,  1.0,  1.0     // blue
    ]);

    gl.useProgram(this.shaderProgram);
    
    this.squareVerticesBuffer = gl.createBuffer();
    this.squareVerticesColourBuffer = gl.createBuffer();    
    this.squareVerticesCoordinateBuffer = gl.createBuffer();

    this.vertexColourAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexColour');
    this.vertexCoordinateAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexCoordinate');

    this.parameterUniform = gl.getUniformLocation(this.shaderProgram,'param');
    this.colourUniform = gl.getUniformLocation(this.shaderProgram,'colour');
}

Fractal.prototype.doBindings = function() {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);


    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesColourBuffer);
    gl.vertexAttribPointer(this.vertexColourAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesCoordinateBuffer);
    gl.vertexAttribPointer(this.vertexCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordinates, gl.DYNAMIC_DRAW);
    
    gl.uniform4fv(this.colourUniform,this.colour);
    gl.uniform2fv(this.parameterUniform, this.parameters);
}

Fractal.prototype.enableProgram = function() {
    gl.useProgram(this.shaderProgram);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);    
    gl.enableVertexAttribArray(this.vertexColourAttribute);
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);
    
}

Fractal.prototype.draw = function(m) {
    this.enableProgram();
    this.doBindings();

    setMatrixUniforms(this.shaderProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.mvpMatrix = perspectiveMatrix.x(currentMatrix());
}

Fractal.prototype.setCoordinates = function() {
    this.coordinates = new Float32Array([
	this.viewport[2],this.viewport[3],
	this.viewport[0],this.viewport[3],
	this.viewport[2],this.viewport[1],
	this.viewport[0],this.viewport[1]
    ]);
}

Fractal.prototype.setParameter = function(c) {
    this.parameters = new Float32Array(c);
}

Fractal.prototype.getCentre = function() {
    var x = .5*(this.viewport[2] + this.viewport[0]);
    var y = .5*(this.viewport[3] + this.viewport[1]);
    return [x,y];
}

Fractal.prototype.getViewport = function() {
    return this.viewport;
}

Fractal.prototype.isTouchedBy = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    if (Math.abs(pt.x) < 1 && Math.abs(pt.y) < 1)
	return true;
    return false;
}

Fractal.prototype.convertToViewport = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    
    // Convert to viewport coordinates
    var x = pt.x * this.viewport[2] + (1 - pt.x) * this.viewport[0];
    var y = pt.y * this.viewport[3] + (1 - pt.y) * this.viewport[1];
    return {x: x, y: y};
}


Fractal.prototype.doWheel = function(e) {
    var pt = this.convertToViewport(e);
    var s = Math.pow(1.001,e.deltaY);

    // Adjust the viewport
    this.viewport[0] = s*(this.viewport[0] - pt.x) + pt.x;
    this.viewport[1] = s*(this.viewport[1] - pt.y) + pt.y;
    this.viewport[2] = s*(this.viewport[2] - pt.x) + pt.x;
    this.viewport[3] = s*(this.viewport[3] - pt.y) + pt.y;
    this.setCoordinates();
}

Fractal.prototype.doMouseDown = function(e) {
    if (e.button != 0)
	return;
    this.mouseIsMoving = false;
    this.mousept = this.convertToViewport(e);
}

Fractal.prototype.doMouseMove = function(e) {
    if (e.buttons != 1)
	return;
    this.mouseIsMoving = true;
    
    var pt = this.convertToViewport(e);
    var dx = pt.x - this.mousept.x;
    var dy = pt.y - this.mousept.y;
    
    // Adjust the viewport
    this.viewport[0] -= dx;
    this.viewport[1] -= dy;
    this.viewport[2] -= dx;
    this.viewport[3] -= dy;
    this.setCoordinates();
}

Fractal.prototype.doMouseUp = function(e) {
    if (e.button != 0)
	return;
    if (!this.mouseIsMoving) {
	this.viewport = this.defaultViewport.slice();
	this.setCoordinates();
    }
    this.mouseIsMoving = false;
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
    } else {
        x = event.layerX;
	y = event.layerY;
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
