var gl; // A global variable for the WebGL context

var width;
var height;
var aspect;
var start;

var img;

var start;
var animating;

// Matrix stack
var matrixStack = [];

// Perspective matrix
var perspectiveMatrix;

// Images
var imagesrcs = [
    "circles.png",
    "ColourGradient.png",
    "100_3780.jpg",
    "100_3781.jpg",
    "100_4087.jpg",
    "100_4100.jpg",
    "100_4116.jpg",
    "100_4127.jpg",
    "100_4201.jpg",
    "AutumnColours_96_1.jpg",
    "Bymarka_89.jpg",
    "NorwayAugust_117_1.jpg",
    "NorwayAugust_39_1.jpg",
    "NorwayOct_1.jpg",
    "NorwayOct_10_1.jpg",
    "NorwayOct_3_1.jpg",
    "NorwayOct_6_1.jpg",
    "P7255075.JPG",
    "P7255088.JPG",
    "P7255097.JPG",
    "ShakespeareBianca.png",
    "ShakespeareBrutus.png",
    "ShakespeareCleopatra.png",
    "ShakespeareCordelia.png",
    "ShakespeareDesdamona.png",
    "ShakespeareFalstaff.png",
    "ShakespeareHamlet.png",
    "ShakespeareHero.png",
    "ShakespeareJuliet.png",
    "ShakespeareKent.png",
    "ShakespeareLadyMacbeth.png",
    "ShakespeareMacbeth.png",
    "ShakespeareRomeo.png",
    "ShakespeareYago.png",
    "silhouette-animaux-01.png",
    "silhouette-animaux-03.png",
    "silhouette-animaux-05.png",
    "silhouette-animaux-12.png",
    "silhouette-animaux-13.png",
    "silhouette-animaux-14.png",
    "silhouette-animaux-16.png",
    "silhouette-animaux-17.png",
    "silhouette-animaux-18.png",
    "silhouette-animaux-25.png",
    "silhouette-animaux-28.png",
    "rectangle.png",
    "ellipse.png",
    "diamond.png",
    "trapezium.png",
    "semicircle.png",
    "hexagon.png",
    "octagon.png",
    "star.png",
    "kite.png",
    "dart.png",
    "sector.png",
    "cloud.png",
    "starburst.png",
    "signal.png",
    "tape.png",
    "arrow.png",
    "ellipseCallout.png",
    "rectangleCallout.png",
    "cloudCallout.png",
    "roundedRectangle.png",
    "chamferedRectangle.png",
];

var textures = [
    'texture'
];

var images = [];

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

    var shtxt = localStorage.getItem('shader');
    if (shtxt) {
	var shader = document.getElementById('shaderText');
	shader.value = shtxt;
    } else {
	resetShaderText();
    }
    var tlen = localStorage.getItem('textures');
    if (tlen) {
	tlen = parseInt(tlen,10);
	if (tlen > 1) {
	    for (var i = 1; i < tlen; i++) {
		addTexture();
	    }
	}
    }


    // Set clear color to black, fully opaque
    var col = document.getElementById('bg').value;
    var b = parseInt(col.substr(5,2),16)/255;
    var g = parseInt(col.substr(3,2),16)/255;
    var r = parseInt(col.substr(1,2),16)/255;
    gl.clearColor(r,g,b, 1.0);
    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    // Near things obscure far things
    gl.depthFunc(gl.LEQUAL);
    // Clear the color as well as the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Enable blending so that alpha works as expected
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    img = new Image('shaderText',[1.0,0.0,0.0,1.0]);
    img.setError(doError);

    canvas.addEventListener('wheel',doWheel);
    canvas.addEventListener('mousedown',doMouseDown);
    canvas.addEventListener('mousemove',doMouseMove);
    canvas.addEventListener('mouseup',doMouseUp);

    canvas.addEventListener('touchstart',doTouchStart);
    canvas.addEventListener('touchmove',doTouchMove);
    canvas.addEventListener('touchend',doTouchEnd);
    
    var btn = document.getElementById('reload');
    btn.addEventListener('click',function() { loadShader(); drawScene(); });
    btn = document.getElementById('reset');
    btn.addEventListener('click',function() {resetShaderText(); drawScene(); });
    btn = document.getElementById('clear');
    btn.addEventListener('click',function() {clearShaderText(); });
    btn = document.getElementById('save');
    btn.addEventListener('click',function() {saveImage(); });

    btn = document.getElementById('imgload');
    btn.addEventListener('change',addImage);
    btn.value = "";

    btn = document.getElementById('addtex');
    btn.addEventListener('click',function() {addTexture(); setTextures(); loadShader(); });

    btn = document.getElementById('rmtex');
    btn.addEventListener('click',function() {rmTexture(); setTextures(); loadShader(); });

    var chbx = document.getElementById('animating');
    chbx.addEventListener('change',function(e) {
	animating = e.target.checked;
	drawScene();
    });
    animating = chbx.checked;
    
    var cols = ['ul','ur','bl','br'];
    var col;
    for (var i = 0; i < 4; i++) {
	col = document.getElementById(cols[i]);
	col.addEventListener('change',function() {setColours(); drawScene();});
    }

    col = document.getElementById('bg');
    col.addEventListener('change',function() {setBackground(); drawScene();});
    
    
    var sel;
    for (var i = 0; i < textures.length; i++) {
	sel = document.getElementById(textures[i]);
	sel.addEventListener('change',function() {setTextures(); drawScene();});
    }

    // Preload all the images for faster rendering
    var loaded = 0;
    var imgdiv = document.getElementById('images');
    for (var i = 0; i < imagesrcs.length; i++) {
	images[i] = document.createElement('img');
	images[i].src = "./Images/" + imagesrcs[i];
	imgdiv.appendChild(images[i]);
	images[i].addEventListener('load',function() {
	    loaded++;
	    if (loaded == imagesrcs.length - 1) {
		initialise();
	    }
	});
    }

    // Iterate through the image selector to add the values
    var imglist = document.getElementById('texture');
    for (var i = 0; i < imglist.options.length; i++) {
	imglist.options[i].value = i;
    }
}

function initialise() {
    resetSize();
    setTextures();
    setColours();
    img.initialise();
    window.addEventListener('resize',function() {resetSize(); drawScene();});
    drawScene();
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
}

function resetShaderText() {
    var txt = document.getElementById('shaderText');
    txt.value = "lowp vec4 c = texture2D(texture, vTexcoord);\nc *= vColor;\n// Your code in here\ngl_FragColor = c;"
}

function clearShaderText() {
    var txt = document.getElementById('shaderText');
    txt.value = "";
}

function saveImage() {

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

function setColours() {
    var cols = ['ur','ul','br','bl'];
    var ncols = [];
    var col,b,g,r;
    for (var i = 0; i < 4; i++) {
	col = document.getElementById(cols[i]).value;
	b = parseInt(col.substr(5,2),16)/255;
        g = parseInt(col.substr(3,2),16)/255;
        r = parseInt(col.substr(1,2),16)/255;
	ncols.push([r,g,b,1]);
    }
    img.setColours(ncols);
}

function setBackground() {
    var col = document.getElementById('bg').value;
    var b = parseInt(col.substr(5,2),16)/255;
    var g = parseInt(col.substr(3,2),16)/255;
    var r = parseInt(col.substr(1,2),16)/255;
    gl.clearColor(r,g,b, 1.0);
}

function setTextures() {
    var sel;
    for (var i = 0; i < textures.length; i++) {
	sel = document.getElementById(textures[i]);
	img.setTexture(i,textures[i],images[sel.value]);
    }
    img.initShaders();
    img.initBuffers();
}

function loadShader() {
    clearError();
    var shader = document.getElementById('shaderText');
    localStorage.setItem('shader',shader.value);
    localStorage.setItem('textures',textures.length);
    img.reloadShader();
}

function drawScene() {
    img.setup();
    start = null;
    window.requestAnimationFrame(drawSceneAux);
}

function drawSceneAux(timestamp) {
    if (!start) start = timestamp;
    var dt = (timestamp - start)/1000;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    clearMatrices();

    //    perspectiveMatrix = makePerspective(45, width/height, 0.1, 100.0);
    perspectiveMatrix = makeOrtho(0,width,0,height,-1,100);

    pushMatrix();
    mvTranslate([width/2,height/2,0]);
    mvScale([aspect,aspect,1]);
    img.draw(dt);
    popMatrix();
    
    if (animating) {
	window.requestAnimationFrame(drawSceneAux);
    } else {
	setDownloadImage();
    }
}

function setDownloadImage() {
    var canvas = document.getElementById('glCanvas');
    var a = document.getElementById('save');
    canvas.toBlob(function(b) {
        a.href = window.URL.createObjectURL(b);
        a.download = 'image.png';
    });
}

function addImage() {
    var file = document.getElementById("imgload").files[0];
    var reader = new FileReader();
    reader.onloadend = function(){
	var imgdiv = document.getElementById('images');
	var ilen = images.length;
	images[ilen] = document.createElement('img');
	images[ilen].src = reader.result;
	imgdiv.appendChild(images[ilen]);
	var sel,optgrps,opt,optgrp;
	for (var i = 0; i < textures.length; i++) {
	    sel = document.getElementById('texture' + (i == 0 ? '' : i));
	    optgrps = sel.childNodes;
	    for (var j = 0; j < optgrps.length; j++) {
		if (optgrps[j].tagName == 'OPTGROUP') {
		    optgrp = optgrps[j];
		}
	    }
	    opt = document.createElement('option');
	    opt.text = file.name;
	    opt.value = sel.length;
	    optgrp.appendChild(opt);
	}
    }

    if (file){
	reader.readAsDataURL(file);
    }else{
    } 
}

function addTexture() {
    var tlen = textures.length;
    var tbl = document.getElementById('textable');
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var cd = document.createElement('code');
    var tx = document.createTextNode('texture' + tlen);
    cd.appendChild(tx);
    td.appendChild(cd);
    tr.appendChild(td);
    var sel = document.getElementById('texture');
    var selcl = sel.cloneNode(true);
    selcl.addEventListener('change',function() {setTextures(); drawScene();});
    selcl.id = 'texture' + tlen;
    textures.push('texture' + tlen);
    td = document.createElement('td');
    td.appendChild(selcl);
    tr.appendChild(td);
    tbl.appendChild(tr);
}

function rmTexture() {
    if (textures.length == 1) {
	return;
    }
    textures.pop();
    img.rmTexture();
    var tbl = document.getElementById('textable');
    var rows = tbl.childNodes;
    var lastrow;
    for (var j = 0; j < rows.length; j++) {
	if (rows[j].tagName == 'TR') {
	    lastrow = rows[j];
	}
    }
    tbl.removeChild(lastrow);
}

function doError(e) {
    var err = document.getElementById('error');
    err.innerHTML = '';
    err.style.display = 'block';
    var txt = document.createTextNode(e);
    var cd = document.createElement('code');
    cd.appendChild(txt);
    err.appendChild(cd);
}

function clearError() {
    var err = document.getElementById('error');
    err.style.display = 'none';
    err.innerHTML = '';
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
    /*
    if (mandel.isTouchedBy(e)) {
	mandel.doWheel(e);
//	drawScene();
    } else if (julia.isTouchedBy(e)) {
	julia.doWheel(e);
//	drawScene();
    }
*/
}

function doMouseDown(e) {
    /*
    fractalInTouch = null;
    if (mandel.isTouchedBy(e)) {
	mandel.doMouseDown(e);
	fractalInTouch = mandel;
//	drawScene();
    } else if (julia.isTouchedBy(e)) {
	julia.doMouseDown(e);
	fractalInTouch = julia;
//	drawScene();
    }
*/
}

function doMouseMove(e) {
/*    if (fractalInTouch) {
	fractalInTouch.doMouseMove(e);
//	drawScene();
    }
*/
}

function doMouseUp(e) {
    /*
    if (fractalInTouch) {
	fractalInTouch.doMouseUp(e);
//	drawScene();
    }
*/
}

var ongoingTouches = [];

function doTouchStart(e) {
    e.preventDefault();
    /*
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
//	drawScene();
    }
*/
}

function doTouchMove(e) {
    e.preventDefault();
    /*
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
//	drawScene();
    }
*/
}

function doTouchEnd(e) {
    e.preventDefault();
    /*
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
//	drawScene();
    }
*/
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
