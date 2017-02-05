var gl; // A global variable for the WebGL context

var width;
var height;

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

    julia = new Fractal('julia',[-2,-2,2,2],[0.0,0.0,1.0,1.0]);
    mandel = new Fractal('mandel',[-2.25,-1.625,1,1.625],[1.0,0.0,0.0,1.0]);

    drawScene();
    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);

    window.addEventListener('resize',resetSize);

    var btn = document.getElementById('showButton');
    btn.addEventListener('click',showParameters);
    showParameters();
}

function resetSize() {
    var canvas = document.getElementById('glCanvas');
    width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;

    width -= 25;
    height -= 25;

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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

function showParameters() {
    showParametersAux(mandel);
    showParametersAux(julia);
}

function showParametersAux(f) {
    var vp,td;
    vp = f.getViewport();
    td = document.getElementById(f.name + '_ll');
    td.innerHTML = '(' + vp[0] + ',' + vp[1] + ')';
    td = document.getElementById(f.name + '_ur');
    td.innerHTML = '(' + vp[2] + ',' + vp[3] + ')';
    vp = f.getCentre();
    td = document.getElementById(f.name + '_ce');
    td.innerHTML = '(' + vp[0] + ',' + vp[1] + ')';
}

function drawScene() {
    julia.setParameter(mandel.getCentre());
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clearMatrices();

    perspectiveMatrix = makePerspective(45, width/height, 0.1, 100.0);

    var z = -1/Math.tan(Math.PI/8);
    z = Math.min(z,z*height/width*2.2);
    mvTranslate([-0.0, 0.0, z]);

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
