var gl; // A global variable for the WebGL context
var imggl; // A global variable for the WebGL context
var reggl;

var width;
var height;
var imgsize;
var aspect;
var pitchAspect;

var debug = false;

var voronoi;
var average;

// Matrix stack
var matrixStack = [];

// Perspective matrix
var perspectiveMatrix;

// Current mouse object
var mouseObject;

// Parse query string
var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

function queryBoolean(key,def) {
    var b = def;
    if ("no" + key in qs) {
	if (qs["no" + key].toLowerCase() != "false" && qs["no" + key] != "0") {
	    b = false;
	}
    }
    if (key in qs) {
	if (qs[key].toLowerCase() == "false" || qs[key] == "0") {
	    b = false;
	}
    }
    return b;
}

// Based on http://stackoverflow.com/a/21059677

function start() {
    var canvas = document.getElementById('glCanvas');
    var imgcanvas = document.getElementById('imgCanvas');
    var regcanvas = document.getElementById('regionCanvas');
    var pitch = document.getElementById('pitch');

    pitchAspect = pitch.width/pitch.height;
    
    width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;

    width -= 25;
    height -= 25;
    width /= pitchAspect;
    var size = Math.min(width,height);
    width = pitchAspect * size;
    height = size;

    aspect = Math.min(width/2,height);// - 25;
//    aspect *= .8;

    canvas.width = width;
    canvas.height = height;

    imgsize = Math.max(width, height);

    var ptwo = 1;
    while (imgsize > 0) {
	imgsize >>= 1;
	ptwo <<= 1;
    }
    imgsize = ptwo;
    
    imgcanvas.width = imgsize;
    imgcanvas.height = imgsize;

    // Initialize the GL context
    gl = initWebGL(canvas);
    imggl = initWebGL(imgcanvas);
    reggl = initWebGL(regcanvas);

    // Only continue if WebGL is available and working
    if (!gl || !imggl || !reggl) {
	return;
    }

    voronoi = new Voronoi([gl,imggl],pitch);
    average = new Average(reggl);

    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);
    
    canvas.addEventListener('touchstart',doTouchStart);
    canvas.addEventListener('touchmove',doTouchMove);
    canvas.addEventListener('touchend',doTouchEnd);
    
    window.addEventListener('resize',resetSize);

    var chkbx = document.getElementById('tmA');
    chkbx.addEventListener('change', setFootballTeams);
    chkbx.checked = queryBoolean("teamA",false);

    chkbx = document.getElementById('tmB');
    chkbx.addEventListener('change', setFootballTeams);
    chkbx.checked = queryBoolean("teamB",true);

    setFootballTeams();
    drawScene();
    /*
    setVoronoiDistanceAux(chkbx);

    var elt;
    elt = document.getElementById('wgt');
    elt.addEventListener('change', setVoronoiParams);
    if (qs.weight) elt.value = qs.weight;
    elt = document.getElementById('dis');
    elt.addEventListener('change', setVoronoiParams);
    if (qs.delay) elt.value = qs.delay;
    elt = document.getElementById('qnt');
    elt.addEventListener('change', setVoronoiParams);
    if (qs.extent) elt.value = qs.extent;

    elt = document.getElementById('wgts');
    elt.addEventListener('change', setVoronoiParams);
    elt.checked = queryBoolean("weights",false);
    
    elt = document.getElementById('dlys');
    elt.addEventListener('change', setVoronoiParams);
    elt.checked = queryBoolean("delays",false);

    elt = document.getElementById('exts');
    elt.addEventListener('change', setVoronoiParams);
    elt.checked = queryBoolean("extents",false);

    setVoronoiParams();
//    elt = document.getElementById('qnt');
//    c = elt.value;
//    elt.addEventListener('change', setVoronoiParams);

    elt = document.getElementById('regenerate');
    elt.addEventListener('click', regenVoronoi);
    */
    //btn.addEventListener('click',showParameters);
    //showParameters();
    /*
      Make the question mark toggle the help pane
     */
    var hlnk = document.getElementById('helplink');
    var hdv = document.getElementById('help');
    hlnk.addEventListener('click', function(e) {
        e.preventDefault();
        if (hdv.style.display == 'none' || hdv.style.display == '') {
            hdv.style.display = 'block';
        } else {
            hdv.style.display = 'none';
        }
        return false;
    });
    /*
      Set the help pane height to the window height,
      Should probably update on resize
     */
    var h = window.innerHeight - 20;
    hdv.style.height = h + 'px';

    //    document.getElementById("dl").addEventListener('click', dlCanvas, false);
}

/* From https://stackoverflow.com/a/12796748/315213 */
/* REGISTER DOWNLOAD HANDLER */
/* Only convert the canvas to Data URL when the user clicks. 
   This saves RAM and CPU ressources in case this feature is not required. */
function dlCanvas() {
    var canvas = document.getElementById('glCanvas');
    var dt = canvas.toDataURL('image/png');
    /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
    dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

    /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
    dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');

    this.href = dt;
};

function resetSize() {
    var hdv = document.getElementById('help');
    /*
      Set the help pane height to the window height,
     */
    var h = window.innerHeight - 20;
    hdv.style.height = h + 'px';

    
    var canvas = document.getElementById('glCanvas');
    var pitch = document.getElementById('pitch');

    var pitchAspect = pitch.width/pitch.height;

    width = window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    height = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;

    width -= 25;
    height -= 25;
    width /= pitchAspect;
    var size = Math.min(width,height);
    width = size*pitchAspect;
    height = size;

    aspect = Math.min(width/2,height);// - 25;
//    aspect *= .8;

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    imggl.viewport(0, 0, imggl.canvas.width, imggl.canvas.height);
    drawScene();
}

function initWebGL(canvas) {
    var gl = null;
  
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true}) || canvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
  
    // If we don't have a GL context, give up now
    if (!gl) {
	alert('Unable to initialize WebGL. Your browser may not support it.');
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    return gl;
}

function setFootballTeams() {
    var chkbxA = document.getElementById('tmA');
    var chkbxB = document.getElementById('tmB');

    var teams = 0;
    if (chkbxA.checked) teams += 1;
    if (chkbxB.checked) teams += 2;

    if (teams == 0) {
	teams = 1;
	chkbxA.checked = true;
    }

    var pcs = document.getElementsByClassName('percentage');
    var show;
    if (teams == 3) {
	show = 'table-cell';
    } else {
	show = 'none';
    }

    for (var i = 0; i < pcs.length; i++) {
	pcs[i].style.display = show;
    }
    
    voronoi.setTeams(teams);
    drawScene();
}

function setVoronoiDistance(e) {
    setVoronoiDistanceAux(e.target);
}

function setVoronoiDistanceAux(e) {
    voronoi.setLinear(e.checked);
    toggleElements();
    drawScene();
}

function toggleElements() {
    var lin = document.getElementById('linear').checked;
    var mul = document.getElementById('npts').checked;
    var linelts = document.getElementsByClassName('linear');
    var logelts = document.getElementsByClassName('log');
    var mulelts = document.getElementsByClassName('multipleparam');
    var sinelts = document.getElementsByClassName('singleparam');

    var lon, loff, mon, moff, loffclass, moffclass;
    if (lin) {
	lon = linelts;
	loff = logelts;
	loffclass = 'log';
    } else {
	lon = logelts;
	loff = linelts;
	loffclass = 'linear';
    }
    if (mul) {
	mon = mulelts;
	moff = sinelts;
	moffclass = 'singleparam';
    } else {
	mon = sinelts;
	moff = mulelts;
	moffclass = 'multipleparam';
    }

    for (var i = 0; i < loff.length; i++) {
	loff[i].style.display = 'none';
    }
    for (var i = 0; i < moff.length; i++) {
	moff[i].style.display = 'none';
    }
    for (var i = 0; i < lon.length; i++) {
	if (!lon[i].classList.contains(moffclass)) {
	    lon[i].style.display = 'table-row';
	}
    }
    for (var i = 0; i < mon.length; i++) {
	if (!mon[i].classList.contains(loffclass)) {
	    mon[i].style.display = 'table-row';
	}
    }
}

function setVoronoiParams(e) {
    var elt, a,b,c,d,e,f;
    elt = document.getElementById('wgt');
    a = elt.value;

    elt = document.getElementById('dis');
    b = elt.value;

    elt = document.getElementById('qnt');
    c = elt.value;
    
    elt = document.getElementById('wgts');
    d = elt.checked;

    elt = document.getElementById('dlys');
    e = elt.checked;

    elt = document.getElementById('exts');
    f = elt.checked;

    voronoi.setParams(a,b,c,d,e,f);
    drawScene();
}    

function regenVoronoi(e) {
    voronoi.regenerate();
    drawScene();
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
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clearMatrices();

    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([width/2,height/2,1]);
    voronoi.drawPitch();
    popMatrix();

    imggl.clear(imggl.COLOR_BUFFER_BIT | imggl.DEPTH_BUFFER_BIT);
    clearMatrices();

    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([width/2,height/2,1]);
    voronoi.drawRegions();
    popMatrix();

    setImage();
}

function setImage() {
    var canvas = document.getElementById('imgCanvas');
    var prev = document.getElementById('regions');
    canvas.toBlob(function(b) {
        prev.src = window.URL.createObjectURL(b);
        prev.addEventListener('load',function() {
            window.URL.revokeObjectURL(b);
	    average.setTexture(prev);
	    drawAverage();
        }, {once: true});
    });
}

function drawAverage() {
    reggl.clear(reggl.COLOR_BUFFER_BIT | reggl.DEPTH_BUFFER_BIT);
    clearMatrices();

    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([width/2,height/2,1]);
    average.draw();
    popMatrix();

//    var w = reggl.drawingBufferWidth;
//    var h = reggl.drawingBufferHeight;

//    w = Math.floor(w/2);
//    h = Math.floor(h/2);

    var pixels = new Uint8Array(
	4
    );
    reggl.readPixels(
	0,
	0,
	1,
	1,
	reggl.RGBA,
	reggl.UNSIGNED_BYTE,
	pixels
    );

    var a = pixels[2];
    var b = pixels[0];

    var pA = Math.round(a/(a + b)*100);
    var pB = 100 - pA;

    var tdA = document.getElementById('teamApc');
    var txt = document.createTextNode(pA + "%");
    tdA.innerHTML = '';
    tdA.appendChild(txt);
    var tdB = document.getElementById('teamBpc');
    txt = document.createTextNode(pB + "%");
    tdB.innerHTML = '';
    tdB.appendChild(txt);

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

function setMatrixUniforms(s,gl) {
    var pUniform = gl.getUniformLocation(s, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(s, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(currentMatrix().flatten()));
}

function doWheel(e) {
}

function doMouseDown(e) {
    mouseObject = null;
    if (voronoi.isOnImage(e)) {
	voronoi.doMouseDown(e);
	mouseObject = voronoi;
	drawScene();
    }
}

function doMouseMove(e) {
    if (mouseObject) {
	mouseObject.doMouseMove(e);
	drawScene();
    }
}

function doMouseUp(e) {
    if (mouseObject) {
	mouseObject.doMouseUp(e);
	mouseObject = null;
	drawScene();
    }
}

var ongoingTouches = [];

function doTouchStart(e) {
    setMessage("Touch start");
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
    setMessage("Touch move");
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
    setMessage("Touch end");
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


function setMessage(s) {
    if (debug) {
	var txt = document.createTextNode(s);
	var msgelt = document.getElementById("message");
	msgelt.innerHTML = '';
	msgelt.appendChild(txt);
    }
}
