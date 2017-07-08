var gl; // A global variable for the WebGL context

var width;
var height;
var aspect;

// Matrix stack
var matrixStack = [];

// Perspective matrix
var perspectiveMatrix;

// Current touched object
var fractalInTouch;

function start() {
    var canvas = document.getElementById('glCanvas');
    width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;

    width -= 25;
    height -= 25;

    aspect = Math.min(width/2,height/2) - 25;

    canvas.width = width;
    canvas.height = height;

    // Initialize the GL context
    gl = initWebGL(canvas);

    // Only continue if WebGL is available and working
    if (!gl) {
	return;
    }


    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    img = new Image('shaderText','defaultImage',[1.0,0.0,0.0,1.0]);

    drawScene();
    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);

    canvas.addEventListener('touchstart',doTouchStart);
    canvas.addEventListener('touchmove',doTouchMove);
    canvas.addEventListener('touchend',doTouchEnd);
    
    window.addEventListener('resize',resetSize);

    var btn = document.getElementById('redraw');
    btn.addEventListener('click',drawScene);
    btn = document.getElementById('reset');
    btn.addEventListener('click',resetShaderText);
}

function resetSize() {
    var canvas = document.getElementById('glCanvas');
    width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;

    width *= .7;
    width -= 25;
    width = Math.floor(width);
    height -= 25;

    aspect = Math.min(width/2,height/2) - 25;

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    drawScene();
}

function resetShaderText() {
    var txt = document.getElementById('shaderText');
    txt.value = "lowp vec4 c = texture2D(texture, vTexcoord);\nc *= vColour;\n// Your code in here\ngl_FragColor = c;"
    drawScene();
}

function initWebGL(canvas) {
    gl = null;
  
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
    // If we don't have a GL context, give up now
    if (!gl) {
	alert('Unable to initialize WebGL. Your browser may not support it.');
    }
  
    return gl;
}


function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clearMatrices();

    //    perspectiveMatrix = makePerspective(45, width/height, 0.1, 100.0);
    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([aspect,aspect,1]);
    img.draw();
    popMatrix();
}

function multMatrix(m) {
    matrixStack[matrixStack.length - 1] = matrixStack[matrixStack.length - 1].x(m);
}

function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function mvScale(v) {
    multMatrix(Matrix.Scale($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms(s) {
    var pUniform = gl.getUniformLocation(s, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(s, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(currentMatrix().flatten()));
}

function doWheel(e) {
    if (mandel.isTouchedBy(e)) {
	mandel.doWheel(e);
	drawScene();
    } else if (julia.isTouchedBy(e)) {
	julia.doWheel(e);
	drawScene();
    }
}

function doMouseDown(e) {
    fractalInTouch = null;
    if (mandel.isTouchedBy(e)) {
	mandel.doMouseDown(e);
	fractalInTouch = mandel;
	drawScene();
    } else if (julia.isTouchedBy(e)) {
	julia.doMouseDown(e);
	fractalInTouch = julia;
	drawScene();
    }
}

function doMouseMove(e) {
    if (fractalInTouch) {
	fractalInTouch.doMouseMove(e);
	drawScene();
    }
}

function doMouseUp(e) {
    if (fractalInTouch) {
	fractalInTouch.doMouseUp(e);
	drawScene();
    }
}

var ongoingTouches = [];

function doTouchStart(e) {
    e.preventDefault();
    var update = false;
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
	if (mandel.isTouchedBy(touches[i])) {
	    ongoingTouches.push([mandel,copyTouch(touches[i])]);
	    mandel.doTouchStart(touches[i]);
	    update = true;
	} else if (julia.isTouchedBy(touches[i])) {
	    ongoingTouches.push([julia,copyTouch(touches[i])]);
	    julia.doTouchStart(touches[i]);
	    update = true;
	}
    }
    if (update) {
	drawScene();
    }
}

function doTouchMove(e) {
    e.preventDefault();
    var update = false;
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
	var idx = ongoingTouchIndexById(touches[i].identifier);
	if (idx >= 0) {
	    ongoingTouches[idx][1] = copyTouch(touches[i]);
	    ongoingTouches[idx][0].doTouchMove(touches[i]);
	    update = true;
	}
    }
    if (update) {
	drawScene();
    }
}

function doTouchEnd(e) {
    e.preventDefault();
    var update = false;
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
	var idx = ongoingTouchIndexById(touches[i].identifier);

	if (idx >= 0) {
	    ongoingTouches[idx][0].doTouchEnd(touches[i]);
	    ongoingTouches.splice(idx,1);
	    update = true;
	}
    }
    if (update) {
	drawScene();
    }
}

function pushMatrix() {
    var m = matrixStack[matrixStack.length - 1].dup();
    matrixStack.push(m);
}

function popMatrix() {
    if (matrixStack.length > 1)
	matrixStack.pop();
}

function resetMatrix() {
    matrixStack[matrixStack.length - 1] = Matrix.I(4);
}

function currentMatrix() {
    return matrixStack[matrixStack.length - 1];
}

function clearMatrices() {
    matrixStack = [Matrix.I(4)];
}

function copyTouch(touch) {
    return {id: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, target: touch.target}
}

function ongoingTouchIndexById(idToFind) {
  for (var i = 0; i < ongoingTouches.length; i++) {
    var id = ongoingTouches[i][1].id;
    
    if (id == idToFind) {
      return i;
    }
  }
  return -1;    // not found
}
