
function innerAdjustPlanePosition(state) {
    state.plane.isStalling = false;

    const fps = state.game.dataFPS;
    const plane = state.plane;
    const horizontalMF = plane.horizontalMS / fps;
    const verticalMF = plane.verticalMS / fps;
    const frameStallV = plane.stallHorizonalMS / fps;

    let frameDeltaXPosMeters;
    let newHorizontalMS;
    let frameDeltaYPosMeters;
    let newVerticalMS;
    if(horizontalMF < frameStallV) {
        state.plane.isStalling = true;
        state.plane.attitude = ATTITUDE_0;
        frameDeltaXPosMeters = plane.stallHorizontalAcceleration / fps;
        newHorizontalMS = plane.horizontalMS + frameDeltaXPosMeters;
        frameDeltaYPosMeters = plane.stallVerticalAcceleration / fps;
        newVerticalMS = plane.verticalMS + frameDeltaYPosMeters;
    }
    else if (plane.attitude === ATTITUDE_0) {
        // Plane is nose down, accelerating
        // +horizontally and -vertically.
        const termDeltaXMS = plane.terminalHorizonalGlideSpeedsMS[ATTITUDE_0];
        const horizontalGlideAccCurve = plane.horizontalGlideAccelerationCurves[ATTITUDE_0];
        const xAccMS =  horizontalGlideAccCurve(plane.horizontalMS);
        const xAccMF = xAccMS / fps;
        newHorizontalMS = Math.min(
            termDeltaXMS,
            plane.horizontalMS + xAccMF
        )

        const termDeltaYMS = plane.terminalVerticalGlideSpeedsMS[ATTITUDE_0];
        const verticalGlideAccelerationCurve = plane.verticalGlideAccelerationCurves[ATTITUDE_0];
        const yAccMS = verticalGlideAccelerationCurve(plane.horizontalMS);
        const yAccMF = yAccMS / fps;
        newVerticalMS = Math.max(
            plane.verticalMS + yAccMF,
            termDeltaYMS,
        )
    }
    else if (plane.attitude === ATTITUDE_1) {
        // accelerate +/-horizontally and +/-vertically
        // to terminal glide speeds
        const att = ATTITUDE_1;

        const termDeltaXMS = plane.terminalHorizonalGlideSpeedsMS[att];
        const termDeltaXMF = termDeltaXMS / fps;
        if(horizontalMF < termDeltaXMF) {
            // +horizontal acceleration to term
            const xAccMS = 3.4;
            const xAccMF = xAccMS / fps;
            newHorizontalMS = Math.min(
                termDeltaXMS,
                plane.horizontalMS + xAccMF
            );
        } else {
            // -horizontal acceleration to term
            const horizontalGlideAccCurve = plane.horizontalGlideAccelerationCurves[att];
            const xAccMS =  horizontalGlideAccCurve(plane.horizontalMS);
            const xAccMF = xAccMS / fps;
            newHorizontalMS = Math.min(
                termDeltaXMS,
                plane.horizontalMS + xAccMF
            );
        }

        const levelFlightMinMF = plane.levelFlightMinVelocitiesMS[att] / fps;
        const isLevelFlight = horizontalMF >= levelFlightMinMF;
        if(isLevelFlight) {
            newVerticalMS = 0;
        } else {
            const termDeltaYMS = plane.terminalVerticalGlideSpeedsMS[att];
            const termDeltaYMF = termDeltaYMS / fps;
            if(verticalMF < termDeltaYMF) {
                // Slow down descent to terminal glide speed
                const yAccMS = 1.5;
                const yAccMF = yAccMS / fps;
                newVerticalMS = Math.min(
                    termDeltaYMS,
                    plane.verticalMS + yAccMF
                );
            }
            else if (verticalMF > termDeltaYMF) {
                // speed up descent to terminal glide speed
                const verticalGlideAccelerationCurve = plane.verticalGlideAccelerationCurves[att];
                const yAccMS = verticalGlideAccelerationCurve(plane.horizontalMS);
                const yAccMF = yAccMS / fps;
                newVerticalMS = Math.max(
                    termDeltaYMS,
                    plane.verticalMS + yAccMF
                );
            }
            else {
                newVerticalMS = plane.verticalMS;
            }
        }
    }
    else if(!plane.thrust && plane.attitude === ATTITUDE_2) {
        // Nose up, no thrust
        const att = 2;

        const termDeltaXMS = plane.terminalHorizonalGlideSpeedsMS[att];
        const termDeltaXMF = termDeltaXMS / fps;
        if(horizontalMF > termDeltaXMF) {
            // -horizontal acc
            const termDeltaXMS = plane.terminalHorizonalGlideSpeedsMS[att];
            const horizontalGlideAccelerationCurve = plane.horizontalGlideAccelerationCurves[att];
            const xAccMS = horizontalGlideAccelerationCurve(plane.horizontalMS);
            const xAccMF = xAccMS / fps;
            newHorizontalMS = Math.max(
                termDeltaXMS,
                plane.horizontalMS + xAccMF
            );
        }
        else {
            newHorizontalMS = plane.horizontalMS;
        }

        const climbMinMF = plane.climbMinHorizontalMS / fps;
        const levelFlightMinMF = plane.levelFlightMinVelocitiesMS[att] / fps;
        if(horizontalMF < levelFlightMinMF) {
            // descent
        } else if (horizontalMF >= levelFlightMinMF && horizontalMF < climbMinMF) {
            // level flight
        } else if(horizontalMF >= climbMinMF) {
            // climb
        }
    }
    else {
        throw "not implemented";
    }


    return state;
}

function feetPerMinToMS(fpm) {
    // feet per minute to meters per second
    return fpm / 60 / 3
}

function knotsToMS(k) {
    // knots to meters per second
    return k / 2;
}

function mPSToKnots(ms) {
    // Meters per second to knots
    return ms * 2;
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
        state.plane.verticalMS = 0;

        state.plane.instantaneousThrust = true;
        state.plane.maxThrustingNewtons = 225;
        state.plane.currentThrustingNewtons = 0;
        state.plane.deltaNewtonPS = null;

        state.plane.stallHorizonalMS = knotsToMS(43);
        state.plane.stallVerticalAcceleration = feetPerMinToMS(-1000);
        state.plane.stallHorizontalAcceleration = knotsToMS(10);

        state.plane.climbMinHorizontalMS = knotsToMS(55);
        state.plane.climbTerminalVerticalSpeedMS = feetPerMinToMS(1200);
        state.plane.climbTerminalHorizontalSpeedMS = knotsToMS(72);
        state.plane.climbVerticalAccelerationCurve = xMS => -1 * xMS + knotsToMS(72);
        state.plane.climbHorizontalPosAccelerationCurve = xMS => 4;
        state.plane.climbHorizontalNegAccelerationCurve = xMS => -8;

        state.plane.levelFlightMinVelocitiesMS = [
            null, // No level flight for attitude 0
            knotsToMS(52),
            knotsToMS(47),
        ];

        state.plane.terminalHorizonalGlideSpeedsMS = [
            knotsToMS(72),
            knotsToMS(48),
            knotsToMS(41),
        ];
        state.plane.horizontalGlideAccelerationCurves = [
            xMS => knotsToMS(Math.pow(mPSToKnots(xMS), 2) * 0.005),
            xMS => knotsToMS(-1 * Math.pow(mPSToKnots(xMS), 2) * 0.0008),
            xMS => knotsToMS(-1 * Math.pow(mPSToKnots(xMS), 2) * 0.002),
        ];

        state.plane.terminalVerticalGlideSpeedsMS = [
            feetPerMinToMS(-2000),
            feetPerMinToMS(-1000),
            feetPerMinToMS(-550),
        ];

        state.plane.verticalGlideAccelerationCurves = [
            (xMS) => {
                return knotsToMS(-1 * Math.pow(mPSToKnots(xMS), 2) * 0.003);
            },
            (xMS) => {
                return knotsToMS(-1 * Math.pow(mPSToKnots(xMS), 2) * 0.0018);
            },
            (xMS) => {
                const k = mPSToKnots(xMS);
                if(k <= 53) {
                    return knotsToMS(-1 * Math.pow(k, 2) * 0.0006);
                } else {
                    return knotsToMS(-1.5 * k + 77.82);
                }
            },
        ]


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
