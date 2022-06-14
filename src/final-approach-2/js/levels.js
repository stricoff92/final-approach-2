
function innerAdjustPlanePosition(state) {
    state.game.acceptControlCommands = state.plane.flare === IS_NOT_FLARING;

    if(state.isPaused) {
        return state;
    }

    const fps = state.game.dataFPS;
    const plane = state.plane;
    const mupm = state.map.mapUnitsPerMeter
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
        const verticalAccMS = plane.leveledOutVerticalAccelerationMS2Curve(
            elapsedLeveledOutMS,
            state.map.windXVel,
        );
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
        (newHorizontalMS * mupm / fps)
        + (state.map.windXVel === null ? 0 : state.map.windXVel * mupm / fps)
    );
    state.plane.posMapCoord[1] += (
        newVerticalMS * mupm / fps
    );

    return state;
}

function setPlaneProps(state) {
    if(!state.game.level) {
        throw new Error("level not set");
    }
    if(state.game.level <= 4) {
        // C152
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
        state.plane.leveledOutVerticalAccelerationMS2Curve = (elapsedMS, windMS) => {
            const f = elapsedMS => -0.125 * Math.pow(elapsedMS / 1000, 2) - 1.5;
            if(!windMS) {
                return f(elapsedMS);
            }
            let windAdj;
            if(windMS < 0) {
                // Headwind, less -acceleration
                // Adj between 0.1 and 1
                windAdj = minMaxValue(-0.005 * Math.pow(windMS, 2) + 1, 0.1, 1);
            }
            else {
                // Tailwind, more -acceleration
                // Adj between 1 and 7
                windAdj = minMaxValue(0.03 * Math.pow(windMS, 2) + 1, 1, 7);
            }
            return f(elapsedMS) * windAdj;
        }

        state.plane.flareTerminalHorizontalMS = knotsToMS(40);
        state.plane.flareHorizontalAccelerationMS2 = knotsToMS(-5);
        state.plane.flareVerticalAccelerationMS2Curve = elapsedMS => {
            return -0.02 * Math.pow(elapsedMS / 1000, 2) - 0.75;
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

    } else if(state.game.level <= 10) {
        // F18
        state.plane.asset = PLANE_C152;
        state.plane.dimensions = [],
        state.plane.rwNegAccelerationMS = knotsToMS(-10);
        state.plane.minTouchdownVerticalMS = feetPerMinToMS(-1500)
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(58);
        state.plane.verticalMS = feetPerMinToMS(-550);
        state.plane.lastLevelOutTS = performance.now();
        state.plane.lastLevelOutFrame = state.game.frame;
        state.plane.leveledOutInitialHorizontalMS = knotsToMS(100);
        state.plane.leveledOutHorizontalAccelerationMS2 = knotsToMS(10);
        state.plane.leveledOutTerminalHorizontalMS = knotsToMS(140);
        state.plane.leveledOutTerminalVerticalMS = feetPerMinToMS(-2200);
        state.plane.leveledOutVerticalAccelerationMS2Curve = (elapsedMS, windMS) => {
            const f = elapsedMS => -0.3 * Math.pow(elapsedMS / 1000, 2) - 4;
            if(!windMS) {
                return f(elapsedMS);
            }
            let windAdj;
            if(windMS < 0) {
                // Headwind, less -acceleration
                // Adj between 0.1 and 1
                windAdj = minMaxValue(-0.005 * Math.pow(windMS, 2) + 1, 0.1, 1);
            }
            else {
                // Tailwind, more -acceleration
                // Adj between 1 and 7
                windAdj = minMaxValue(0.03 * Math.pow(windMS, 2) + 1, 1, 7);
            }
            return f(elapsedMS) * windAdj;
        }
        state.plane.flareTerminalHorizontalMS = knotsToMS(85);
        state.plane.flareHorizontalAccelerationMS2 = knotsToMS(-8);
        state.plane.flareVerticalAccelerationMS2Curve = elapsedMS => {
            return -0.03 * Math.pow(elapsedMS / 1000, 2) - 1;
        }
        state.plane.touchDownFlareMinMS = 35;

        const noFlareAsset = new Image();
        noFlareAsset.src = "img/" + PLANE_F18 + "-0.svg";
        const flareAsset = new Image();
        flareAsset.src = "img/" + PLANE_F18 + "-1.svg";
        state.plane.assets.push(
            noFlareAsset,
            flareAsset,
        );
        state.plane.dimensions.push(
            [10.0, 3.5], // no flare (nose level)
            [9.7, 3.8],  // flare    (nose us)
        );
    }
    else {
        throw NOT_IMPLEMENTED;
    }
    return state;
}

function setMapProps(state) {
    state.map.mapUnitsPerMeter = state.camera.canvasW > 700 ? 21 : 14;
    const mupm = state.map.mapUnitsPerMeter;
    const level = state.game.level;
    if(level === 1) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.gsP0MapCoord = [0, 250 * mupm];
        state.map.gsP1MapCoord = [1050 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        state.map.cloudLayer = {
            topY: 120 * mupm,
            bottomY: 85 * mupm,
        };
    }
    else if (level === 2) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.gsP0MapCoord = [0, 250 * mupm];
        state.map.gsP1MapCoord = [1050 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        state.map.windXVel = 0; // +=tailwind, -=headwind
        state.map.windMaxDeltaPerSecond = 2;
        state.map.windXMin = -5;
        state.map.windXMax = 5;
        state.map.windXTarg = 0;
        state.map.cloudLayer = {
            topY: 140 * mupm,
            bottomY: 70 * mupm,
        };
    }
    else if (level === 3) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.gsP0MapCoord = [0, 250 * mupm];
        state.map.gsP1MapCoord = [1050 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        state.map.windXVel = 0; // +=tailwind, -=headwind
        state.map.windMaxDeltaPerSecond = 4;
        state.map.windXMin = -6;
        state.map.windXMax = 6;
        state.map.windXTarg = 0;
        state.map.cloudLayer = {
            topY: 150 * mupm,
            bottomY: 60 * mupm,
        };
    }
    else if (level === 4) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.gsP0MapCoord = [0, 250 * mupm];
        state.map.gsP1MapCoord = [1050 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        state.map.windXVel = 0; // +=tailwind, -=headwind
        state.map.windMaxDeltaPerSecond = 6;
        state.map.windXMin = 1;
        state.map.windXMax = 10;
        state.map.windXTarg = 0;
        state.map.cloudLayer = {
            topY: 160 * mupm,
            bottomY: 50 * mupm,
        };
    }
    else if (level === 5) {
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.gsP0MapCoord = [0, 250 * mupm];
        state.map.gsP1MapCoord = [1050 * mupm, 0];
        state.plane.posMapCoord = deepCopy(state.map.gsP0MapCoord);
        state.map.cloudLayer = {
            topY: 120 * mupm,
            bottomY: 85 * mupm,
        };
    }
    else {
        throw NOT_IMPLEMENTED;
    }
    if(
        state.map.windXMin < (WIND_MAX_MAGNITUDE_MS * -1)
        || state.map.windXMax > WIND_MAX_MAGNITUDE_MS
    ) {
        throw NOT_IMPLEMENTED;
    }

    state.map.sunImg = new Image();
    state.map.sunImg.src = "img/sun.svg";

    return state;
}


function calculateScore(state) {
    const level = state.game.level;
    const levelMultiplier = level == 1 ? 1 : (1 + level / 15)
    const tdStats = state.plane.touchdownStats;

    const currentHighScore = getCookie(getCNameHighScore(level));

    // Overall
    if(tdStats.isSmooth) {
        if(tdStats.isFlaired) {
            state.game.score.overall.value = "Smooth";
            state.game.score.overall.points = 600 * levelMultiplier;
        }
        else {
            state.game.score.overall.value = "Good";
            state.game.score.overall.points = 400 * levelMultiplier;
        }
    }
    else if (tdStats.isRough) {
        state.game.score.overall.value = "Rough";
        state.game.score.overall.points = 0 * levelMultiplier;
    }
    else {
        state.game.score.overall.value = "Ok";
        state.game.score.overall.points = 200 * levelMultiplier;
    }

    // Vertical Speed
    let vsScoreCurve;
    if (state.plane.asset === PLANE_C152) {
        vsScoreCurve = vms => Math.max(0, -40 * Math.pow(vms, 2) + 600)
    }
    else {
        throw NOT_IMPLEMENTED;
    }
    state.game.score.verticalSpeed.value = `${tdStats.verticalMS.toFixed(2)} M/S`;
    state.game.score.verticalSpeed.points = vsScoreCurve(tdStats.verticalMS) * levelMultiplier;
    state.game.score.verticalSpeed.emphasize = Math.abs(tdStats.verticalMS) <= 0.15;

    // Accuracy
    let accScoreCurve;
    if (state.plane.asset === PLANE_C152) {
        accScoreCurve = distance => {
            const aBonus = Math.abs(distance) <= 1 ? 2.5 : 1;
            return Math.max(0, -0.2 * Math.pow(distance, 2) + 600) * aBonus;
        }
    }
    else {
        throw NOT_IMPLEMENTED;
    }
    state.game.score.accuracy.value = `${tdStats.distanceToGlideSlopeM.toFixed(2)} M`;
    state.game.score.accuracy.points = accScoreCurve(tdStats.distanceToGlideSlopeM) * levelMultiplier;
    state.game.score.accuracy.emphasize = tdStats.distanceToGlideSlopeM <= 1;

    state.game.score.total = Math.round(
        state.game.score.accuracy.points
        + state.game.score.verticalSpeed.points
        + state.game.score.overall.points
    );

    state.game.score.isNewHighScore = Boolean(
        currentHighScore === null
        || parseInt(currentHighScore) < state.game.score.total
    );
    state.game.score.currentHighScore = currentHighScore;

    state.game.score.scorePhaseStartedTS = deepCopy(state.game.lastFrameTS);
    console.log({ score: state.game.score });
    return state;
}
