
function innerAdjustPlanePosition(state) {
    state.game.acceptControlCommands = true;

    const fps = state.game.dataFPS;
    const plane = state.plane;
    const horizontalMF = plane.horizontalMS / fps;
    const verticalMF = plane.verticalMS / fps;

    let newHorizontalMS;
    let newVerticalMS;

    if(
        plane.flare === IS_NOT_FLARING
        && plane.lastLevelOutFrame === state.game.frame
    ) {
        newVerticalMS = 0;
    }



    state.plane.horizontalMS = newHorizontalMS;
    state.plane.verticalMS = newVerticalMS;
    state.plane.posMapCoord[0] += (
        newHorizontalMS * state.map.mapUnitsPerMeter / fps
    );
    state.plane.posMapCoord[1] += (
        newVerticalMS * state.map.mapUnitsPerMeter / fps
    );

    return state;
}

function setPlaneProps(state) {
    if(!state.game.level) {
        throw new Error("level not set");
    }
    if(state.game.level < 6) {
        state.plane.asset = PLANE_C152;
        state.plane.thrust = false;
        state.plane.dimensions = [],
        state.plane.rwNegAccelerationMS = knotsToMS(-6);
        state.plane.minTouchdownVerticalMS = feetPerMinToMS(-750)
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(58);
        state.plane.verticalMS = 0;

        const noFlareAsset = new Image();
        noFlareAsset.src = "img/" + PLANE_C152 + "-1.svg";
        const flareAsset = new Image();
        flareAsset.src = "img/" + PLANE_C152 + "-2.svg";
        state.plane.assets.push(
            noFlareAsset,
            flareAsset,
        );

        state.plane.dimensions.push(
            [6.0, 2],     // no flare (nose level)
            [5.95, 2.05], // flare    (nose us)
        );

    }
    return state;
}

function setMapProps(state) {
    const mupm = 25
    state.map.mapUnitsPerMeter = 25;
    const level = state.game.level;
    if(level < 4) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1500 * mupm, 0];
        state.map.gsP0MapCoord = [0, 200 * mupm];
        state.map.gsP1MapCoord = [1010 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        if(level == 1) {
            state.map.windXVel = 0;
            state.map.windVolitility = 0.05;
            state.map.windXMin = -4;
            state.map.windXMax = 4;
            state.map.windXTarg = 0;
        } else if (level == 2) {
            throw NOT_IMPLEMENTED;
        } else if(level == 3) {
            throw NOT_IMPLEMENTED;
        }
    } else if(level < 7) {
        state.map.terrain = TERRAIN_DESERT;
        throw NOT_IMPLEMENTED;
    } else {
        state.map.terrain = TERRAIN_OCEAN;
        throw NOT_IMPLEMENTED;
    }
    return state;
}
