
function _AP_follow_GS(state) {
    const fps = state.game.dataFPS;
    const plane = state.plane;
    const mupm = state.map.mapUnitsPerMeter;
    state.plane.posMapCoord[0] += (
        (state.plane.horizontalMS * mupm / fps)
        + (state.map.windXVel === null ? 0 : state.map.windXVel * mupm / fps)
    );
    const newYPos = getGlideSlopeY(state.map.glideSlopes, plane.posMapCoord[0]);
    const oldYPos = deepCopy(state.plane.posMapCoord[1]);
    state.plane.posMapCoord[1] = newYPos;
    state.plane.verticalMS = (newYPos - oldYPos) / mupm * fps;
    return state;
}

function AP_dangerousAirspace(state) {
    state = _AP_follow_GS(state);
    state.plane.levelOnNextManeuver = true;
    return state;
}

function AP_ChoppySeas(state) {
    state = _AP_follow_GS(state);
    const flareAfterX = state.map.glideSlopes[0].p1[0] - (25 * state.map.mapUnitsPerMeter);
    state.plane.flare = state.plane.posMapCoord[0] > flareAfterX ? IS_FLARING : IS_NOT_FLARING;
    return state;
}

function autoPilot(state) {
    if(state.game.level === 7) {
        return AP_dangerousAirspace(state);
    } else if (state.game.level === 10) {
        return AP_ChoppySeas(state);
    }
    else {throw NOT_IMPLEMENTED;}
}


function innerAdjustPlanePosition(state) {
    if(window._fa2_isPaused) {
        return state;
    }
    if(
        state.map.getAutopilotStatus
        && state.map.getAutopilotStatus(state)
    ) {
        return autoPilot(state);
    }
    const fps = state.game.dataFPS;
    const plane = state.plane;
    const mupm = state.map.mapUnitsPerMeter;

    let newVerticalMS;
    if(
        state.plane.levelOnNextManeuver
        && (
            plane.lastAccelerateUpFrame === state.game.frame
            || plane.lastAccelerateDownFrame === state.game.frame
        )
    ) {
        state.plane.levelOnNextManeuver = false;
        newVerticalMS = 0;
    }
    else if(
        plane.lastAccelerateUpFrame === state.game.frame
    ) {
        newVerticalMS = Math.min(
            0,
            plane.verticalMS + plane.upAccelerationPerCmdMS,
        );
    }
    else if (plane.lastAccelerateDownFrame === state.game.frame) {
        newVerticalMS = Math.max(
            plane.verticalMS + plane.downAccelerationPerCmdMS,
            plane.terminalVerticalMS,
        );
    }
    else {
        newVerticalMS = Math.max(
            plane.verticalMS + plane.verticalAccelerationMS / fps,
            plane.terminalVerticalMS,
        )
    }

    state.plane.verticalMS = newVerticalMS;
    state.plane.posMapCoord[0] += (
        (state.plane.horizontalMS * mupm / fps)
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
        state.plane.minTouchdownVerticalMS = feetPerMinToMS(-900)
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(69.420);
        state.plane.verticalMS = feetPerMinToMS(-550);

        state.plane.terminalVerticalMS = feetPerMinToMS(-2300);
        state.plane.verticalAccelerationMS = feetPerMinToMS(-600);

        state.plane.upAccelerationPerCmdMS = feetPerMinToMS(550);
        state.plane.downAccelerationPerCmdMS = feetPerMinToMS(-400);

        state.plane.touchDownFlareMinMS = knotsToMS(36);

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
        state.plane.rwNegAccelerationMS = knotsToMS(-15);
        state.plane.minTouchdownVerticalMS = feetPerMinToMS(-1500);
        if(state.game.level > 7) {
            state.plane.minTouchdownVerticalMS = feetPerMinToMS(-2700);
        }
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(130.69);
        state.plane.verticalMS = feetPerMinToMS(-700);
        state.plane.terminalVerticalMS = feetPerMinToMS(-50000);
        state.plane.verticalAccelerationMS = feetPerMinToMS(-800);

        state.plane.upAccelerationPerCmdMS = feetPerMinToMS(750);
        state.plane.downAccelerationPerCmdMS = feetPerMinToMS(-500);

        state.plane.touchDownFlareMinMS = knotsToMS(70);

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
    else {throw NOT_IMPLEMENTED;}
    return state;
}

function setMapProps(state) {
    state.map.mapUnitsPerMeter = state.camera.canvasW > 700 ? 21 : 14;
    const mupm = state.map.mapUnitsPerMeter;
    const level = state.game.level;
    if(level === 1) {
        state.game.levelName = "Flight School";
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwType = RUNWAY_TYPE_CONCRETE;
        state.map.rwVisualWidthM = 8;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1800 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 250 * mupm],
            p1: [1050 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        state.map.cloudLayer = {
            topY: 120 * mupm,
            bottomY: 85 * mupm,
        };
    }
    else if (level === 2) {
        state.game.levelName = "Windy Day";
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwType = RUNWAY_TYPE_CONCRETE;
        state.map.rwVisualWidthM = 7;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1500 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 250 * mupm],
            p1: [1050 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
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
    else if (level === 3) {
        state.game.levelName = "Short Runway";
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwType = RUNWAY_TYPE_DIRT;
        state.map.rwVisualWidthM = 4.5;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1130 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 250 * mupm],
            p1: [1013 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        state.map.windXVel = 0; // +=tailwind, -=headwind
        state.map.windMaxDeltaPerSecond = 6;
        state.map.windXMin = -7;
        state.map.windXMax = 7;
        state.map.windXTarg = 0;
        state.map.cloudLayer = {
            topY: 140 * mupm,
            bottomY: 70 * mupm,
        };
    }
    else if (level === 4) {
        state.game.levelName = "Tail Wind";
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwType = RUNWAY_TYPE_CONCRETE;
        state.map.rwVisualWidthM = 7;
        state.map.rwP0MapCoord = [1000 * mupm, 0];
        state.map.rwP1MapCoord = [1500 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 250 * mupm],
            p1: [1050 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        state.map.windXVel = 0; // +=tailwind, -=headwind
        state.map.windMaxDeltaPerSecond = 8;
        state.map.windXMin = 1;
        state.map.windXMax = 10;
        state.map.windXTarg = 2;
        state.map.cloudLayer = {
            topY: 160 * mupm,
            bottomY: 50 * mupm,
        };
    }
    else if (level === 5) {
        state.game.levelName = "Jet Qualification";
        state.map.terrain = TERRAIN_FOREST;
        state.map.rwType = RUNWAY_TYPE_CONCRETE;
        state.map.rwVisualWidthM = 9;
        state.map.rwP0MapCoord = [1500 * mupm, 0];
        state.map.rwP1MapCoord = [2400 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 400 * mupm],
            p1: [1575 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        state.map.cloudLayer = {
            topY: 150 * mupm,
            bottomY: 70 * mupm,
        };
    }
    else if (level === 6) {
        state.game.levelName = "Low Fuel";
        state.plane.startingFuel = 30;
        state.plane.fuelRemaining = 27;
        state.map.terrain = TERRAIN_DESERT;
        state.map.rwType = RUNWAY_TYPE_DIRT;
        state.map.rwVisualWidthM = 9;
        state.map.rwP0MapCoord = [1500 * mupm, 0];
        state.map.rwP1MapCoord = [1900 * mupm, 0];
        state.map.glideSlopes.push({
            p0: [0, 400 * mupm],
            p1: [1575 * mupm, 0],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        state.map.cloudLayer = {
            topY: 150 * mupm,
            bottomY: 70 * mupm,
        };
    }
    else if (level === 7) {
        state.game.levelName = "Dangerous Airspace";
        state.map.terrain = TERRAIN_DESERT;
        state.map.rwType = RUNWAY_TYPE_DIRT;
        state.map.rwVisualWidthM = 9;
        state.map.rwP0MapCoord = [1750 * mupm, 0];
        const rwEnd = (1750 + 320) * mupm;
        state.map.rwP1MapCoord = [(1750 + 320) * mupm, 0];
        state.map.glideSlopes.push(
            {
                p0: [0, 1000 * mupm],
                p1: [900 * mupm, 900 * mupm],
            },
            {
                p0: [900 * mupm, 900 * mupm],
                p1: [1000 * mupm, 800 * mupm],
            },
            {
                p0: [1000 * mupm, 800 * mupm],
                p1: [1200 * mupm, 130 * mupm], //  LEVEL_7_MAX_SAFE_X_M
            },
            {
                p0: [1200 * mupm, 130 * mupm], //  LEVEL_7_MAX_SAFE_X_M
                p1: [1800 * mupm, 0 * mupm],
                bold: true,
            },
        );
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        const cloudTopY = 900 * mupm;
        const cloudBottomY = 800 * mupm;
        state.map.cloudLayer = {
            topY: cloudTopY,
            bottomY: cloudBottomY,
        };
        state.map.aaFireP0 = [1000 * mupm, 0];
        state.map.getDangerStatus = state => {
            const mupm = state.map.mapUnitsPerMeter;
            const [px, py] = state.plane.posMapCoord;
            // Flew past runway
            if(px > rwEnd && py > LEVEL_7_MAX_SAFE_X_M * mupm) {
                return DANGER_STATUS_INSTANT;
            }
            // In dive zone
            else if(
                py > (LEVEL_7_MAX_SAFE_X_M * mupm)
                && px < rwEnd
            ) {
                return DANGER_STATUS_ON_LEVEL;
            }
            // East of dive zone
            else if( py < cloudBottomY && px < (900 * mupm)) {
                return DANGER_STATUS_INSTANT;
            }
            else if (py > cloudTopY && px > (1200 * mupm)) {
                return DANGER_STATUS_INSTANT;
            }
            else {
                return DANGER_STATUS_NONE;
            }
        }
        state.map.getAutopilotStatus = state => {
            return state.plane.posMapCoord[1] > (750 * mupm);
        }
    }
    else if (level === 8) {
        state.game.levelName = "Carrier Landing 1";
        state.map.terrain = TERRAIN_OCEAN;
        state.map.rwType = RUNWAY_TYPE_CARRIER;
        state.map.rwVisualWidthM = 5;
        state.map.rwP0MapCoord = [1500 * mupm, 15 * mupm];
        state.map.rwP1MapCoord = [1565 * mupm, 15 * mupm];
        state.map.carrierRWArrestorCableMapXs = [
            1501, 1508, 1515, 1520
        ].map(v => v * mupm);
        state.map.carrierRWArrestingGearBounds = {
            xStart: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 < v2 ? v1 : v2),
            xEnd: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 > v2 ? v1 : v2),
        };
        state.map.glideSlopes.push({
            p0: [0, 310 * mupm],
            p1: [1512 * mupm, 15 * mupm],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        // state.plane.posMapCoord = [1400 * mupm, 65 * mupm];
        state.map.cloudLayer = {
            topY: 360 * mupm,
            bottomY: 200 * mupm,
        };
        state.map.carrierMinMapX = state.map.rwP0MapCoord[0];
        state.map.carrierMaxMapX = state.map.rwP1MapCoord[0] + CARRIER_DECK_SIZE_AFTER_RW_M * mupm;
    }
    else if (level === 9) {
        state.game.levelName = "Bingo Fuel";
        state.plane.startingFuel = 30;
        state.plane.fuelRemaining = 25;
        state.map.terrain = TERRAIN_OCEAN;
        state.map.rwType = RUNWAY_TYPE_CARRIER;
        state.map.rwVisualWidthM = 5;
        state.map.rwP0MapCoord = [1500 * mupm, 15 * mupm];
        state.map.rwP1MapCoord = [1565 * mupm, 15 * mupm];
        state.map.carrierRWArrestorCableMapXs = [
            1501, 1508, 1515, 1520
        ].map(v => v * mupm);
        state.map.carrierRWArrestingGearBounds = {
            xStart: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 < v2 ? v1 : v2),
            xEnd: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 > v2 ? v1 : v2),
        };
        state.map.glideSlopes.push({
            p0: [0, 310 * mupm],
            p1: [1512 * mupm, 15 * mupm],
        });
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        // state.plane.posMapCoord = [1400 * mupm, 65 * mupm];
        state.map.cloudLayer = {
            topY: 360 * mupm,
            bottomY: 130 * mupm,
        };
        state.map.carrierMinMapX = state.map.rwP0MapCoord[0];
        state.map.carrierMaxMapX = state.map.rwP1MapCoord[0] + CARRIER_DECK_SIZE_AFTER_RW_M * mupm;
    }
    else if (level === 10) {
        state.game.levelName = "Choppy Seas";
        state.plane.flare = IS_NOT_FLARING;
        state.map.terrain = TERRAIN_OCEAN;
        state.map.rwType = RUNWAY_TYPE_CARRIER;
        state.map.rwVisualWidthM = 5;
        state.map.rwP0MapCoord = [2500 * mupm, 15 * mupm];
        state.map.rwP1MapCoord = [2565 * mupm, 15 * mupm];
        state.map.carrierRWArrestorCableMapXs = [
            2501, 2508, 2515, 2520
        ].map(v => v * mupm);
        state.map.carrierRWArrestingGearBounds = {
            xStart: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 < v2 ? v1 : v2),
            xEnd: state.map.carrierRWArrestorCableMapXs.reduce((v1, v2) => v1 > v2 ? v1 : v2),
        };
        state.map.glideSlopes.push({
            p0: [0, 1000 * mupm],
            p1: [375 * mupm, 1000 * mupm],
        }, {
            p0: [375 * mupm, 1000 * mupm],
            p1: [1600 * mupm, 200 * mupm],
        }, {
            p0: [1600 * mupm, 200 * mupm],
            p1: [
                state.map.rwP0MapCoord[0] + (12 * mupm), // Will update every frame
                state.map.rwP0MapCoord[1],               //
            ],
        });
        state.map.getAutopilotStatus = state => {
            const APXEnd = state.map.glideSlopes[0].p1[0] + (10 * mupm);
            return state.plane.posMapCoord[0] < APXEnd;
        }
        state.plane.posMapCoord = deepCopy(state.map.glideSlopes[0].p0);
        // state.plane.posMapCoord = [1400 * mupm, 65 * mupm];

        const getVar = () => getRandomFloat(-0.15 , 0.15);
        state.map.npcs.push({
            img: state.plane.assets[0],
            type: NPC_TYPE_JET,
            inFront: false,
            dimensions: state.plane.dimensions[0],
            afterBurner: false,
            horizontalMS: state.plane.horizontalMS,
            posMapCoord:[
                state.plane.posMapCoord[0] - ((7 + getVar()) * mupm),
                state.plane.posMapCoord[1] + ((3 + getVar()) * mupm),
            ],
            autopilot: [
                {
                    startX: -100 * mupm,
                    endX: 190 * mupm,
                    verticalMS: 0,
                    horizontalMS: state.plane.horizontalMS,
                }, {
                    startX: 190 * mupm,
                    endX: 200 * mupm,
                    verticalMS: 1,
                    afterBurner: true,
                },{
                    startX: 200 * mupm,
                    endX: 800 * mupm,
                    verticalMS: 3,
                    afterBurner: true,
                }
            ],
        }, {
            img: state.plane.assets[0],
            type: NPC_TYPE_JET,
            inFront: false,
            dimensions: state.plane.dimensions[0],
            afterBurner: false,
            horizontalMS: state.plane.horizontalMS,
            posMapCoord:[
                state.plane.posMapCoord[0] - ((3.5 + getVar()) * mupm),
                state.plane.posMapCoord[1] + ((1.5 + getVar()) * mupm),
            ],
            autopilot: [
                {
                    startX: -100 * mupm,
                    endX: 185 * mupm,
                    verticalMS: 0,
                },{
                    startX: 185 * mupm,
                    endX: 200 * mupm,
                    verticalMS: 1,
                    afterBurner: true,
                }, {
                    startX: 200 * mupm,
                    endX: 800 * mupm,
                    verticalMS: 3,
                    afterBurner: true,
                }
            ],
        }, {
            img: state.plane.assets[0],
            type: NPC_TYPE_JET,
            inFront: true,
            dimensions: state.plane.dimensions[0],
            afterBurner: false,
            horizontalMS: state.plane.horizontalMS,
            posMapCoord:[
                state.plane.posMapCoord[0] + ((3.5 + getVar()) * mupm),
                state.plane.posMapCoord[1] - ((1.5 + getVar()) * mupm),
            ],
            autopilot: [
                {
                    startX: -100 * mupm,
                    endX: 188 * mupm,
                    verticalMS: 0,
                },{
                    startX: 188 * mupm,
                    endX: 200 * mupm,
                    verticalMS: 1,
                    afterBurner: true,
                }, {
                    startX: 200 * mupm,
                    endX: 800 * mupm,
                    verticalMS: 3,
                    afterBurner: true,
                }
            ],
        }, {
            img: state.plane.assets[0],
            type: NPC_TYPE_JET,
            inFront: true,
            dimensions: state.plane.dimensions[0],
            afterBurner: false,
            horizontalMS: state.plane.horizontalMS,
            posMapCoord:[
                state.plane.posMapCoord[0] + ((7 + getVar()) * mupm),
                state.plane.posMapCoord[1] - ((3 + getVar()) * mupm),
            ],
            autopilot: [
                {
                    startX: -100 * mupm,
                    endX: 190 * mupm,
                    verticalMS: 0,
                },{
                    startX: 190 * mupm,
                    endX: 200 * mupm,
                    verticalMS: 1,
                    afterBurner: true,
                }, {
                    startX: 200 * mupm,
                    endX: 800 * mupm,
                    verticalMS: 3,
                    afterBurner: true,
                }
            ],
        });
        state.map.cloudLayer = {
            topY: 850 * mupm,
            bottomY: 700 * mupm,
            isDark: true,
        };
        state.map.carrierMinMapX = state.map.rwP0MapCoord[0];
        state.map.carrierMaxMapX = state.map.rwP1MapCoord[0] + CARRIER_DECK_SIZE_AFTER_RW_M * mupm;
    }
    else {throw NOT_IMPLEMENTED;}
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
