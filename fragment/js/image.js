var errorfn;


// Image class
function Image(s,c) {
    this.valid = true;
    this.source = s;
//    this.colour = new Float32Array(c);
    this.textures = [];
    this.setColours([
	[1.,1.,1.,1.],
	[1.,1.,1.,1.],
	[1.,1.,1.,1.],
	[1.,1.,1.,1.]
    ]);
}

Image.prototype.setError = function(fn) {
    errorfn = fn;
}

Image.prototype.initialise = function() {
    this.valid = true;
    this.initShaders();
    this.initBuffers();
}

Image.prototype.initShaders = function() {
    if (!this.valid) {
	return null;
    }
    var fragmentShader = getShader(gl,[this.getTextures(), 'shader-pre-fs',this.source, 'shader-post-fs']);
    var vertexShader = getShader(gl, 'shader-vs');
    if (!fragmentShader || !vertexShader) {
	this.valid = false;
	return null;
    }
  
    // Create the shader program
  
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	this.valid = false;
	errorfn('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  
    gl.useProgram(shaderProgram);

    this.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPosition');
    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    
    this.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'vertexColor');
    gl.enableVertexAttribArray(this.vertexColorAttribute);

    this.vertexCoordinateAttribute = gl.getAttribLocation(shaderProgram, 'textureCoordinate');
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);

    this.shaderProgram = shaderProgram;
}

Image.prototype.initBuffers = function() {
    if (!this.valid) {
	return null;
    }
    this.getImage();

    var w = this.halfwidth;
    var h = this.halfheight;
    
    this.vertices = new Float32Array([
	w,  h,  0.0, // top right on screen
	-w, h,  0.0, // top left on screen
	w,  -h, 0.0, // bottom right on screen
	-w, -h, 0.0  // bottom left on screen
    ]);

    this.coordinates = new Float32Array ([
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0,
    ]);
    
    gl.useProgram(this.shaderProgram);
    
    this.squareVerticesBuffer = gl.createBuffer();
    this.squareVerticesColorBuffer = gl.createBuffer();    
    this.squareVerticesCoordinateBuffer = gl.createBuffer();

    for (var i = 0; i < this.textures.length; i++) {
	this.textures[i].texture = gl.createTexture();
	this.textures[i].width = gl.getUniformLocation(this.shaderProgram,'width' + (i == 0 ? "" : i));
	this.textures[i].height = gl.getUniformLocation(this.shaderProgram,'height' + (i == 0 ? "" : i));
    }
//    this.texture = gl.createTexture();

    this.vertexColorAttribute = gl.getAttribLocation(this.shaderProgram, 'vertexColor');
    this.vertexCoordinateAttribute = gl.getAttribLocation(this.shaderProgram, 'textureCoordinate');
    this.deltaTimeUniform = gl.getUniformLocation(this.shaderProgram,'DeltaTime');

}

Image.prototype.getImage = function() {
    var img = this.textures[0].image;
    var w = img.width;
    var h = img.height;
    this.halfwidth = w/Math.max(w,h);
    this.halfheight = h/Math.max(w,h);
}

Image.prototype.getTextures = function() {
    var str = "";
    for (var i = 0; i < this.textures.length; i++) {
	str += "uniform sampler2D " + this.textures[i].name + ";\n";
	str += "uniform highp float width" + (i == 0 ? "" : i) + ";\n";
	str += "uniform highp float height" + (i == 0 ? "" : i) + ";\n";
    }
    return str;
}

Image.prototype.doBindings = function() {
    if (!this.valid) {
	return null;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);


    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesColorBuffer);
    gl.vertexAttribPointer(this.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesCoordinateBuffer);
    gl.vertexAttribPointer(this.vertexCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordinates, gl.DYNAMIC_DRAW);

    for (var i = 0; i < this.textures.length; i++) {
	this.bindTexture(i);
    }

    gl.uniform1f(this.deltaTimeUniform,.5);
//    gl.uniform4fv(this.colourUniform,this.colour);

}

Image.prototype.bindTexture = function(i) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[i].texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures[i].image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, this.textures[i].name), i);
//    gl.bindTexture(gl.TEXTURE_2D, null);

    var img = this.textures[i].image;
    var w = img.width;
    var h = img.height;
    gl.uniform1f(this.textures[i].width,w);    
    gl.uniform1f(this.textures[i].height,h);    
}

Image.prototype.updateTime = function(dt) {
    gl.uniform1f(this.deltaTimeUniform,dt);    
}

Image.prototype.enableProgram = function() {
    gl.useProgram(this.shaderProgram);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);    
    gl.enableVertexAttribArray(this.vertexColorAttribute);
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);
    
}

Image.prototype.reloadShader = function() {
    this.valid = true;
    this.initShaders();
    this.initBuffers();
}

Image.prototype.setup = function() {
    this.enableProgram();
    this.doBindings();
    if (!this.valid) {
	return null;
    }
}

Image.prototype.draw = function(dt) {
    this.updateTime(dt);
    setMatrixUniforms(this.shaderProgram);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.mvpMatrix = perspectiveMatrix.x(currentMatrix());
}

Image.prototype.setColours = function(c) {
    var nc = [];
    for (var i = 0; i < c.length; i++) {
	for (var j = 0; j < c[i].length; j++) {
	    nc.push(c[i][j]);
	}
    }
    this.colours = new Float32Array (nc);
}

Image.prototype.setTexture = function(i,t,img) {
    if (!this.textures[i]) {
	this.textures[i] = {};
    }
    this.textures[i].image = img;
    this.textures[i].name = t;
//    this.textures[i].location = gl["TEXTURE" + i];
}

Image.prototype.rmTexture = function() {
    this.textures.pop();
}

Image.prototype.setCoordinates = function() {
    this.coordinates = new Float32Array([
	this.viewport[2],this.viewport[3],
	this.viewport[0],this.viewport[3],
	this.viewport[2],this.viewport[1],
	this.viewport[0],this.viewport[1]
    ]);
}

Image.prototype.setParameter = function(c) {
    this.parameters = new Float32Array(c);
}

Image.prototype.getCentre = function() {
    var x = .5*(this.viewport[2] + this.viewport[0]);
    var y = .5*(this.viewport[3] + this.viewport[1]);
    return [x,y];
}

Image.prototype.getViewport = function() {
    return this.viewport;
}

Image.prototype.isTouchedBy = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    if (Math.abs(pt.x) < 1 && Math.abs(pt.y) < 1)
	return true;
    return false;
}

Image.prototype.convertToViewport = function(e) {
    var pt = convertPoint(e,this.mvpMatrix);
    
    // Convert to viewport coordinates
    var x = pt.x * this.viewport[2] + (1 - pt.x) * this.viewport[0];
    var y = pt.y * this.viewport[3] + (1 - pt.y) * this.viewport[1];
    return {x: x, y: y};
}


Image.prototype.doWheel = function(e) {
    var pt = this.convertToViewport(e);
    var s = Math.pow(1.001,e.deltaY);

    // Adjust the viewport
    this.viewport[0] = s*(this.viewport[0] - pt.x) + pt.x;
    this.viewport[1] = s*(this.viewport[1] - pt.y) + pt.y;
    this.viewport[2] = s*(this.viewport[2] - pt.x) + pt.x;
    this.viewport[3] = s*(this.viewport[3] - pt.y) + pt.y;
    this.setCoordinates();
}

Image.prototype.doMouseDown = function(e) {
    if (e.button != 0)
	return;
    this.mouseIsMoving = false;
    this.mousept = this.convertToViewport(e);
}

Image.prototype.doMouseMove = function(e) {
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

Image.prototype.doMouseUp = function(e) {
    if (e.button != 0)
	return;
    if (!this.mouseIsMoving) {
	this.viewport = this.defaultViewport.slice();
	this.setCoordinates();
    }
    this.mouseIsMoving = false;
}

Image.prototype.doTouchStart = function(e) {
    this.touchIsMoving = false;
    this.touchpt = this.convertToViewport(e);
}

Image.prototype.doTouchMove = function(e) {
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

Image.prototype.doTouchEnd = function(e) {
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
	    theSource += ids[i];
	} else {
	    if (shaderScript.nodeName == 'TEXTAREA') {
		theSource += shaderScript.value;
	    } else {
		theSource += shaderScript.text;
	    }
	}
    }
//    console.log(theSource);
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
	errorfn('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));  
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
