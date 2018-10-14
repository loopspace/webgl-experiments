var gl; // A global variable for the WebGL context

var width;
var height;
var aspect;

// Matrix stack
var matrixStack = [];

// Perspective matrix
var perspectiveMatrix;

// Current touched object
var voronoiInTouch;

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

    aspect = Math.min(width/4,height/2) - 25;

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

    voronoi = new Voronoi();

    drawScene();
    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);

    canvas.addEventListener('touchstart',doTouchStart);
    canvas.addEventListener('touchmove',doTouchMove);
    canvas.addEventListener('touchend',doTouchEnd);
    
    window.addEventListener('resize',resetSize);

    var btn = document.getElementById('showButton');
    //btn.addEventListener('click',showParameters);
    //showParameters();
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

    aspect = Math.min(width/4,height/2) - 25;

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
//    julia.setParameter(mandel.getCentre());
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clearMatrices();

    //    perspectiveMatrix = makePerspective(45, width/height, 0.1, 100.0);
    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([aspect,aspect,1]);
    voronoi.draw();
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
}

function doMouseDown(e) {
    voronoiInTouch = null;
    if (voronoi.isTouchedBy(e)) {
	voronoi.doMouseDown(e);
	voronoiInTouch = true;
	drawScene();
    }
}

function doMouseMove(e) {
    if (voronoiInTouch) {
	voronoi.doMouseMove(e);
	drawScene();
    }
}

function doMouseUp(e) {
    if (voronoiInTouch) {
	voronoi.doMouseUp(e);
	drawScene();
    }
}

var ongoingTouches = [];

function doTouchStart(e) {
    e.preventDefault();
    var update = false;
    var touches = e.changedTouches;

    for (var i = 0; i < touches.length; i++) {
	if (voronoi.isTouchedBy(touches[i])) {
	    ongoingTouches.push([voronoi,copyTouch(touches[i])]);
	    voronoi.doTouchStart(touches[i]);
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
