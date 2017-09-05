function setBackgroundWidth() {
    var dmaths = document.getElementsByClassName('displaymaths');
    var width = 0;
    for (var i = 0; i < dmaths.length; i++) {
	var dmath = dmaths[i];
	if (dmath.tagName == 'table')
	{
            width = Math.max(width, dmath.offsetWidth);
        }
    }
    var bg = document.getElementById('background');
    var content = document.getElementById('content')
    var cwidth = content.clientWidth;
/*    var mw = parseFloat(window.getComputedStyle(content, null).getPropertyValue('max-width'));
    var pl = parseFloat(window.getComputedStyle(content, null).getPropertyValue('padding-left'));
    var pr = parseFloat(window.getComputedStyle(content, null).getPropertyValue('padding-right'));
    var bpl = parseFloat(window.getComputedStyle(bg, null).getPropertyValue('padding-left'));
    cwidth -= pr + pl;
    var bwidth = Math.max(width,cwidth);
    if (width > cwidth) {
	cwidth = Math.min(width, 1.1 * cwidth);
	content.style.width = cwidth + "px";
	if (cwidth > mw) {
            content.style.maxWidth = cwidth + "px";
	}
    }
*/
    bg.style.width = cwidth + "px";
}

function viewport()
{
    var e = window
    , a = 'inner';
    if ( !( 'innerWidth' in window ) )
    {
	a = 'client';
	e = document.documentElement || document.body;
    }
    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] }
}

window.onload = function() {
if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
{
    if (viewport().width > 769) {
	window.addEventListener('load', setBackgroundWidth);
	window.addEventListener('resize', setBackgroundWidth);
    }
}
}
