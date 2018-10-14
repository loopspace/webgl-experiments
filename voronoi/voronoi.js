
// Voronoi class
function Voronoi() {
    this.coordinates = new Float32Array([
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0
    ]);
    this.points = new Float32Array([
	0.2,0.2,
	0.2,0.4,
	0.2,0.6,
	0.2,0.8,
	0.4,0.2,
	0.4,0.4,
	0.4,0.6,
	0.4,0.8,
	0.6,0.2,
	0.6,0.4,
	0.6,0.6,
	0.6,0.8,
	0.8,0.2,
	0.8,0.4,
	0.8,0.6,
	0.8,0.8,
    ]);
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

    this.vertexCoordinateAttribute = gl.getAttribLocation(this.shaderProgram, 'aVertexCoordinate');

//    this.parameterUniform = gl.getUniformLocation(this.shaderProgram,'params');
    this.pointsUniform = gl.getUniformLocation(this.shaderProgram,'pts');
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
    var x,y,d,dd,p;
    d = 4;
    p = 0;
    for (var i = 0; i < 16; i++) {
	x = this.points[2*i];
	y = this.points[2*i+1];
	dd = Math.pow(this.mousept.x - x,2) + Math.pow(this.mousept.y - y,2);
	if (dd < d) {
	    d = dd;
	    p = 2*i;
	}
    }
    this.touchpt = p;
    this.touchoffset = [this.mousept.x - this.points[p],this.mousept.y - this.points[p+1]];
}

Voronoi.prototype.doMouseMove = function(e) {
    if (e.buttons != 1)
	return;
    this.mouseIsMoving = true;
    
    var pt = convertPoint(e,this.mvpMatrix);
    this.points[this.touchpt] = pt.x - this.touchoffset[0];
    this.points[this.touchpt+1] = pt.y - this.touchoffset[1];
    this.draw();
}

Voronoi.prototype.doMouseUp = function(e) {
    if (e.button != 0)
	return;
    this.mouseIsMoving = false;
}

Voronoi.prototype.doTouchStart = function(e) {
    this.touchIsMoving = false;
    this.touchpt = convertPoint(e,this.mvpMatrix);
}

Voronoi.prototype.doTouchMove = function(e) {
    this.touchIsMoving = true;
    
    var pt = this.convertToViewport(e);
    var dx = pt.x - this.touchpt.x;
    var dy = pt.y - this.touchpt.y;
    
    // Adjust the viewport
    this.viewport[0] -= dx;
    this.viewport[1] -= dy;
    this.viewport[2] -= dx;
    this.viewport[3] -= dy;
    this.setCoordinates();
}

Voronoi.prototype.doTouchEnd = function(e) {
    if (!this.touchIsMoving) {
	this.viewport = this.defaultViewport.slice();
	this.setCoordinates();
    }
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
