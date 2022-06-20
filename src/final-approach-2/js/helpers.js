
function urlContainsDebug() {
    return window.location.search.indexOf("debug") !== -1;
}

function glideSlopeToFunction(glideSlopes, xPos) {
    // Given an array of glide slops and an X position,
    // calculate the Y position that exists on the glide slope.
    for(let i in glideSlopes) {
        let gs = glideSlopes[i];
        if(xPos >= gs.p0[0] && xPos <= gs.p1[0]) {
            let yDistance = gs.p0[1] - gs.p1[1];
            let xDistance = gs.p1[0] - gs.p0[0];
            let deltaYPerX = yDistance / xDistance
            let xProgress = xPos - gs.p0[0];
            return gs.p0[1] - xProgress * deltaYPerX;
        }
    }
}

function mapCoordToCanvasCoord(mapCoord, cameraPosition, camera) {
    const mapDx = mapCoord[0] - cameraPosition[0];
    const mapDy = mapCoord[1] - cameraPosition[1];
    return [
        mapDx + camera.canvasHalfW,
        camera.canvasH - (mapDy + camera.canvasHalfH),
    ];
}

function planeToMapBoxCoords(state) {
    // return x1, y1, x2, y2
    const plane = state.plane;
    const f = state.plane.flare;
    const mupm = state.map.mapUnitsPerMeter;
    return [
        plane.posMapCoord[0] - plane.dimensions[f][0] / 2 * mupm,
        plane.posMapCoord[1] - plane.dimensions[f][1] / 2 * mupm,
        plane.posMapCoord[0] + plane.dimensions[f][0] / 2 * mupm,
        plane.posMapCoord[1] + plane.dimensions[f][1] / 2 * mupm,
    ];
}

function lineInterceptsBoatRear(boatRearCoord, boxCords) {
    const [boxX1, boxY1, boxX2, _boxY2] = boxCords;
    return Boolean(
        boxX1 <= boatRearCoord[0]
        && boxX2 >= boatRearCoord[0]
        && boxY1 < boatRearCoord[1]
    );
}

function updateCameraCanvasMetaData(state) {
    const canvas = document.getElementById(CANVAS_ID);
    state.camera.canvasW = canvas.width;
    state.camera.canvasH = canvas.height;
    state.camera.canvasHalfW = Math.round(state.camera.canvasW / 2);
    state.camera.canvasHalfH = Math.round(state.camera.canvasH / 2);
    return state;
}

function boxCoordToRectArgs(boxCoord) {
    // [X1, Y1, Width, Height]
    return [
        boxCoord[0][0],
        boxCoord[0][1],
        boxCoord[1][0] - boxCoord[0][0],
        boxCoord[1][1] - boxCoord[0][1],
    ];
}

function coordInsideBoxCoord(coord, boxCoord) {
    if(!boxCoord) {
        return false;
    }
    const minX = Math.min(boxCoord[0][0], boxCoord[1][0]);
    const maxX = Math.max(boxCoord[0][0], boxCoord[1][0]);
    if(coord[0] < minX || coord[0] > maxX) {
        return false;
    }
    const minY = Math.min(boxCoord[0][1], boxCoord[1][1]);
    const maxY = Math.max(boxCoord[0][1], boxCoord[1][1]);
    if(coord[1] < minY || coord[1] > maxY) {
        return false;
    }
    return true;
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    // min inclusive, max exclusive
    return Math.floor(Math.random() * (max - min) + min);
}

function minMaxValue(value, min, max) {
    if(value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function feetPerMinToMS(fpm) {
    return fpm / 60 / 3
}

function knotsToMS(k) {
    return k / 2;
}

function mPSToKnots(ms) {
    return ms * 2;
}
