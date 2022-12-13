//init
WALLS = [];
OBJDATA = [];
ROOM = [];
HISTORY = [];
wallSize = 20;
partitionSize = 8;
let drag = 'off';
let action = 0;
let magnetic = 0;
let construc = 0;
let Rcirclebinder = 8;
let mode = 'select_mode';
let modeOption;
let linElement = $('#lin');
taille_w = linElement.width();
taille_h = linElement.height();
let offset = linElement.offset();
grid = 20;
showRib = true;
showArea = true;
meter = 60;
grid_snap = 'off';
colorbackground = "#ffffff";
colorline = "#fff";
colorroom = "#f0daaf";
colorWall = "#666";
pox = 0;
poy = 0;
segment = 0;
xpath = 0;
ypath = 0;
let width_viewbox = taille_w;
let height_viewbox = taille_h;
let ratio_viewbox = height_viewbox / width_viewbox;
let originX_viewbox = 0;
let originY_viewbox = 0;
let zoom = 9;
let factor = 1;

// **************************************************************************
// *****************   LOAD / SAVE LOCALSTORAGE      ************************
// **************************************************************************





function save(boot = false) {
    if (boot) localStorage.removeItem('history');
    // FOR CYCLIC OBJ INTO LOCALSTORAGE !!!
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS.indexOf(WALLS[k].child);
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS.indexOf(WALLS[k].parent);
        }
    }
    if (JSON.stringify({objData: OBJDATA, wallData: WALLS, roomData: ROOM}) === HISTORY[HISTORY.length - 1]) {
        for (let k in WALLS) {
            if (WALLS[k].child != null) {
                WALLS[k].child = WALLS[WALLS[k].child];
            }
            if (WALLS[k].parent != null) {
                WALLS[k].parent = WALLS[WALLS[k].parent];
            }
        }
        return false;
    }

    if (HISTORY.index < HISTORY.length) {
        HISTORY.splice(HISTORY.index, (HISTORY.length - HISTORY.index));
        $('#redo').addClass('disabled');
    }
    HISTORY.push(JSON.stringify({objData: OBJDATA, wallData: WALLS, roomData: ROOM}));
    localStorage.setItem('history', JSON.stringify(HISTORY));
    HISTORY.index++;
    if (HISTORY.index > 1) $('#undo').removeClass('disabled');
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS[WALLS[k].child];
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS[WALLS[k].parent];
        }
    }
    return true;
}

function load(index = HISTORY.index, boot = false) {
    if (HISTORY.length === 0 && !boot) return false;
    for (let k in OBJDATA) {
        OBJDATA[k].graph.remove();
    }
    OBJDATA = [];
    let historyTemp = [];
    historyTemp = JSON.parse(localStorage.getItem('history'));
    historyTemp = JSON.parse(historyTemp[index]);

    for (let k in historyTemp.objData) {
        let OO = historyTemp.objData[k];
        // if (OO.family === 'energy') OO.family = 'byObject';
        let obj = new editor.obj2D(OO.family, OO.class, OO.type, {
            x: OO.x,
            y: OO.y
        }, OO.angle, OO.angleSign, OO.size, OO.hinge = 'normal', OO.thick, OO.value);
        obj.limit = OO.limit;
        OBJDATA.push(obj);
        $('#boxcarpentry').append(OBJDATA[OBJDATA.length - 1].graph);
        obj.update();
    }
    WALLS = historyTemp.wallData;
    for (let k in WALLS) {
        if (WALLS[k].child != null) {
            WALLS[k].child = WALLS[WALLS[k].child];
        }
        if (WALLS[k].parent != null) {
            WALLS[k].parent = WALLS[WALLS[k].parent];
        }
    }
    ROOM = historyTemp.roomData;
    editor.architect(WALLS);
    editor.showScaleBox();
    rib();
}

$('svg').each(function () {
    $(this)[0].setAttribute('viewBox', originX_viewbox + ' ' + originY_viewbox + ' ' + width_viewbox + ' ' + height_viewbox)
});

// **************************************************************************
// *****************   FUNCTIONS ON BUTTON click     ************************
// **************************************************************************



document.getElementById("bboxTrash").addEventListener("click", function () {
    binder.obj.graph.remove();
    binder.graph.remove();
    OBJDATA.splice(OBJDATA.indexOf(binder.obj), 1);
    $('#objBoundingBox').hide(100);
    $('#panel').show(200);
    fonc_button('select_mode');
    $('#boxinfo').html('Deleted object');
    delete binder;
    rib();
});


document.getElementById('bboxWidth').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.size = (sliderValue / 100) * meter;
    objTarget.update();
    binder.size = (sliderValue / 100) * meter;
    binder.update();
    document.getElementById("bboxWidthVal").textContent = sliderValue;
});

document.getElementById('bboxHeight').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.thick = (sliderValue / 100) * meter;
    objTarget.update();
    binder.thick = (sliderValue / 100) * meter;
    binder.update();
    document.getElementById("bboxHeightVal").textContent = sliderValue;
});

document.getElementById('bboxRotation').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    objTarget.angle = sliderValue;
    objTarget.update();
    binder.angle = sliderValue;
    binder.update();
    document.getElementById("bboxRotationVal").textContent = sliderValue;
});

document.getElementById('doorWindowWidth').addEventListener("input", function () {
    let sliderValue = this.value;
    let objTarget = binder.obj;
    let wallBind = editor.rayCastingWalls(objTarget, WALLS);
    if (wallBind.length > 1) {
        wallBind = wallBind[wallBind.length - 1];
    }
    let limits = limitObj(wallBind.equations.base, sliderValue, objTarget);
    if (qSVG.btwn(limits[1].x, wallBind.start.x, wallBind.end.x) && qSVG.btwn(limits[1].y, wallBind.start.y, wallBind.end.y) &&
        qSVG.btwn(limits[0].x, wallBind.start.x, wallBind.end.x) && qSVG.btwn(limits[0].y, wallBind.start.y, wallBind.end.y)) {
        objTarget.size = sliderValue;
        objTarget.limit = limits;
        objTarget.update();
        binder.size = sliderValue;
        binder.limit = limits;
        binder.update();
        document.getElementById("doorWindowWidthVal").textContent = sliderValue;
    }
    inWallRib(wallBind);
});

document.getElementById("objToolsHinge").addEventListener("click", function () {
    let objTarget = binder.obj;
    let hingeStatus = objTarget.hinge; // normal - reverse
    if (hingeStatus === 'normal') {
        objTarget.hinge = 'reverse';
    } else objTarget.hinge = 'normal';
    objTarget.update();
});

window.addEventListener("load", function () {
    document.getElementById('panel').style.transform = "translateX(200px)";
    document.getElementById('panel').addEventListener("transitionend", function () {
        document.getElementById('moveBox').style.transform = "translateX(-165px)";
        document.getElementById('zoomBox').style.transform = "translateX(-165px)";
    });
    if (!localStorage.getItem('history')) {
        $('#recover').html("<p>Select a plan type.");
    }
    const myModal = new bootstrap.Modal($('#myModal'))
    myModal.show();
});




if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function (searchElement, fromIndex) {
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            let o = Object(this);
            let len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            let n = fromIndex | 0;
            let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            while (k < len) {
                if (o[k] === searchElement) {
                    return true;
                }
                k++;
            }
            return false;
        }
    });
}

function isObjectsEquals(a, b, message = false) {
    if (message) console.log(message)
    let isOK = true;
    for (let prop in a) {
        if (a[prop] !== b[prop]) {
            isOK = false;
            break;
        }
    }
    return isOK;
};

function throttle(callback, delay) {
    let last;
    let timer;
    return function () {
        let context = this;
        let now = +new Date();
        let args = arguments;
        if (last && now < last + delay) {
            // le délai n'est pas écoulé on reset le timer
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                callback.apply(context, args);
            }, delay);
        } else {
            last = now;
            callback.apply(context, args);
        }
    };
}

linElement.mousewheel(throttle(function (event) {
    event.preventDefault();
    if (event.deltaY > 0) {
        zoom_maker('zoomin', 200);
    } else {
        zoom_maker('zoomout', 200);
    }
}, 100));





// document.getElementById("showLayerFurniture").addEventListener("click", function () {
//   if (document.getElementById("showLayerFurniture").checked) {
//     $('#boxFurniture').show(200);
//   }
//   else {
//     $('#boxFurniture').hide(100);
//   }
// });





let textEditorColorBtn = document.querySelectorAll('.textEditorColor');
for (let k = 0; k < textEditorColorBtn.length; k++) {
    textEditorColorBtn[k].addEventListener('click', function () {
        document.getElementById('labelBox').style.color = this.style.color;
    });
}

let zoomBtn = document.querySelectorAll('.zoom');
for (let k = 0; k < zoomBtn.length; k++) {
    zoomBtn[k].addEventListener("click", function () {
        let lens = this.getAttribute('data-zoom');
        zoom_maker(lens, 200, 50);
    })
}

let roomColorBtn = document.querySelectorAll(".roomColor");
for (let k = 0; k < roomColorBtn.length; k++) {
    roomColorBtn[k].addEventListener("click", function () {
        let data = this.getAttribute('data-type');
        $('#roomBackground').val(data);
        binder.attr({'fill': 'url(#' + data + ')'});
    });
}

let objTrashBtn = document.querySelectorAll(".objTrash");
for (let k = 0; k < objTrashBtn.length; k++) {
    objTrashBtn[k].addEventListener("click", function () {
        $('#objTools').hide('100');
        let obj = binder.obj;
        obj.graph.remove();
        OBJDATA.splice(OBJDATA.indexOf(obj), 1);
        fonc_button('select_mode');
        $('#boxinfo').html('Selection mode');
        $('#panel').show('200');
        binder.graph.remove();
        delete binder;
        rib();
        $('#panel').show('300');
    });
}

let dropdownMenu = document.querySelectorAll(".dropdown-menu li a");
for (let k = 0; k < dropdownMenu.length; k++) {
    dropdownMenu[k].addEventListener("click", function () {
        let selText = this.textContent;
        $(this).parents('.btn-group').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
        if (selText != 'None') $('#roomName').val(selText);
        else $('#roomName').val('');
    });
}

// TRY MATRIX CALC FOR BBOX REAL COORDS WITH TRAS + ROT.
function matrixCalc(el, message = false) {
    if (message) console.log("matrixCalc called by -> " + message);
    let m = el.getCTM();
    let bb = el.getBBox();
    let tpts = [
        matrixXY(m, bb.x, bb.y),
        matrixXY(m, bb.x + bb.width, bb.y),
        matrixXY(m, bb.x + bb.width, bb.y + bb.height),
        matrixXY(m, bb.x, bb.y + bb.height)];
    return tpts;
}

function matrixXY(m, x, y) {
    return {x: x * m.a + y * m.c + m.e, y: x * m.b + y * m.d + m.f};
}

function realBboxShow(coords) {
    for (let k in coords) {
        debugPoint(coords[k]);
    }
}


function limitObj(equation, size, coords, message = false) {
    if (message) {
        console.log(message);
    }
    let Px = coords.x;
    let Py = coords.y;
    let Aq = equation.A;
    let Bq = equation.B;
    let pos1, pos2;
    if (Aq === 'v') {
        pos1 = {x: Px, y: Py - size / 2};
        pos2 = {x: Px, y: Py + size / 2};
    } else if (Aq === 'h') {
        pos1 = {x: Px - size / 2, y: Py};
        pos2 = {x: Px + size / 2, y: Py};
    } else {
        let A = 1 + Aq * Aq;
        let B = (-2 * Px) + (2 * Aq * Bq) + (-2 * Py * Aq);
        let C = (Px * Px) + (Bq * Bq) - (2 * Py * Bq) + (Py * Py) - (size * size) / 4; // -N
        let Delta = (B * B) - (4 * A * C);
        let posX1 = (-B - (Math.sqrt(Delta))) / (2 * A);
        let posX2 = (-B + (Math.sqrt(Delta))) / (2 * A);
        pos1 = {x: posX1, y: (Aq * posX1) + Bq};
        pos2 = {x: posX2, y: (Aq * posX2) + Bq};
    }
    return [pos1, pos2];
}

function zoom_maker(lens, xmove, xview) {

    if (lens === 'zoomout' && zoom > 1 && zoom < 17) {
        zoom--;
        width_viewbox += xmove;
        let ratioWidthZoom = taille_w / width_viewbox;
        height_viewbox = width_viewbox * ratio_viewbox;
        myDiv = document.getElementById("scaleVal");
        myDiv.style.width = 60 * ratioWidthZoom + 'px';
        originX_viewbox = originX_viewbox - (xmove / 2);
        originY_viewbox = originY_viewbox - (xmove / 2 * ratio_viewbox);
    }
    if (lens === 'zoomin' && zoom < 14 && zoom > 0) {
        zoom++;
        let oldWidth = width_viewbox;
        width_viewbox -= xmove;
        let ratioWidthZoom = taille_w / width_viewbox;
        height_viewbox = width_viewbox * ratio_viewbox;
        myDiv = document.getElementById("scaleVal");
        myDiv.style.width = 60 * ratioWidthZoom + 'px';

        originX_viewbox = originX_viewbox + (xmove / 2);
        originY_viewbox = originY_viewbox + (xmove / 2 * ratio_viewbox);
    }
    factor = width_viewbox / taille_w;
    if (lens === 'zoomreset') {
        originX_viewbox = 0;
        originY_viewbox = 0;
        width_viewbox = taille_w;
        height_viewbox = taille_h;
        factor = 1;
    }
    if (lens === 'zoomright') {
        originX_viewbox += xview;
    }
    if (lens === 'zoomleft') {
        originX_viewbox -= xview;
    }
    if (lens === 'zoomtop') {
        originY_viewbox -= xview;
    }
    if (lens === 'zoombottom') {
        originY_viewbox += xview;
    }
    if (lens === 'zoomdrag') {
        originX_viewbox -= xmove;
        originY_viewbox -= xview;
    }
    $('svg').each(function () {
        $(this)[0].setAttribute('viewBox', originX_viewbox + ' ' + originY_viewbox + ' ' + width_viewbox + ' ' + height_viewbox)
    });
}

tactile = false;

function calcul_snap(event, state) {
    if (event.touches) {
        let touches = event.changedTouches;
        console.log("toto")
        eX = touches[0].pageX;
        eY = touches[0].pageY;
        tactile = true;
    } else {
        eX = event.pageX;
        eY = event.pageY;
    }
    x_mouse = (eX * factor) - (offset.left * factor) + originX_viewbox;
    y_mouse = (eY * factor) - (offset.top * factor) + originY_viewbox;

    if (state === 'on') {
        x_grid = Math.round(x_mouse / grid) * grid;
        y_grid = Math.round(y_mouse / grid) * grid;
    }
    if (state === 'off') {
        x_grid = x_mouse;
        y_grid = y_mouse;
    }
    return {
        x: x_grid,
        y: y_grid,
        xMouse: x_mouse,
        yMouse: y_mouse
    };
}

minMoveGrid = function (mouse) {
    return Math.abs(Math.abs(pox - mouse.x) + Math.abs(poy - mouse.y));
}

function intersectionOff() {
    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }
}

function intersection(snap, range = Infinity, except = ['']) {
    // ORANGE LINES 90° NEAR SEGMENT
    let bestEqPoint = {};
    let equation = {};

    bestEqPoint.distance = range;

    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }

    lineIntersectionP = qSVG.create("boxbind", "path", { // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
        d: "",
        "stroke": "transparent",
        "stroke-width": 0.5,
        "stroke-opacity": "1",
        fill: "none"
    });

    for (index = 0; index < WALLS.length; index++) {
        if (except.indexOf(WALLS[index]) === -1) {
            let x1 = WALLS[index].start.x;
            let y1 = WALLS[index].start.y;
            let x2 = WALLS[index].end.x;
            let y2 = WALLS[index].end.y;

            // EQUATION 90° of segment nf/nf-1 at X2/Y2 Point
            if (Math.abs(y2 - y1) === 0) {
                equation.C = 'v'; // C/D equation 90° Coef = -1/E
                equation.D = x1;
                equation.E = 'h'; // E/F equation Segment
                equation.F = y1;
                equation.G = 'v'; // G/H equation 90° Coef = -1/E
                equation.H = x2;
                equation.I = 'h'; // I/J equation Segment
                equation.J = y2;
            } else if (Math.abs(x2 - x1) === 0) {
                equation.C = 'h'; // C/D equation 90° Coef = -1/E
                equation.D = y1;
                equation.E = 'v'; // E/F equation Segment
                equation.F = x1;
                equation.G = 'h'; // G/H equation 90° Coef = -1/E
                equation.H = y2;
                equation.I = 'v'; // I/J equation Segment
                equation.J = x2;
            } else {
                equation.C = (x1 - x2) / (y2 - y1);
                equation.D = y1 - (x1 * equation.C);
                equation.E = (y2 - y1) / (x2 - x1);
                equation.F = y1 - (x1 * equation.E);
                equation.G = (x1 - x2) / (y2 - y1);
                equation.H = y2 - (x2 * equation.C);
                equation.I = (y2 - y1) / (x2 - x1);
                equation.J = y2 - (x2 * equation.E);
            }
            equation.A = equation.C;
            equation.B = equation.D;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 1);
            }
            equation.A = equation.E;
            equation.B = equation.F;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 1);
            }
            equation.A = equation.G;
            equation.B = equation.H;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 2);
            }
            equation.A = equation.I;
            equation.B = equation.J;
            eq = qSVG.nearPointOnEquation(equation, snap);
            if (eq.distance < bestEqPoint.distance) {
                setBestEqPoint(bestEqPoint, eq.distance, index, eq.x, eq.y, x1, y1, x2, y2, 2);
            }
        } // END INDEXOF EXCEPT TEST
    } // END LOOP FOR

    if (bestEqPoint.distance < range) {
        if (bestEqPoint.way === 2) {
            lineIntersectionP.attr({ // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
                d: "M" + bestEqPoint.x1 + "," + bestEqPoint.y1 + " L" + bestEqPoint.x2 + "," + bestEqPoint.y2 + " L" + bestEqPoint.x + "," +
                    bestEqPoint.y,
                "stroke": "#d7ac57"
            });
        } else {
            lineIntersectionP.attr({ // ORANGE TEMP LINE FOR ANGLE 0 90 45 -+
                d: "M" + bestEqPoint.x2 + "," + bestEqPoint.y2 + " L" + bestEqPoint.x1 + "," + bestEqPoint.y1 + " L" + bestEqPoint.x + "," +
                    bestEqPoint.y,
                "stroke": "#d7ac57"
            });
        }
        return ({
            x: bestEqPoint.x,
            y: bestEqPoint.y,
            wall: WALLS[bestEqPoint.node],
            distance: bestEqPoint.distance
        });
    } else {
        return false;
    }
}

function debugPoint(point, name, color = "#00ff00") {
    qSVG.create('boxDebug', 'circle', {
        cx: point.x,
        cy: point.y,
        r: 7,
        fill: color,
        id: name,
        class: "visu"
    });
}

function showVertex() {
    for (let i = 0; i < vertex.length; i++) {
        debugPoint(vertex[i], i);

    }
}

function showJunction() {
    for (let i = 0; i < junction.length; i++) {
        debugPoint({x: junction[i].values[0], y: junction[i].values[1]}, i);

    }
}

$('.visu').mouseover(function () {
    console.log(this.id)
});

let sizeText = [];
let showAllSizeStatus = 0;

function hideAllSize() {
    $('#boxbind').empty();
    sizeText = [];
    showAllSizeStatus = 0;
}

function allRib() {
    $('#boxRib').empty();
    for (let i in WALLS) {
        inWallRib(WALLS[i], 'all');
    }
}

function inWallRib(wall, option = false) {
    if (!option) $('#boxRib').empty();
    ribMaster = [];
    ribMaster.push([]);
    ribMaster.push([]);
    let inter;
    let distance;
    let cross;
    let angleTextValue = wall.angle * (180 / Math.PI);
    let objWall = editor.objFromWall(wall); // LIST OBJ ON EDGE
    if (objWall.length == 0) return
    ribMaster[0].push({wall: wall, crossObj: false, side: 'up', coords: wall.coords[0], distance: 0});
    ribMaster[1].push({wall: wall, crossObj: false, side: 'down', coords: wall.coords[1], distance: 0});
    let objTarget = null
    for (let ob in objWall) {
        objTarget = objWall[ob];
        objTarget.up = [
            qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[0]),
            qSVG.nearPointOnEquation(wall.equations.up, objTarget.limit[1])
        ];
        objTarget.down = [
            qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[0]),
            qSVG.nearPointOnEquation(wall.equations.down, objTarget.limit[1])
        ];

        distance = qSVG.measure(wall.coords[0], objTarget.up[0]) / meter;
        ribMaster[0].push({
            wall: objTarget,
            crossObj: ob,
            side: 'up',
            coords: objTarget.up[0],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[0], objTarget.up[1]) / meter;
        ribMaster[0].push({
            wall: objTarget,
            crossObj: ob,
            side: 'up',
            coords: objTarget.up[1],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[1], objTarget.down[0]) / meter;
        ribMaster[1].push({
            wall: objTarget,
            crossObj: ob,
            side: 'down',
            coords: objTarget.down[0],
            distance: distance.toFixed(2)
        });
        distance = qSVG.measure(wall.coords[1], objTarget.down[1]) / meter;
        ribMaster[1].push({
            wall: objTarget,
            crossObj: ob,
            side: 'down',
            coords: objTarget.down[1],
            distance: distance.toFixed(2)
        });
    }
    distance = qSVG.measure(wall.coords[0], wall.coords[3]) / meter;
    ribMaster[0].push({wall: objTarget, crossObj: false, side: 'up', coords: wall.coords[3], distance: distance});
    distance = qSVG.measure(wall.coords[1], wall.coords[2]) / meter;
    ribMaster[1].push({wall: objTarget, crossObj: false, side: 'down', coords: wall.coords[2], distance: distance});
    ribMaster[0].sort(function (a, b) {
        return (a.distance - b.distance).toFixed(2);
    });
    ribMaster[1].sort(function (a, b) {
        return (a.distance - b.distance).toFixed(2);
    });
    for (let t in ribMaster) {
        for (let n = 1; n < ribMaster[t].length; n++) {
            let found = true;
            let shift = -5;
            let valueText = Math.abs(ribMaster[t][n - 1].distance - ribMaster[t][n].distance);
            let angleText = angleTextValue;
            if (found) {
                if (ribMaster[t][n - 1].side === 'down') {
                    shift = -shift + 10;
                }
                if (angleText > 89 || angleText < -89) {
                    angleText -= 180;
                    if (ribMaster[t][n - 1].side === 'down') {
                        shift = -5;
                    } else shift = -shift + 10;
                }


                sizeText[n] = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                let startText = qSVG.middle(ribMaster[t][n - 1].coords.x, ribMaster[t][n - 1].coords.y, ribMaster[t][n].coords.x,
                    ribMaster[t][n].coords.y);
                sizeText[n].setAttributeNS(null, 'x', startText.x);
                sizeText[n].setAttributeNS(null, 'y', (startText.y) + shift);
                sizeText[n].setAttributeNS(null, 'text-anchor', 'middle');
                sizeText[n].setAttributeNS(null, 'font-family', 'roboto');
                sizeText[n].setAttributeNS(null, 'stroke', '#ffffff');
                sizeText[n].textContent = valueText.toFixed(2);
                if (sizeText[n].textContent < 1) {
                    sizeText[n].setAttributeNS(null, 'font-size', '0.8em');
                    sizeText[n].textContent = sizeText[n].textContent.substring(1, sizeText[n].textContent.length);
                } else sizeText[n].setAttributeNS(null, 'font-size', '1em');
                sizeText[n].setAttributeNS(null, 'stroke-width', '0.27px');
                sizeText[n].setAttributeNS(null, 'fill', '#666666');
                sizeText[n].setAttribute("transform", "rotate(" + angleText + " " + startText.x + "," + (startText.y) + ")");

                $('#boxRib').append(sizeText[n]);
            }
        }
    }
}

function rib(shift = 5) {
    // return false;
    let ribMaster = [];
    ribMaster.push([]);
    ribMaster.push([]);
    let inter;
    let distance;
    let cross;
    for (let i in WALLS) {
        if (WALLS[i].equations.base) {
            ribMaster[0].push([]);
            pushToRibMaster(ribMaster, 0, i, i, i, 'up', WALLS[i].coords[0], 0);
            ribMaster[1].push([]);
            pushToRibMaster(ribMaster, 1, i, i, i, 'down', WALLS[i].coords[1], 0);

            for (let p in WALLS) {
                if (i != p && WALLS[p].equations.base) {
                    cross = qSVG.intersectionOfEquations(WALLS[i].equations.base, WALLS[p].equations.base, "object");
                    if (qSVG.btwn(cross.x, WALLS[i].start.x, WALLS[i].end.x, 'round') &&
                        qSVG.btwn(cross.y, WALLS[i].start.y, WALLS[i].end.y, 'round')) {

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.up, WALLS[p].equations.up, "object");
                        if (qSVG.btwn(inter.x, WALLS[i].coords[0].x, WALLS[i].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[0].y, WALLS[i].coords[3].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[0].x, WALLS[p].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[0].y, WALLS[p].coords[3].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[0], inter) / meter;
                            pushToRibMaster(ribMaster, 0, i, i, p, 'up', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.up, WALLS[p].equations.down, "object");
                        if (qSVG.btwn(inter.x, WALLS[i].coords[0].x, WALLS[i].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[0].y, WALLS[i].coords[3].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[1].x, WALLS[p].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[1].y, WALLS[p].coords[2].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[0], inter) / meter;
                            pushToRibMaster(ribMaster, 0, i, i, p, 'up', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.down, WALLS[p].equations.up, "object");
                        if (qSVG.btwn(inter.x, WALLS[i].coords[1].x, WALLS[i].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[1].y, WALLS[i].coords[2].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[0].x, WALLS[p].coords[3].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[0].y, WALLS[p].coords[3].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[1], inter) / meter;
                            pushToRibMaster(ribMaster, 1, i, i, p, 'down', inter, distance.toFixed(2));

                        }

                        inter = qSVG.intersectionOfEquations(WALLS[i].equations.down, WALLS[p].equations.down, "object");
                        if (qSVG.btwn(inter.x, WALLS[i].coords[1].x, WALLS[i].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[i].coords[1].y, WALLS[i].coords[2].y, 'round') &&
                            qSVG.btwn(inter.x, WALLS[p].coords[1].x, WALLS[p].coords[2].x, 'round') &&
                            qSVG.btwn(inter.y, WALLS[p].coords[1].y, WALLS[p].coords[2].y, 'round')) {
                            distance = qSVG.measure(WALLS[i].coords[1], inter) / meter;
                            pushToRibMaster(ribMaster, 1, i, i, p, 'down', inter, distance.toFixed(2));

                        }
                    }
                }
            }
            distance = qSVG.measure(WALLS[i].coords[0], WALLS[i].coords[3]) / meter;
            pushToRibMaster(ribMaster, 0, i, i, i, 'up', WALLS[i].coords[3], distance.toFixed(2));

            distance = qSVG.measure(WALLS[i].coords[1], WALLS[i].coords[2]) / meter;
            pushToRibMaster(ribMaster, 1, i, i, i, 'down', WALLS[i].coords[2], distance.toFixed(2));
        }
    }

    for (let a in ribMaster[0]) {
        ribMaster[0][a].sort(function (a, b) {
            return (a.distance - b.distance).toFixed(2);
        });
    }
    for (let a in ribMaster[1]) {
        ribMaster[1][a].sort(function (a, b) {
            return (a.distance - b.distance).toFixed(2);
        });
    }

    let sizeText = [];
    if (shift === 5) $('#boxRib').empty();
    for (let t in ribMaster) {
        for (let a in ribMaster[t]) {
            for (let n = 1; n < ribMaster[t][a].length; n++) {
                if (ribMaster[t][a][n - 1].wallIndex === ribMaster[t][a][n].wallIndex) {
                    let edge = ribMaster[t][a][n].wallIndex;
                    let found = true;
                    let valueText = Math.abs(ribMaster[t][a][n - 1].distance - ribMaster[t][a][n].distance);
                    // CLEAR TOO LITTLE VALUE
                    if (valueText < 0.15) {
                        found = false;
                    }
                    // CLEAR (thick) BETWEEN CROSS EDGE
                    if (found && ribMaster[t][a][n - 1].crossEdge === ribMaster[t][a][n].crossEdge && ribMaster[t][a][n].crossEdge !=
                        ribMaster[t][a][n].wallIndex) {
                        found = false;
                    }
                    // CLEAR START INTO EDGE
                    if (found && ribMaster[t][a].length > 2 && n === 1) {
                        let polygon = [];
                        for (let pp = 0; pp < 4; pp++) {
                            polygon.push({
                                x: WALLS[ribMaster[t][a][n].crossEdge].coords[pp].x,
                                y: WALLS[ribMaster[t][a][n].crossEdge].coords[pp].y
                            }); // FOR Z
                        }
                        if (qSVG.rayCasting(ribMaster[t][a][0].coords, polygon)) {
                            found = false;
                        }
                    }
                    // CLEAR END INTO EDGE
                    if (found && ribMaster[t][a].length > 2 && n === ribMaster[t][a].length - 1) {
                        let polygon = [];
                        for (let pp = 0; pp < 4; pp++) {
                            polygon.push({
                                x: WALLS[ribMaster[t][a][n - 1].crossEdge].coords[pp].x,
                                y: WALLS[ribMaster[t][a][n - 1].crossEdge].coords[pp].y
                            }); // FOR Z
                        }
                        if (qSVG.rayCasting(ribMaster[t][a][ribMaster[t][a].length - 1].coords, polygon)) {
                            found = false;
                        }
                    }

                    if (found) {
                        let angleText = WALLS[ribMaster[t][a][n].wallIndex].angle * (180 / Math.PI);
                        let shiftValue = -shift;
                        if (ribMaster[t][a][n - 1].side === 'down') {
                            shiftValue = -shiftValue + 10;
                        }
                        if (angleText > 90 || angleText < -89) {
                            angleText -= 180;
                            if (ribMaster[t][a][n - 1].side === 'down') {
                                shiftValue = -shift;
                            } else shiftValue = -shiftValue + 10;
                        }
                        sizeText[n] = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        let startText = qSVG.middle(ribMaster[t][a][n - 1].coords.x, ribMaster[t][a][n - 1].coords.y, ribMaster[t][a][n].coords.x,
                            ribMaster[t][a][n].coords.y);
                        sizeText[n].setAttributeNS(null, 'x', startText.x);
                        sizeText[n].setAttributeNS(null, 'y', (startText.y) + (shiftValue));
                        sizeText[n].setAttributeNS(null, 'text-anchor', 'middle');
                        sizeText[n].setAttributeNS(null, 'font-family', 'roboto');
                        sizeText[n].setAttributeNS(null, 'stroke', '#ffffff');
                        sizeText[n].textContent = valueText.toFixed(2);
                        if (sizeText[n].textContent < 1) {
                            sizeText[n].setAttributeNS(null, 'font-size', '0.73em');
                            sizeText[n].textContent = sizeText[n].textContent.substring(1, sizeText[n].textContent.length);
                        } else sizeText[n].setAttributeNS(null, 'font-size', '0.9em');
                        sizeText[n].setAttributeNS(null, 'stroke-width', '0.2px');
                        sizeText[n].setAttributeNS(null, 'fill', '#555555');
                        sizeText[n].setAttribute("transform", "rotate(" + angleText + " " + startText.x + "," + (startText.y) + ")");

                        $('#boxRib').append(sizeText[n]);
                    }
                }
            }
        }
    }
}

function cursor(tool) {
    if (tool === 'grab') tool =
        "url('https://wiki.openmrs.org/s/en_GB/7502/b9217199c27dd617c8d51f6186067d7767c5001b/_/images/icons/emoticons/add.png') 8 8, auto";
    if (tool === 'scissor') tool = "url('https://maxcdn.icons8.com/windows10/PNG/64/Hands/hand_scissors-64.png'), auto";
    if (tool === 'trash') tool = "url('https://cdn4.iconfinder.com/data/icons/common-toolbar/36/Cancel-32.png'), auto";
    if (tool === 'validation') tool = "url('https://images.fatguymedia.com/wp-content/uploads/2015/09/check.png'), auto";
    linElement.css('cursor', tool);
}



function raz_button() {
    $('#rect_mode').removeClass('btn-success');
    $('#rect_mode').addClass('btn-default');
    $('#select_mode').removeClass('btn-success');
    $('#select_mode').addClass('btn-default');
    $('#line_mode').removeClass('btn-success');
    $('#line_mode').addClass('btn-default');
    $('#partition_mode').removeClass('btn-success');
    $('#partition_mode').addClass('btn-default');
    $('#door_mode').removeClass('btn-success');
    $('#door_mode').addClass('btn-default');
    $('#node_mode').removeClass('btn-success');
    $('#node_mode').addClass('btn-default');
    $('#text_mode').removeClass('btn-success');
    $('#text_mode').addClass('btn-default');
    $('#room_mode').removeClass('btn-success');
    $('#room_mode').addClass('btn-default');
    $('#distance_mode').removeClass('btn-success');
    $('#distance_mode').addClass('btn-default');
    $('#object_mode').removeClass('btn-success');
    $('#object_mode').addClass('btn-default');
    $('#stair_mode').removeClass('btn-success');
    $('#stair_mode').addClass('btn-default');
}

function fonc_button(modesetting, option) {
    save();

    $('.sub').hide();
    raz_button();
    if (option != 'simpleStair') {
        $('#' + modesetting).removeClass('btn-default');
        $('#' + modesetting).addClass('btn-success');

    }
    mode = modesetting;
    modeOption = option;

    if (typeof (lineIntersectionP) != 'undefined') {
        lineIntersectionP.remove();
        delete lineIntersectionP;
    }
}


$('#distance_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a measurement');
    fonc_button('distance_mode');
});

$('#room_mode').click(function () {
    linElement.css('cursor', 'pointer');
    $('#boxinfo').html('Config. of rooms');
    fonc_button('room_mode');
});

$('#select_mode').click(function () {
    $('#boxinfo').html('Mode "select"');
    if (typeof (binder) != 'undefined') {
        binder.remove();
        delete binder;
    }

    fonc_button('select_mode');
});

$('#line_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Creation of wall(s)');
    multi = 0;
    action = 0;
    // snap = calcul_snap(event, grid_snap);
    //
    // pox = snap.x;
    // poy = snap.y;
    fonc_button('line_mode');
});

$('#partition_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Creation of thin wall(s)');
    multi = 0;
    fonc_button('partition_mode');
});

$('#rect_mode').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Room(s) creation');
    fonc_button('rect_mode');
});

$('.door').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a door');
    $('#door_list').hide(200);
    fonc_button('door_mode', this.id);
});

$('.window').click(function () {
    linElement.css('cursor', 'crosshair');
    $('#boxinfo').html('Add a window');
    $('#door_list').hide(200);
    $('#window_list').hide(200);
    fonc_button('door_mode', this.id);
});

$('.object').click(function () {
    cursor('move');
    $('#boxinfo').html('Add an object');
    fonc_button('object_mode', this.id);
});


$('#grid_mode').click(function () {
    if (grid_snap === 'on') {
        grid_snap = 'off';
        $('#boxinfo').html('Help grid off');
        $('#grid_mode').removeClass('btn-success');
        $('#grid_mode').addClass('btn-warning');
        $('#grid_mode').html('GRID OFF');
        $('#boxgrid').css('opacity', '0.5');
    } else {
        grid_snap = 'on';
        $('#boxinfo').html('Help grid on');
        $('#grid_mode').removeClass('btn-warning');
        $('#grid_mode').addClass('btn-success');
        $('#grid_mode').html('GRID ON <i class="fa fa-th" aria-hidden="true"></i>');
        $('#boxgrid').css('opacity', '1');
    }
});

//  RETURN PATH(s) ARRAY FOR OBJECT + PROPERTY params => bindBox (false = open sideTool), move, resize, rotate
function carpentryCalc(classObj, typeObj, sizeObj, thickObj, dividerObj = 10) {
    let construc = [];
    construc.params = {};
    construc.params.bindBox = false;
    construc.params.move = false;
    construc.params.resize = false;
    construc.params.resizeLimit = {};
    construc.params.resizeLimit.width = {min: false, max: false};
    construc.params.resizeLimit.height = {min: false, max: false};
    construc.params.rotate = false;

    if (classObj === 'socle') {
        pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
            thickObj / 2 + " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) +
            " Z", "#5cba79", "#5cba79", '');
    }


    if (classObj === 'doorWindow') {
        if (typeObj === 'simple') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "none",
                '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-sizeObj - thickObj / 2) + "  A" + sizeObj + "," + sizeObj + " 0 0,1 " + sizeObj / 2 + "," + (-thickObj / 2), "none", colorWall,
                '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 40, max: 120};
        }
        if (typeObj === 'double') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "none",
                '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-sizeObj / 2 - thickObj / 2) + "  A" + sizeObj / 2 + "," + sizeObj / 2 + " 0 0,1 0," + (-thickObj / 2), "none", colorWall,
                '');

            pushToConstruc(construc, "M " + (sizeObj / 2) + "," + (-thickObj / 2) + " L " + (sizeObj / 2) + "," +
                (-sizeObj / 2 - thickObj / 2) + "  A" + sizeObj / 2 + "," + sizeObj / 2 + " 0 0,0 0," + (-thickObj / 2), "none", colorWall,
                '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 40, max: 160};
        }
        if (typeObj === 'pocket') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-(thickObj / 2) - 4) + " L " + (-sizeObj / 2) + "," +
                thickObj / 2 + " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-(thickObj / 2) - 4) + " Z", "#ccc",
                "none",
                'none');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + (sizeObj / 2) + "," + (thickObj / 2) + " L " + (sizeObj / 2) + "," + (-thickObj / 2), "none", "#494646",
                '5 5');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," +
                (-thickObj / 2 - 5) + " L " + (+sizeObj / 2) + "," + (-thickObj / 2 - 5) + " L " + (+sizeObj / 2) +
                "," + (-thickObj / 2) + " Z", "url(#hatch)", "#494646", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 60, max: 200};
        }
        if (typeObj === 'aperture') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#ccc", "#494646",
                '5,5');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-(thickObj / 2)) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " L " + ((-sizeObj / 2) + 5) + "," + thickObj / 2 + " L " + ((-sizeObj / 2) + 5) + "," + (-(thickObj / 2)) + " Z", "none",
                "#494646",
                'none');

            pushToConstruc(construc, "M " + ((sizeObj / 2) - 5) + "," + (-(thickObj / 2)) + " L " + ((sizeObj / 2) - 5) + "," + thickObj / 2 +
                " L " + (sizeObj / 2) + "," + thickObj / 2 + " L " + (sizeObj / 2) + "," + (-(thickObj / 2)) + " Z", "none", "#494646",
                'none');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 40, max: 500};
        }
        if (typeObj === 'fix') {
            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " +
                sizeObj / 2 + ",2 L " + sizeObj / 2 + ",-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 30, max: 300};
        }
        if (typeObj === 'flap') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " +
                sizeObj / 2 + ",2 L " + sizeObj / 2 + ",-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((-sizeObj / 2) +
                ((sizeObj) * 0.866)) + "," + ((-sizeObj / 2) - (thickObj / 2)) + "  A" + sizeObj + "," +
                sizeObj + " 0 0,1 " + sizeObj / 2 + "," + (-thickObj / 2), "none", colorWall, '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 20, max: 100};
        }
        if (typeObj === 'twin') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",2 L " + sizeObj / 2 +
                ",2 L " + sizeObj / 2 + ",-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((-sizeObj / 2) +
                ((sizeObj / 2) * 0.866)) + "," + (-sizeObj / 4 - thickObj / 2) + "  A" +
                sizeObj / 2 + "," + sizeObj / 2 + " 0 0,1 0," + (-thickObj / 2), "none", colorWall, '');

            pushToConstruc(construc, "M " + (sizeObj / 2) + "," + (-thickObj / 2) + " L " + ((sizeObj / 2) +
                ((-sizeObj / 2) * 0.866)) + "," + (-sizeObj / 4 - thickObj / 2) + "  A" +
                sizeObj / 2 + "," + sizeObj / 2 + " 0 0,0 0," + (-thickObj / 2), "none", colorWall, '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 40, max: 200};
        }
        if (typeObj === 'bay') {

            pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 +
                " M " + sizeObj / 2 + "," + thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2), "none", "#ccc", '');

            pushToConstruc(construc, "M " + (-sizeObj / 2) + ",-2 L " + (-sizeObj / 2) + ",0 L 2,0 L 2,2 L 3,2 L 3,-2 Z", "#ccc", "none", '');

            pushToConstruc(construc, "M -2,1 L -2,3 L " + sizeObj / 2 + ",3 L " + sizeObj / 2 + ",1 L -1,1 L -1,-1 L -2,-1 Z", "#ccc", "none", '');
            construc.params.resize = true;
            construc.params.resizeLimit.width = {min: 60, max: 300};
        }
    }

    if (classObj === 'measure') {
        construc.params.bindBox = true;
        pushToConstruc(construc, "M-" + (sizeObj / 2) + ",0 l10,-10 l0,8 l" + (sizeObj - 20) +
            ",0 l0,-8 l10,10 l-10,10 l0,-8 l-" + (sizeObj - 20) + ",0 l0,8 Z", "#729eeb", "none", '');
    }

    if (classObj === 'boundingBox') {

        pushToConstruc(construc,
            "M" + (-sizeObj / 2 - 10) + "," + (-thickObj / 2 - 10) + " L" + (sizeObj / 2 + 10) + "," + (-thickObj / 2 - 10) + " L" +
            (sizeObj / 2 + 10) + "," + (thickObj / 2 + 10) + " L" + (-sizeObj / 2 - 10) + "," + (thickObj / 2 + 10) + " Z", 'none',
            "#aaa", '');

        // construc.push({'path':"M"+dividerObj[0].x+","+dividerObj[0].y+" L"+dividerObj[1].x+","+dividerObj[1].y+" L"+dividerObj[2].x+",
        // "+dividerObj[2].y+" L"+dividerObj[3].x+","+dividerObj[3].y+" Z", 'fill':'none', 'stroke':"#000", 'strokeDashArray': ''});
    }

    //typeObj = color  dividerObj = text
    if (classObj === 'text') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.rotate = true;
        construc.push({
            'text': dividerObj.text,
            'x': '0',
            'y': '0',
            'fill': typeObj,
            'stroke': typeObj,
            'fontSize': dividerObj.size + 'px',
            "strokeWidth": "0px"
        });
    }

    if (classObj === 'stair') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = true;
        construc.params.rotate = true;
        construc.params.width = 60;
        construc.params.height = 180;
        if (typeObj === 'simpleStair') {

            pushToConstruc(construc,
                "M " + (-sizeObj / 2) + "," + (-thickObj / 2) + " L " + (-sizeObj / 2) + "," + thickObj / 2 + " L " + sizeObj / 2 + "," +
                thickObj / 2 + " L " + sizeObj / 2 + "," + (-thickObj / 2) + " Z", "#fff", "#000", '');

            let heightStep = thickObj / (dividerObj);
            for (let i = 1; i < dividerObj + 1; i++) {
                pushToConstruc(construc, "M " + (-sizeObj / 2) + "," + ((-thickObj / 2) + (i * heightStep)) + " L " + (sizeObj / 2) + "," +
                    ((-thickObj / 2) + (i * heightStep)), "none", "#000", 'none');
            }
            construc.params.resizeLimit.width = {min: 40, max: 200};
            construc.params.resizeLimit.height = {min: 40, max: 400};
        }

    }

    if (classObj === 'energy') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = false;
        construc.params.rotate = false;
        if (typeObj === 'gtl') {
            pushToConstruc(construc, "m -20,-20 l 40,0 l0,40 l-40,0 Z", "#fff", "#333", '');
            construc.push({
                'text': "GTL",
                'x': '0',
                'y': '5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.9em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 40;
            construc.params.height = 40;
            construc.family = 'stick';
        }
        if (typeObj === 'switch') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(-2, 4, 5), "none", "#333", '');
            pushToConstruc(construc, "m 0,0 5,-9", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';

        }
        if (typeObj === 'doubleSwitch') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(0, 0, 4), "none", "#333", '');
            pushToConstruc(construc, "m 2,-3 5,-8 3,2", "none", "#333", '');
            pushToConstruc(construc, "m -2,3 -5,8 -3,-2", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'dimmer') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#333", '');
            pushToConstruc(construc, qSVG.circlePath(-2, 4, 5), "none", "#333", '');
            pushToConstruc(construc, "m 0,0 5,-9", "none", "#333", '');
            pushToConstruc(construc, "M -2,-6 L 10,-4 L-2,-2 Z", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug20') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');

            construc.push({
                'text': "20A",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.65em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'plug32') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "M 10,-6 a 10,10 0 0 1 -5,8 10,10 0 0 1 -10,0 10,10 0 0 1 -5,-8", "none", "#333", '');
            pushToConstruc(construc, "m 0,3 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,4 h 20", "none", "#333", '');

            construc.push({
                'text': "32A",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.65em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'roofLight') {
            pushToConstruc(construc,  qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc,  "M -8,-8 L 8,8 M -8,8 L 8,-8", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'free';
        }
        if (typeObj === 'wallLight') {
            pushToConstruc(construc,   qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc,  "M -8,-8 L 8,8 M -8,8 L 8,-8", "none", "#333", '');
            pushToConstruc(construc,  "M -10,10 L 10,10", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'www') {
            pushToConstruc(construc,  "m -20,-20 l 40,0 l0,40 l-40,0 Z", "#fff", "#333", '');

            construc.push({
                'text': "@",
                'x': '0',
                'y': '4',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '1.2em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 40;
            construc.params.height = 40;
            construc.family = 'free';
        }
        if (typeObj === 'rj45') {
            pushToConstruc(construc,  qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc,  "m-10,5 l0,-10 m20,0 l0,10", "none", "#333", '');
            pushToConstruc(construc,  "m 0,5 v 7", "none", "#333", '');
            pushToConstruc(construc, "m -10,5 h 20", "none", "#333", '');

            construc.push({
                'text': "RJ45",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.5em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'tv') {
            pushToConstruc(construc, qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "m-10,5 l0-10 m20,0 l0,10", "none", "#333", '');
            pushToConstruc(construc, "m-7,-5 l0,7 l14,0 l0,-7", "none", "#333", '');
            pushToConstruc(construc, "m 0,5 v 7", "none", "#333", '');
            pushToConstruc(construc,  "m -10,5 h 20", "none", "#333", '');

            construc.push({
                'text': "TV",
                'x': '0',
                'y': '-5',
                'fill': "#333333",
                'stroke': "none",
                'fontSize': '0.5em',
                "strokeWidth": "0.4px"
            });
            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }

        if (typeObj === 'heater') {
            pushToConstruc(construc,  qSVG.circlePath(0, 0, 16), "#fff", "#000", '');
            pushToConstruc(construc, "m-15,-4 l30,0", "none", "#333", '');
            pushToConstruc(construc, "m-14,-8 l28,0", "none", "#333", '');
            pushToConstruc(construc, "m-11,-12 l22,0", "none", "#333", '');
            pushToConstruc(construc, "m-16,0 l32,0", "none", "#333", '');
            pushToConstruc(construc, "m-15,4 l30,0", "none", "#333", '');
            pushToConstruc(construc, "m-14,8 l28,0", "none", "#333", '');
            pushToConstruc(construc, "m-11,12 l22,0", "none", "#333", '');

            construc.params.width = 36;
            construc.params.height = 36;
            construc.family = 'stick';
        }
        if (typeObj === 'radiator') {
            pushToConstruc(construc, "m -20,-10 l 40,0 l0,20 l-40,0 Z", "#fff", "#333", '');
            pushToConstruc(construc, "M -15,-10 L -15,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -10,-10 L -10,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -5,-10 L -5,10", "#fff", "#333", '');
            pushToConstruc(construc, "M -0,-10 L -0,10", "#fff", "#333", '');
            pushToConstruc(construc, "M 5,-10 L 5,10", "#fff", "#333", '');
            pushToConstruc(construc, "M 10,-10 L 10,10", "#fff", "#333", '');
            pushToConstruc(construc,"M 15,-10 L 15,10", "#fff", "#333", '');

            construc.params.width = 40;
            construc.params.height = 20;
            construc.family = 'stick';

        }
    }

    if (classObj === 'furniture') {
        construc.params.bindBox = true;
        construc.params.move = true;
        construc.params.resize = true;
        construc.params.rotate = true;
    }

    return construc;
}

function setBestEqPoint(bestEqPoint, distance, index, x, y, x1, y1, x2, y2, way) {
    bestEqPoint.distance = distance;
    bestEqPoint.node = index;
    bestEqPoint.x = x;
    bestEqPoint.y = y;
    bestEqPoint.x1 = x1;
    bestEqPoint.y1 = y1;
    bestEqPoint.x2 = x2;
    bestEqPoint.y2 = y2;
    bestEqPoint.way = way;
}

function pushToRibMaster(ribMaster, firstIndex, secondIndex, wallIndex, crossEdge, side, coords, distance) {
    ribMaster[firstIndex][secondIndex].push({
        wallIndex: wallIndex,
        crossEdge: crossEdge,
        side: side,
        coords: coords,
        distance: distance
    });
}

function pushToConstruc(construc, path, fill, stroke, strokeDashArray) {
    construc.push({
        'path': path,
        'fill': fill,
        'stroke': stroke,
        'strokeDashArray': strokeDashArray
    });
}
