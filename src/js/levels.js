
function c152AdjustPlanePosition(state) {
    let stallFD
    let levelFlightFD;
    let frameXDelta;
    let frameYDelta;
    let deltaYMS;
    const attitude = state.plane.attitude
    if(attitude === ATTITUDE_0) {
        stallFD = 40 / state.game.dataFPS
        levelFlightFD = null;
    }
    else if (attitude === ATTITUDE_1) {
        stallFD = 45 / state.game.dataFPS
        levelFlightFD = 70 / state.game.dataFPS;
    }
    else if (attitude === ATTITUDE_2) {
        stallFD = 50 / state.game.dataFPS
        levelFlightFD = 65 / state.game.dataFPS;
    }
    // Calculate X
    const thrust = state.plane.thrust;
    if(thrust) {
        // Instantaneous thrust
        const newtons = 135;
        if(attitude === ATTITUDE_0) {
            deltaXMS = newtons / state.plane.massKG * 1.25;
        }
        else if (attitude === ATTITUDE_1) {
            deltaXMS = newtons / state.plane.massKG;
        }
        else if (attitude === ATTITUDE_2) {
            deltaXMS = newtons / state.plane.massKG * 0.8;
        }
    } else {
        // Glide
        if(attitude === ATTITUDE_0) {
            deltaXMS = 4;
        }
        else if (attitude === ATTITUDE_1) {
            deltaXMS = -1.2;
        }
        else if (attitude === ATTITUDE_2) {
            deltaXMS = 2.5;
        }
    }
    frameXDelta = deltaXMS / state.game.dataFPS;
    state.plane.xVelMS += frameXDelta;
    const newXVelFrame = state.plane.xVelMS / state.game.dataFPS;

    // Calculate Y
    if(newXVelFrame < stallFD) {
        deltaYMS = -10;
    } else if(levelFlightFD !== null && newXVelFrame <= levelFlightFD) {
        const percentUnder = (levelFlightFD - newXVelFrame) / newXVelFrame;
        deltaYMS = -14 * percentUnder;
    } else if (levelFlightFD !== null && newXVelFrame > levelFlightFD) {
        const percentOver = (newXVelFrame - levelFlightFD) / levelFlightFD;
        deltaYMS = 4 * percentOver;
    } else {
        const percentOver = (newXVelFrame - stallFD) / stallFD;
        deltaYMS = -20 * percentOver;
    }
    frameYDelta = deltaYMS / state.game.dataFPS;
    state.plane.yVelMS += frameYDelta;

    // Calculate position
    state.plane.posMapCoord[0] = state.plane.posMapCoord[0] + newXVelFrame;
    state.plane.posMapCoord[1] = state.plane.posMapCoord[1] + state.plane.yVelMS / state.game.dataFPS;

    return state;
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
        state.plane.yVelMS = 0;
        state.plane.xVelMS = 30;
        state.plane.maxTouchdownSpeedMS = 6;
        state.plane.rwNegAccelerationMS = 4;
        state.plane.adjustPlanePosition = c152AdjustPlanePosition;
    }
    return state;
}
