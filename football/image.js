function Image (gl,caller) {
    this.gl = gl;
    this.caller = caller;
    this.image = caller.texture;
    this.coordinates = new Float32Array([
	1.0, 1.0,
	0.0, 1.0,
	1.0, 0.0,
	0.0, 0.0
    ]);
    this.initShaders();
    this.initBuffers();
}

Image.prototype.initShaders = function() {
    var gl = this.gl;
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

    // Always need these buffers
    this.vertexPositionAttribute = gl.getAttribLocation(
	shaderProgram, 'aVertexPosition'
    );
    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    
    this.vertexCoordinateAttribute = gl.getAttribLocation(
	shaderProgram, 'aVertexCoordinate'
    );
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);

    this.shaderProgram = shaderProgram;
}

Image.prototype.initBuffers = function() {
    var gl = this.gl;
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

    this.uniforms = [];
    var buffers = this.caller.buffers;
    for (var i = 0; i < buffers.length; i++) {
	this.uniforms.push(
	    gl.getUniformLocation(this.shaderProgram,buffers[i][0])
	)
    }
}

Image.prototype.doBindings = function() {
    var gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVerticesCoordinateBuffer);
    gl.vertexAttribPointer(this.vertexCoordinateAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, this.coordinates, gl.DYNAMIC_DRAW);

    var buffers = this.caller.buffers;
    
    for (var i = 0; i < buffers.length; i++) {
	gl['uniform' + buffers[i][1] ](
	    this.uniforms[i],
	    this.caller[buffers[i][2]]
	);
    }

    this.bindTexture();
}

Image.prototype.bindTexture = function() {
    var gl = this.gl;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    if (isPowerOf2(this.image.width) && isPowerOf2(this.image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }    
    /*
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    */
//    gl.uniform1i(gl.getUniformLocation(this.shaderProgram, 'texture'), 0);
//    gl.bindTexture(gl.TEXTURE_2D, null);

}

Image.prototype.enableProgram = function() {
    var gl = this.gl;
    
    gl.useProgram(this.shaderProgram);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);    
    gl.enableVertexAttribArray(this.vertexCoordinateAttribute);
    
}

Image.prototype.draw = function() {
    var gl = this.gl;
    this.enableProgram();
    this.doBindings();

    setMatrixUniforms(this.shaderProgram,gl);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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

function isPowerOf2(v) {
    return (v & (v - 1)) == 0;
}
