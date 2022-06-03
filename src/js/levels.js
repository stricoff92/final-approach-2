
// function c152AdjustPlanePosition(state) {
//     let stallFD
//     let levelFlightFD;
//     let frameXDelta;
//     let frameYDelta;
//     let deltaYMS;
//     const attitude = state.plane.attitude
//     if(attitude === ATTITUDE_0) {
//         stallFD = 40 / state.game.dataFPS
//         levelFlightFD = null;
//     }
//     else if (attitude === ATTITUDE_1) {
//         stallFD = 45 / state.game.dataFPS
//         levelFlightFD = 70 / state.game.dataFPS;
//     }
//     else if (attitude === ATTITUDE_2) {
//         stallFD = 50 / state.game.dataFPS
//         levelFlightFD = 65 / state.game.dataFPS;
//     }
//     // Calculate X
//     const thrust = state.plane.thrust;
//     if(thrust) {
//         // Instantaneous thrust
//         const newtons = 135;
//         if(attitude === ATTITUDE_0) {
//             deltaXMS = newtons / state.plane.massKG * 1.25;
//         }
//         else if (attitude === ATTITUDE_1) {
//             deltaXMS = newtons / state.plane.massKG;
//         }
//         else if (attitude === ATTITUDE_2) {
//             deltaXMS = newtons / state.plane.massKG * 0.8;
//         }
//     } else {
//         // Glide
//         if(attitude === ATTITUDE_0) {
//             deltaXMS = 4;
//         }
//         else if (attitude === ATTITUDE_1) {
//             deltaXMS = -1.2;
//         }
//         else if (attitude === ATTITUDE_2) {
//             deltaXMS = 2.5;
//         }
//     }
//     frameXDelta = deltaXMS / state.game.dataFPS;
//     state.plane.xVelMS += frameXDelta;
//     const newXVelFrame = state.plane.xVelMS / state.game.dataFPS;

//     // Calculate Y
//     if(newXVelFrame < stallFD) {
//         deltaYMS = -10;
//     } else if(levelFlightFD !== null && newXVelFrame <= levelFlightFD) {
//         const percentUnder = (levelFlightFD - newXVelFrame) / newXVelFrame;
//         deltaYMS = -14 * percentUnder;
//     } else if (levelFlightFD !== null && newXVelFrame > levelFlightFD) {
//         const percentOver = (newXVelFrame - levelFlightFD) / levelFlightFD;
//         deltaYMS = 4 * percentOver;
//     } else {
//         const percentOver = (newXVelFrame - stallFD) / stallFD;
//         deltaYMS = -20 * percentOver;
//     }
//     frameYDelta = deltaYMS / state.game.dataFPS;
//     state.plane.yVelMS += frameYDelta;

//     // Calculate position
//     state.plane.posMapCoord[0] = state.plane.posMapCoord[0] + newXVelFrame;
//     state.plane.posMapCoord[1] = state.plane.posMapCoord[1] + state.plane.yVelMS / state.game.dataFPS;

//     return state;
// }

function innerAdjustPlanePosition(state) {
    const frameHorizontalV = state.plane.horizontalVMS / state.game.dataFPS
    const frameStallV = state.plane.stallMS / state.game.dataFPS;
    const frameClimbMinV = state.plane.climbMinMS / state.game.dataFPS;
    const frameLevelFlightMinV = state.plane.levelFlightMinMS / state.game.dataFPS;

    if(frameHorizontalV < frameStallV) {
        // plane is stalling
        // force nose down, accelerate to stallMaxVerticalVMS
        const newVerticalVMS = Math.max(
            state.plane.stallMaxVerticalVMS,
            state.plane.verticalVMS
                - state.plane.stallNegHAccelerationMS
                / state.game.dataFPS,
        );
        state.plane.verticalVMS = newVerticalVMS;
        state.plane.attitude = ATTITUDE_0;
    }
    else if (state.plane.attitude === ATTITUDE_0) {
        // Nose down and plane is not stalling
        // shed altitude, accelerate to attitude0GlideVMS
        const frameGlideVAcc = state.plane.attitude0GlideAVMS / state.game.dataFPS
        if(state.plane.horizontalVMS > state.plane.attitude0GlideVMS) {
            // speed up decent to attitude0GlideVMS
            const newVerticalVMS = Math.max(
                state.plane.attitude0GlideVMS,
                state.plane.horizontalVMS - frameGlideAcc * -1
            )
        } else {
            // slow down to attitude0GlideVMS

        }
    }
    else if (
        state.plane.attitude === ATTITUDE_1
        && frameHorizontalV < frameLevelFlightMinV
    ) {
        // nose level, not enough speed for level flight
        // trade altitude, accelerate to attitude1GlideVMS
    }
    else if (
        state.plane.attitude === ATTITUDE_1
        && frameHorizontalV >= frameLevelFlightMinV
    ) {
        // nose level, enough speed for level flight
        // shed speed and maintain altitude
    }
    else if (
        state.plane.attitude === ATTITUDE_2
        && frameHorizontalV < frameLevelFlightMinV
    ) {
        // Nose up, not enough speed for level flight
        // shed altitude, accelerate to attitude2GlideVMS
    }
    else if (
        state.plane.attitude === ATTITUDE_2
        && frameHorizontalV < frameClimbMinV
    ) {
        // Nose up, not enough speed for climb
        // shed speed and maintain altitude
    }
    else if (
        state.plane.attitude === ATTITUDE_2
        && frameHorizontalV >= frameClimbMinV
    ) {
        // nose up, enough speed for a climb
        // if thrusting, accelerate to attitude2ClimbVMS
        // if not thrusting shed speed
    }

    // Adjust horizontal speed

    // Update state's position
}

function feetPerMinToMS(fpm) {
    return fpm / 60 / 3
}

function knotsToMS(k) {
    return k / 2;
}

function setPlaneProps(state) {
    if(!state.game.level) {
        throw new Error("level not set");
    }
    if(state.game.level < 6) {
        state.plane.asset = PLANE_C152;
        state.plane.massKG = 85;
        state.plane.attitude = ATTITUDE_1;
        state.plane.thrust = false;
        state.plane.dimensions = [],
        state.plane.minTouchdownVerticalSpeedMS = feetPerMinToMS(-500)
        state.plane.rwNegAccelerationMS = 4;
        state.plane.adjustPlanePosition = innerAdjustPlanePosition;

        state.plane.horizontalMS = knotsToMS(58);
        state.plane.verticalMS = 0

        state.plane.instantaneousThrust = true;
        state.plane.maxThrustingNewtons = 225;
        state.plane.currentThrustingNewtons = 0;
        state.plane.deltaNewtonPS = null;

        state.plane.stallHorizonalMS = knotsToMS(43);
        state.plane.climbMinHorizontalMS = knotsToMS(55);
        state.plane.levelFlightMinAirfoilVelocitiesyMS = [
            null, // No level flight for attitude 0
            knotsToMS(52),
            knotsToMS(47),
        ];
        state.plane.terminalHorizonalGlideSpeedsMS = [
            knotsToMS(72),
            knotsToMS(48),
            knotsToMS(41),
        ];
        state.plane.terminalVerticalGlideSpeedsMS = [
            feetPerMinToMS(-2000),
            feetPerMinToMS(-1000),
            feetPerMinToMS(-550),
        ];

        state.plane.attitude2GlideNegativeAccelerationCurve = xMS => {
            if(xMS < knotsToMS(53)) {
                // y = 0.0006x^2
                return -1 * Math.pow(xMS, 2) * 0.0006;
            } else {
                return -1.5 * xMS + 77.82;
            }
        }



        const attitude0Asset = new Image();
        attitude0Asset.src = "img/" + PLANE_C152 + "-0.svg";
        const attitude1Asset = new Image();
        attitude1Asset.src = "img/" + PLANE_C152 + "-1.svg";
        const attitude2Asset = new Image();
        attitude2Asset.src = "img/" + PLANE_C152 + "-2.svg";
        state.plane.assets.push(
            attitude0Asset,
            attitude1Asset,
            attitude2Asset,
        );
        state.plane.dimensions.push(
            [6.0, 2.5], // attitude 0
            [6.0, 2],   // attitude 1
            [6.0, 2.0], // attitude 2
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
        state.map.rwP0MapCoord = [5000 * mupm, 0];
        state.map.rwP1MapCoord = [6000 * mupm, 0];
        state.map.gsP0MapCoord = [0, 1000 * mupm];
        state.map.gsP1MapCoord = [5015 * mupm, 0];
        state.plane.posMapCoord = [0, 1000 * mupm];
        if(level == 1) {
            state.map.windXVel = 0;
            state.map.windVolitility = 0.05;
            state.map.windXMin = -4;
            state.map.windXMax = 4;
            state.map.windXTarg = 0;
        } else if (level == 2) {
            throw "not implemented";
        } else if(level == 3) {
            throw "not implemented";
        }
    } else if(level < 7) {
        state.map.terrain = TERRAIN_DESERT;
        throw "not implemented";
    } else {
        state.map.terrain = TERRAIN_OCEAN;
        throw "not implemented";
    }
    return state;
}
