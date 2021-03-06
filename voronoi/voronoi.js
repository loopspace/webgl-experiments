
// Voronoi class
function Voronoi() {
    this.coordinates = new Float32Array([
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0
    ]);
    this.points = new Float32Array([
	0.125,0.125,
	0.125,0.375,
	0.125,0.625,
	0.125,0.875,
	0.375,0.125,
	0.375,0.375,
	0.375,0.625,
	0.375,0.875,
	0.625,0.125,
	0.625,0.375,
	0.625,0.625,
	0.625,0.875,
	0.875,0.125,
	0.875,0.375,
	0.875,0.625,
	0.875,0.875,
    ]);
    var params = [];
    for (var i = 0; i < 16; i++) {
	params.push(1+Math.random())
	params.push(Math.random()*.25)
	params.push(1+Math.random())
    }
    this.params = new Float32Array(params);
    var dblparams = [];
    for (var i = 0; i < 16; i++) {
	dblparams.push(1);
	dblparams.push(0);
	dblparams.push(1);
    }
    this.dblparams = new Float32Array(dblparams);
    this.dblpoints = new Float32Array([
	0.25,0.5,
	0.75,0.5,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
	0.0,0.0,
    ]);
    this.numpoints = 2;
    this.useWeights = false;
    this.useDelays = false;
    this.useExtents = false;
    this.linear = true;
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
    this.paramsUniform = gl.getUniformLocation(this.shaderProgram,'params');
    this.numPointsUniform = gl.getUniformLocation(this.shaderProgram,'np');
    this.useWeightsUniform = gl.getUniformLocation(this.shaderProgram,'wgts');
    this.useDelaysUniform = gl.getUniformLocation(this.shaderProgram,'dlys');
    this.useExtentsUniform = gl.getUniformLocation(this.shaderProgram,'exts');
    this.isLinearUniform = gl.getUniformLocation(this.shaderProgram,'lin');
}

Voronoi.prototype.doBindings = function() {
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesCoordinateBuffer);
    gl.vertexAttribPointer(this.vertexCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordinates, gl.DYNAMIC_DRAW);
    
    //    gl.uniform2fv(this.parameterUniform, this.parameters);
    if (this.numpoints == 2) {
	gl.uniform2fv(this.pointsUniform, this.dblpoints);
	gl.uniform3fv(this.paramsUniform, this.dblparams);
	gl.uniform1f(this.useDelaysUniform, 1);
	gl.uniform1f(this.useExtentsUniform, 1);
	gl.uniform1f(this.useWeightsUniform, 1);
    } else {
	gl.uniform2fv(this.pointsUniform, this.points);
	gl.uniform3fv(this.paramsUniform, this.params);
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
    }
    if (this.linear) {
	gl.uniform1f(this.isLinearUniform, 1);
    } else {
	gl.uniform1f(this.isLinearUniform, 0);
    }
    gl.uniform1f(this.numPointsUniform, this.numpoints);

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

Voronoi.prototype.setType = function(b) {
    if (b) {
	this.numpoints = 16;
    } else {
	this.numpoints = 2;
    }
}

Voronoi.prototype.setLinear = function(b) {
    this.linear = b;
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
    var x,y,d,dd,p;
    d = 4;
    p = 0;
    var pts;
    if (this.numpoints == 2) {
	pts = this.dblpoints;
    } else {
	pts = this.points;
    }
    for (var i = 0; i < this.numpoints; i++) {
	x = pts[2*i];
	y = pts[2*i+1];
	dd = Math.pow(this.mousept.x - x,2) + Math.pow(this.mousept.y - y,2);
	if (dd < d) {
	    d = dd;
	    p = 2*i;
	}
    }
    this.touchpt = p;
    this.touchoffset = [this.mousept.x - pts[p],this.mousept.y - pts[p+1]];
    this.touchpts = pts;
}

Voronoi.prototype.doMouseMove = function(e) {
    if (e.buttons != 1)
	return;
    this.mouseIsMoving = true;
    
    var pt = convertPoint(e,this.mvpMatrix);
    this.touchpts[this.touchpt] = pt.x - this.touchoffset[0];
    this.touchpts[this.touchpt+1] = pt.y - this.touchoffset[1];
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
