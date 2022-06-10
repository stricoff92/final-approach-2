
function innerAdjustPlanePosition(state) {
    state.game.acceptControlCommands = state.plane.flare === IS_NOT_FLARING;

    const fps = state.game.dataFPS;
    const plane = state.plane;
    const nowTS = performance.now();

    // Calculate these new values
    let newHorizontalMS;
    let newVerticalMS;

    if(
        plane.lastLevelOutFrame === state.game.frame
    ) {
        newVerticalMS = 0;
        newHorizontalMS = plane.leveledOutInitialHorizontalMS;
    }
    else if (plane.lastFlareFrame === state.game.frame) {
        newVerticalMS = 0;
        newHorizontalMS = plane.horizontalMS;
    }
    else if (plane.flare) {
        if (plane.horizontalMS < plane.flareTerminalHorizontalMS) {
            // End of flare.
            state.plane.flare = IS_NOT_FLARING;
            newVerticalMS = 0;
            const deltaHorizontalMF = plane.leveledOutHorizontalAccelerationMS2 / fps;
            newHorizontalMS = plane.horizontalMS + deltaHorizontalMF;
        } else {
            // Continue flaring.
            const elapsedFlareMS = nowTS - plane.lastFlareTS;
            const verticalAccMS = plane.flareVerticalAccelerationMS2Curve(elapsedFlareMS);
            const verticalAccMF = verticalAccMS / fps;
            newVerticalMS = plane.verticalMS + verticalAccMF;

            const deltaHorizontalMF = plane.flareHorizontalAccelerationMS2 / fps;
            newHorizontalMS = plane.horizontalMS + deltaHorizontalMF;
        }
    }
    else {
        const elapsedLeveledOutMS = nowTS - plane.lastLevelOutTS;
        const verticalAccMS = plane.leveledOutVerticalAccelerationMS2Curve(elapsedLeveledOutMS);
        const verticalAccMF = verticalAccMS / fps;
        newVerticalMS = plane.verticalMS + verticalAccMF;

        const deltaHorizontalMF = plane.leveledOutHorizontalAccelerationMS2 / fps;
        newHorizontalMS = Math.min(
            plane.leveledOutTerminalHorizontalMS,
            plane.horizontalMS + deltaHorizontalMF,
        )
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
        state.plane.dimensions = [],
        state.plane.rwNegAccelerationMS = knotsToMS(-6);
        state.plane.minTouchdownVerticalMS = feetPerMinToMS(-750)
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(58);
        state.plane.verticalMS = feetPerMinToMS(-550);

        state.plane.lastLevelOutTS = performance.now();
        state.plane.lastLevelOutFrame = state.game.frame;
        state.plane.leveledOutInitialHorizontalMS = knotsToMS(50);
        state.plane.leveledOutHorizontalAccelerationMS2 = knotsToMS(3);
        state.plane.leveledOutTerminalHorizontalMS = knotsToMS(69);

        state.plane.leveledOutTerminalVerticalMS = feetPerMinToMS(-1800);
        state.plane.leveledOutVerticalAccelerationMS2Curve = elapsedMS => {
            return -0.125 * Math.pow(elapsedMS / 1000, 2) - 1.5;
        }

        state.plane.flareTerminalHorizontalMS = knotsToMS(40);
        state.plane.flareHorizontalAccelerationMS2 = knotsToMS(-5);
        state.plane.flareVerticalAccelerationMS2Curve = elapsedMS => {
            return -0.02 * Math.pow(elapsedMS / 1000, 2) - 0.5;
        }
        state.plane.touchDownFlareMinMS = 18;

        const noFlareAsset = new Image();
        noFlareAsset.src = "img/" + PLANE_C152 + "-0.svg";
        const flareAsset = new Image();
        flareAsset.src = "img/" + PLANE_C152 + "-1.svg";
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
