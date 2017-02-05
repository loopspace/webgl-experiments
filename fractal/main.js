var gl; // A global variable for the WebGL context
var canvas;

// Matrix stack
var matrixStack = [];

// Perspective matrix
var perspectiveMatrix;

// Current touched object
var fractalInTouch;

function start() {
    var canvas = document.getElementById('glCanvas');

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

    julia = new Fractal('julia',[-2,-2,2,2],[0.0,0.0,1.0,1.0]);
    mandel = new Fractal('mandel',[-2.25,-1.625,1,1.625],[1.0,0.0,0.0,1.0]);

    drawScene();
    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);
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

    perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
  
    mvTranslate([-0.0, 0.0, -4.0]);

    julia.setParameter(mandel.getCentre());
    
    pushMatrix();
    mvTranslate([-1.1, 0.0, 0.0]);
    mandel.draw();
    popMatrix();

    pushMatrix();
    mvTranslate([1.1, 0.0, 0.0]);
    julia.draw();
    popMatrix();

}

function multMatrix(m) {
    matrixStack[matrixStack.length - 1] = matrixStack[matrixStack.length - 1].x(m);
}

function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
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
