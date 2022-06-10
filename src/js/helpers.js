
function urlContainsDebug() {
    return window.location.search.indexOf("debug") !== -1;
}

function mapCoordToCanvasCoord(mapCoord, cameraPosition, camera) {
    const mapDx = mapCoord[0] - cameraPosition[0];
    const mapDy = mapCoord[1] - cameraPosition[1];
    return [
        mapDx + camera.canvasHalfW,
        camera.canvasH - (mapDy + camera.canvasHalfH),
    ];
}

function updateCameraCanvasMetaData(state) {
    const canvas = document.getElementById("game-canvas");
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

function feetPerMinToMS(fpm) {
    return fpm / 60 / 3
}

function knotsToMS(k) {
    return k / 2;
}

function mPSToKnots(ms) {
    return ms * 2;
}
