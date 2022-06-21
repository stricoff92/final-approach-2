
// FIXME: move some logic into functions.

function getCanvasCornerMapCoords(state) {
    const cornerTopLeftMapCoord = [
        state.plane.posMapCoord[0] - state.camera.canvasHalfW,
        state.plane.posMapCoord[1] + state.camera.canvasHalfH,
    ];
    const cornerTopRightMapCoord = [
        state.plane.posMapCoord[0] + state.camera.canvasHalfW,
        state.plane.posMapCoord[1] + state.camera.canvasHalfH,
    ];
    const cornerBottomLeftMapCoord = [
        state.plane.posMapCoord[0] - state.camera.canvasHalfW,
        state.plane.posMapCoord[1] - state.camera.canvasHalfH,
    ];
    const cornerBottomRightMapCoord = [
        state.plane.posMapCoord[0] + state.camera.canvasHalfW,
        state.plane.posMapCoord[1] - state.camera.canvasHalfH,
    ];
    return [
        cornerTopLeftMapCoord,
        cornerTopRightMapCoord,
        cornerBottomLeftMapCoord,
        cornerBottomRightMapCoord,
    ];
}

function runDisplayLoop() {

    const state = window.readGameState();
    clearCanvas(state);

    drawPageTitle(state);

    if (state.game.phase === PHASE_2_LIVE || state.game.phase === PHASE_3_SCORESCREEN) {
        drawGameScene(state);
        if(state.isDebug) {
            drawDebugData(state);
        }
    }
    else if(state.game.phase === PHASE_1_COUNTDOWN) {
        drawLoadingIcon(state);
    } else if (state.game.phase === PHASE_N1_SHOW_HELP) {
        drawHelp(state);
    }

    if (state.game.phase === PHASE_3_SCORESCREEN) {
        drawScoreScreen(state);
    }

    drawButtons(state);
    drawClickRing(state);
    window.requestAnimationFrame(runDisplayLoop)
}

function clearCanvas(state) {
    state.ctx.clearRect(0, 0, state.camera.canvasW * 2, state.camera.canvasH * 2)
}

function drawClickRing(state) {
    if(state.game.lastClick.frameCreated !== null && state.game.phase === PHASE_2_LIVE) {
        if(state.game.frame > state.game.lastClick.frameCreated + CLICK_RING_MAX_FRAME_AGE) {
            return;
        }
        const percentRemaining = (CLICK_RING_MAX_FRAME_AGE - (state.game.frame - state.game.lastClick.frameCreated)) / CLICK_RING_MAX_FRAME_AGE;
        state.ctx.beginPath();
        state.ctx.strokeStyle = state.game.lastClick.color(Math.max(0.1, 1 * percentRemaining));
        state.ctx.lineWidth = CLICK_RING_WIDTH;
        state.ctx.arc(
            state.game.lastClick.canvasCoord[0],
            state.game.lastClick.canvasCoord[1],
            CLICK_RING_MAX_RADIUS_CANVAS_PX * (1 - percentRemaining),
            0,
            TWO_PI,
        );
        state.ctx.stroke()
    }
}

function drawButtons(state) {
    state.buttons.forEach(btn => {
        if(btn.boxCoord === null) {
            return;
        }
        if(btn.type === BUTTON_TYPE_GRID) {
            const rectArgs = boxCoordToRectArgs(btn.boxCoord);
            state.ctx.beginPath();
            state.ctx.fillStyle = btn.disabled ? "#5e5e5e" : "#000";
            state.ctx.rect(...rectArgs);
            state.ctx.fill();

            state.ctx.beginPath();
            state.ctx.font = btn.disabled ? "20px Arial" : "bold 24px Arial";
            state.ctx.fillStyle = btn.disabled ? "#fff" : "#0f0";
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.fillText(
                btn.text,
                rectArgs[0] + Math.floor(rectArgs[2] / 2),
                rectArgs[1] + Math.floor(rectArgs[3] / 2),
            );
        }
        else if (btn.type === BUTTON_TYPE_MAIN) {
            state.ctx.beginPath();
            state.ctx.fillStyle = "#000"
            state.ctx.rect(...boxCoordToRectArgs(btn.boxCoord));
            state.ctx.fill();

            state.ctx.beginPath();
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.font = "bold 20px Arial";
            state.ctx.fillStyle = "#fff";
            state.ctx.fillText(
                btn.text,
                Math.round((btn.boxCoord[1][0] + btn.boxCoord[0][0]) / 2),
                Math.round((btn.boxCoord[1][1] + btn.boxCoord[0][1]) / 2),
            );
        }
        else {
            throw NOT_IMPLEMENTED
        }
    });
}

function drawPageTitle(state) {
    if(state.pageTitle) {
        state.ctx.beginPath();
        state.ctx.fillStyle = state.pageTitle.color;
        state.ctx.font = "bold 32px Arial";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "center";
        state.ctx.fillText(
            state.pageTitle.text,
            state.camera.canvasHalfW,
            60,
        );
    }
}

function drawLoadingIcon(state) {
    const percent = Math.min(1, (
        state.game.countDownFrames
        / state.game.maxCountDownFrames
    ) * 1.15);
    state.ctx.beginPath();
    state.ctx.strokeStyle = COLOR_PURPLE;
    state.ctx.lineWidth = 18 * percent;
    state.ctx.arc(
        state.camera.canvasHalfW,
        150,
        40,
        0,
        percent * TWO_PI,
    );
    state.ctx.stroke();
}



function drawHelp(state) {
    state.ctx.beginPath();
    state.ctx.fillStyle = "#f00";
    state.ctx.font = "bold 28px Arial";
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "center";
    const titleOffset = 15;
    state.ctx.fillText(
        "Land the Plane",
        state.camera.canvasHalfW, titleOffset
    );
    state.ctx.beginPath();
    const imgSide = Math.min(state.camera.canvasH * 0.8, state.camera.canvasW);
    const tlcX = (state.camera.canvasW - imgSide) / 2;
    state.ctx.drawImage(state.helpImg, tlcX, titleOffset + 16, imgSide, imgSide);

    state.ctx.beginPath()
    state.ctx.font = "24px Arial";
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "top";
    state.ctx.fillText(
        "Tap to continue",
        state.camera.canvasHalfW,
        titleOffset + 20 + imgSide + 6
    );
}

function drawGameScene(state) {
    const nowTS = performance.now();
    const plane = state.plane;
    const planeMapDims = plane.dimensions[plane.flare];
    const mupm = state.map.mapUnitsPerMeter;

    const [
        scTopLeftMapCoord,
        scTopRightMapCoord,
        scBottomLeftMapCoord,
        scBottomRightMapCoord,
    ] = getCanvasCornerMapCoords(state);

    _drawHorizonAndCloudsLayer(state);

    // Draw runway
    const cameraMapCoordXMin = scTopLeftMapCoord[0];
    const cameraMapCoordXMax = scTopRightMapCoord[0];
    const rwLength = state.map.rwP1MapCoord[0] - state.map.rwP0MapCoord[0];
    const rwViewBuffer = rwLength * 3;
    const runwayVisible = Boolean((
        state.map.rwP0MapCoord[0] >= (cameraMapCoordXMin - rwViewBuffer)
        && state.map.rwP0MapCoord[0] <= (cameraMapCoordXMax + rwViewBuffer)
    ) || (
        state.map.rwP1MapCoord[0] >= (cameraMapCoordXMin - rwViewBuffer)
        && state.map.rwP1MapCoord[0] <= (cameraMapCoordXMax + rwViewBuffer)
    ) || (
        state.map.rwP0MapCoord[0] <= (cameraMapCoordXMin + rwViewBuffer)
        && state.map.rwP1MapCoord[0] >= (cameraMapCoordXMax - rwViewBuffer)
    ));
    if(runwayVisible) {
        if(state.map.rwType === RUNWAY_TYPE_CARRIER) {
            _drawCarrierRunway(state, nowTS);
        } else {
            _drawRunway(state, nowTS, cameraMapCoordXMax);
        }
    }

    // Draw Glide Slope
    if(Math.random() < 0.9) {
        const gsLineWidth = getRandomFloat(0.3, 2.4);
        let gsColor
        if(state.game.level > 7 && plane.posMapCoord[1] < state.map.cloudLayer.bottomY) {
            gsColor = `rgb(250, 204, 252, ${ getRandomFloat(0.2, 0.8) })`;
        } else {
            gsColor = `rgb(242, 0, 255, ${ getRandomFloat(0.2, 0.8) })`;
        }
        state.map.glideSlopes.forEach(gs => {
            const gsCanvasP0 = mapCoordToCanvasCoord(
                gs.p0, plane.posMapCoord, state.camera
            );
            const gsCanvasP1 = mapCoordToCanvasCoord(
                gs.p1, plane.posMapCoord, state.camera
            );
            state.ctx.beginPath();
            state.ctx.strokeStyle = gsColor;
            state.ctx.lineWidth = gsLineWidth * (gs.bold ? 3.5 : 1);
            state.ctx.moveTo(...gsCanvasP0);
            state.ctx.lineTo(...gsCanvasP1);
            state.ctx.stroke();
        });
    }

    let planeCanvasX1, planeCanvasY1;
    if(!plane.crashFrame) {

        // Draw Plane Shadow
        const planeCanvasDims = planeMapDims.map(d => d * state.map.mapUnitsPerMeter);
        let shadowCenterMapCoord;
        if(
            state.map.rwType === RUNWAY_TYPE_CARRIER
            && state.plane.posMapCoord[0] >= state.map.carrierMinMapX
            && state.plane.posMapCoord[0] <= state.map.carrierMaxMapX
        ) {
            const rwAlt = state.map.rwP0MapCoord[1];
            shadowCenterMapCoord = [
                plane.posMapCoord[0] + ((state.plane.posMapCoord[1] - rwAlt)  * 0.4),
                (plane.posMapCoord[1] - rwAlt) * -0.2 + rwAlt,
            ];
        } else {
            shadowCenterMapCoord = [
                plane.posMapCoord[0] + state.plane.posMapCoord[1] * 0.4,
                plane.posMapCoord[1] * -0.2,
            ];
        }
        const shadowCenterCanvasCoord = mapCoordToCanvasCoord(
            shadowCenterMapCoord, plane.posMapCoord, state.camera
        );
        const shadowCanvasDims = planeCanvasDims.map((d, ix) => d / (ix + 1));
        state.ctx.beginPath();
        state.ctx.fillStyle = `rgb(0, 0, 0, 0.27)`;
        state.ctx.rect(
            shadowCenterCanvasCoord[0] - shadowCanvasDims[0] / 2,
            shadowCenterCanvasCoord[1] - shadowCanvasDims[1] / 2,
            ...shadowCanvasDims
        );
        state.ctx.fill();

        let shakeLifespanTSMS = 450;
        let shakeLifespanAAFMS = 900;
        const tireStrikeLen = state.map.tireStrikes.length;
        const aaFireLlen = state.map.aaFire.length;
        const lastTireStrike = tireStrikeLen > 0 ? state.map.tireStrikes[tireStrikeLen - 1] : null;
        const lastAAFire = aaFireLlen > 0 ? state.map.aaFire[aaFireLlen - 1] : null;
        const isAAFire = Boolean(lastAAFire !== null && lastAAFire.createdTS + shakeLifespanAAFMS >= nowTS);
        const isTireStrike = Boolean(!isAAFire && lastTireStrike !== null && lastTireStrike.createdTS + shakeLifespanTSMS >= nowTS);
        const showVisualSkake = isTireStrike || isAAFire;
        let xAmnt = 0, yAmnt = 0;
        if(showVisualSkake) {
            if(isTireStrike) {
                xAmnt = (showVisualSkake ? getRandomFloat(-1 * lastTireStrike.shakeMeters, lastTireStrike.shakeMeters) * state.map.mapUnitsPerMeter : 0);
                yAmnt = (showVisualSkake ? getRandomFloat(-1 * lastTireStrike.shakeMeters, lastTireStrike.shakeMeters) * state.map.mapUnitsPerMeter : 0);
            } else if(isAAFire) {
                const mult = isAAFire.fatal ? 1.6 : 1;
                xAmnt = getRandomFloat(-0.925 * mult, 0.925 * mult) * mupm;
                yAmnt = getRandomFloat(-0.925 * mult, 0.925 * mult) * mupm;
            } else {
                throw NOT_IMPLEMENTED;
            }
        }

        // Draw plane
        planeCanvasX1 = state.camera.canvasHalfW - (planeCanvasDims[0] / 2);
        planeCanvasY1 = state.camera.canvasHalfH - (planeCanvasDims[1] / 2);
        state.ctx.beginPath();
        state.ctx.drawImage(
            plane.assets[plane.flare],
            planeCanvasX1 + xAmnt,
            planeCanvasY1 + yAmnt,
            planeCanvasDims[0],
            planeCanvasDims[1],
        );
    }
    else {
        _drawCrashingEffect(state);
    }

    _drawCloudEffects(
        state,
        scBottomLeftMapCoord[1],
        scTopLeftMapCoord[1],
        scTopLeftMapCoord[0],
        scTopRightMapCoord[0],
    );

    if(!state.plane.crashFrame) {
        state.plane.previousAflamePoints.forEach((pfp, ix) => {
            const raPercent = 1 - ((ix + 1) / AFLAME_NODES_COUNT);
            const r = MIN_AFLAME_RADIUS_M * mupm + ((MAX_AFLAME_RADIUS_M - MIN_AFLAME_RADIUS_M) * raPercent * mupm);
            const a = 0.3 * raPercent;
            const flameP = mapCoordToCanvasCoord(
                pfp,
                state.plane.posMapCoord,
                state.camera,
            );
            // Smoke effect
            state.ctx.beginPath();
            state.ctx.fillStyle = `rgb(0, 0, 0, ${ getRandomFloat(0.01, 0.1) })`;
            state.ctx.arc(
                flameP[0] + getRandomFloat(0.75, 2) * mupm,
                flameP[1] + getRandomFloat(0.75, 2) * mupm,
                r * getRandomFloat(0.3, 0.65), 0, TWO_PI,
            );
            // Flame effect
            state.ctx.fill();
            state.ctx.beginPath();
            state.ctx.fillStyle = `rgb(255, ${150*(1-raPercent)}, ${150*(1-raPercent)}, ${ a * getRandomFloat(0.9, 1.1) })`;
            state.ctx.arc(
                flameP[0], flameP[1],
                r * getRandomFloat(0.85, 1.15), 0, TWO_PI,
            );
            state.ctx.fill();
        });
    }

    _drawAAFireEffects(state);


    // Draw altitude indicator if over min altutude
    const runwayAltitudeM = state.map.rwP0MapCoord[1] / state.map.mapUnitsPerMeter;
    const planeBottomAltitudeM = (
        state.plane.posMapCoord[1]
        - (
            state.plane.dimensions[state.plane.flare][1] / 2
            * state.map.mapUnitsPerMeter
        )
    ) / state.map.mapUnitsPerMeter;
    if(plane.alive && planeBottomAltitudeM > (runwayAltitudeM + 5)) {
        // Altitude Text
        const showSafeAltitude = Boolean(
            state.game.level === 7
            && planeBottomAltitudeM > LEVEL_7_MAX_SAFE_X_M
            && state.plane.posMapCoord[0] > 1000 * mupm
        );
        let altitudeLabel, altitudeValueM;
        if(showSafeAltitude) {
            altitudeLabel = "Safe Altitude";
            altitudeValueM = `${Math.round(planeBottomAltitudeM - LEVEL_7_MAX_SAFE_X_M)} M`;
        }
        else if(state.game.level > 7) {
            altitudeLabel = null;
            altitudeValueM = null;
        } else {
            altitudeLabel = "ground";
            altitudeValueM = `${planeBottomAltitudeM.toFixed(0)} M`;
        }
        const altText1P = [
            state.camera.canvasHalfW,
            state.camera.canvasHalfH + state.plane.dimensions[0][1] * mupm
        ];
        if(altitudeLabel !== null) {
            const isDarkBackground = Boolean(state.game.level > 7 && plane.posMapCoord[1] < state.map.cloudLayer.bottomY);
            state.ctx.beginPath();
            state.ctx.fillStyle = isDarkBackground ? "#fff" : "#000";
            state.ctx.font = "20px Arial";
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "left";
            state.ctx.fillText(altitudeLabel, ...altText1P);
            const altText2P = [
                altText1P[0],
                altText1P[1] + 25,
            ];
            state.ctx.beginPath();
            state.ctx.font = "bold 25px Arial";
            state.ctx.fillText(altitudeValueM, ...altText2P);
            // Altitude Arrow
            const altLineP1 = [
                altText1P[0] - 5,
                altText1P[1] - 7,
            ];
            const altLineP2 = [
                altText2P[0] - 5,
                state.camera.canvasH * 0.9,
            ];
            state.ctx.beginPath();
            state.ctx.strokeStyle = isDarkBackground ? "#fff" : "#000";
            state.ctx.lineWidth = 1;
            state.ctx.moveTo(...altLineP1);
            state.ctx.lineTo(...altLineP2);
            state.ctx.stroke();
            const altArrowHeadLen = 15
            state.ctx.beginPath();
            state.ctx.moveTo(...altLineP2);
            state.ctx.lineTo(altLineP2[0] - altArrowHeadLen/2, altLineP2[1] - altArrowHeadLen);
            state.ctx.stroke();
            state.ctx.beginPath();
            state.ctx.moveTo(...altLineP2);
            state.ctx.lineTo(altLineP2[0] + altArrowHeadLen/2, altLineP2[1] - altArrowHeadLen);
            state.ctx.stroke();
        }
    }

    drawHorizontalDistanceArrow(state);

    // Draw Previous Points
    if(!plane.touchedDown && !plane.crashFrame) {
        for(let i = 0; i < plane.previousPoints.length; i++) {
            let mapCoord = plane.previousPoints[i];

            let canvasCoord = mapCoordToCanvasCoord(
                mapCoord, plane.posMapCoord, state.camera
            );
            state.ctx.beginPath();
            state.ctx.fillStyle = "#a6a6a6";
            state.ctx.arc(
                canvasCoord[0], canvasCoord[1],
                5,
                0, TWO_PI,
            );
            state.ctx.fill();
        }
    }

    if(
        plane.fuelRemaining !== null
        && !plane.touchedDown
        && plane.alive
    ) {
        _drawFuelIndicator(state, nowTS);
    }

    if(nowTS > (state.game.gameStartTS + LEVEL_NAME_TOTAL_DURATION)) {
        if(plane.alive && !plane.touchedDown) {
            _drawWindIndicator(state);
            if(state.game.level > 7 && plane.posMapCoord[1] < state.map.cloudLayer.bottomY) {
                _drawcarrierLandingHUD(state, nowTS);
            }
        }
    } else {
        _drawLevelName(state, nowTS);
    }
}

function _drawcarrierLandingHUD(state, nowTS) {
    const plane = state.plane;
    const mupm = state.map.mapUnitsPerMeter;
    // Canvas Coords
    const hudX1 = state.camera.canvasHalfW + plane.dimensions[0][0] / 2 * mupm + 3;
    const hudX2 = Math.min(hudX1 + 160, state.camera.canvasW - 3);
    const hudY2 = state.camera.canvasH / 4;
    const hudY1 = state.camera.canvasH * 0.75;
    const hudXMid = (hudX2 + hudX1) / 2;
    const hudW = hudX2 - hudX1;

    state.ctx.beginPath();
    state.ctx.strokeStyle = COLOR_HUD_LIGHT_GREEN_A;
    state.ctx.lineWidth = 2;
    state.ctx.moveTo(hudX1, hudY1);
    state.ctx.lineTo(hudX1, hudY2);
    state.ctx.stroke();
    state.ctx.beginPath();
    state.ctx.strokeStyle = COLOR_HUD_LIGHT_GREEN_A;
    state.ctx.lineWidth = 2;
    state.ctx.moveTo(hudX2, hudY1);
    state.ctx.lineTo(hudX2, hudY2);
    state.ctx.stroke();
    state.ctx.beginPath();
    state.ctx.font = "20px Courier New";
    state.ctx.textBaseline = "bottom";
    state.ctx.textAlign = "center";
    state.ctx.fillStyle = COLOR_HUD_LIGHT_GREEN;
    if(nowTS % 3000 > 1500) {
        state.ctx.fillText("FNL APPRCH 2", hudXMid, hudY2);
    }
    const bottomBuffer = 25;
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_HUD_LIGHT_GREEN_A;
    state.ctx.rect(
        hudX1,
        hudY1 - bottomBuffer,
        hudX2 - hudX1,
        bottomBuffer
    );
    state.ctx.fill();
    const distanceToDeckM = (
        (plane.posMapCoord[1] - plane.dimensions[plane.flare][1] / 2 * mupm)
        - state.map.rwP0MapCoord[1]
    ) / mupm;
    state.ctx.beginPath();
    state.ctx.fillStyle = distanceToDeckM > 0 ?"#000":"#f00";
    state.ctx.font = "20px Courier New";
    state.ctx.textBaseline = "bottom";
    state.ctx.textAlign = "left";
    state.ctx.fillText("DECK", hudX1, hudY1);
    state.ctx.font = "bold 28px Courier New";
    state.ctx.textAlign = "right";
    state.ctx.textBaseline = "top";
    state.ctx.fillStyle = COLOR_HUD_LIGHT_GREEN;
    state.ctx.fillText(
        `${ Math.round(distanceToDeckM) } M`,
        hudX1 - 5,
        hudY2);

    // Distance to deck bar
    const barMaxAltM = 40;
    if(distanceToDeckM <= barMaxAltM) {
        const barW = hudW / 3;
        const fullBarYLen = (hudY1 - bottomBuffer) - hudY2;
        const percentFilled = 1 - (Math.max(0, distanceToDeckM) / barMaxAltM);
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_HUD_LIGHT_GREEN_A;
        state.ctx.rect(
            hudX1,
            hudY2,
            barW,
            fullBarYLen * percentFilled,
        );
        state.ctx.fill();
    }

    const glideSlopeIndicatorMinAltM = 40
    if(distanceToDeckM > glideSlopeIndicatorMinAltM) {
        // Relative Glide Slope indicator
        state.ctx.beginPath();
        state.ctx.fillStyle = "#000";
        state.ctx.font = "20px Courier New";
        state.ctx.textBaseline = "bottom";
        state.ctx.textAlign = "right";
        state.ctx.fillText("G/S", hudX2, hudY1);

        const gsY = getGlideSlopeY(state.map.glideSlopes, plane.posMapCoord[0]);
        if(typeof gsY !== "undefined") {
            // (+) means above GS, (-) means below GS
            const gsDiffM = (plane.posMapCoord[1] - gsY) / mupm;
            const gsIndicatorHalfRangeM = 40;
            let percentFromBottom;
            if(gsDiffM >= gsIndicatorHalfRangeM) {
                // Above GS, needle at bottom of HUD
                percentFromBottom = 0;
            }
            else if(gsDiffM <= (-1 * gsIndicatorHalfRangeM)) {
                // Below GS, needle at top of HUD
                percentFromBottom = 1
            }
            else {
                if(gsDiffM >= 0) {
                    // means above GS, needle between 0% and 50% from bottom
                    percentFromBottom = 0.5 - gsDiffM / gsIndicatorHalfRangeM / 2;
                }
                else {
                    // needle between 50% and 100%
                    percentFromBottom = 0.5 + Math.abs(gsDiffM) / gsIndicatorHalfRangeM / 2;
                }
            }
            state.ctx.beginPath();
            state.ctx.strokeStyle = COLOR_HUD_LIGHT_GREEN;
            state.ctx.lineWidth = 8;
            state.ctx.setLineDash([5, 5]);
            const gsiCenterX = ((hudY1 - bottomBuffer) + hudY2) / 2;
            state.ctx.moveTo(hudX2, gsiCenterX);
            state.ctx.lineTo(hudXMid, gsiCenterX);
            state.ctx.stroke();
            state.ctx.setLineDash([]);
            const totalPXSpaceGSI = (hudY1 - bottomBuffer) - hudY2;
            const gsIY = (hudY1 - bottomBuffer) - (totalPXSpaceGSI * percentFromBottom)
            state.ctx.beginPath();
            state.ctx.strokeStyle = COLOR_HUD_LIGHT_GREEN;
            state.ctx.lineWidth = 2;
            state.ctx.moveTo(hudX2, gsIY);
            state.ctx.lineTo(hudXMid, gsIY);
            state.ctx.stroke();
        }
    }
    else {
        // Touchdown location estimator
        state.ctx.beginPath();
        state.ctx.fillStyle = "#000";
        state.ctx.font = "20px Courier New";
        state.ctx.textBaseline = "bottom";
        state.ctx.textAlign = "right";
        state.ctx.fillText("RNWY", hudX2, hudY1);

        const tdlYBuff = 20;
        const tdlX1 = hudX1 + (hudW / 2) + (hudW / 8);
        const tdlX2 = hudX2 - hudW / 8;
        const tldY1 = hudY1 - bottomBuffer - tdlYBuff;
        const tldY2 = hudY2 + tdlYBuff;
        state.ctx.beginPath()
        state.ctx.lineWidth = 2;
        state.ctx.strokeStyle = COLOR_HUD_LIGHT_GREEN;
        state.ctx.rect(
            tdlX1, tldY2,
            tdlX2 - tdlX1,
            tldY1 - tldY2,
        );
        state.ctx.stroke();

        const yDistanceToDeckM = distanceToDeckM;
        const secondsAloft = plane.verticalMS != 0 ? yDistanceToDeckM / Math.abs(plane.verticalMS) : 1000;
        const xMapUnitsCanTravel = secondsAloft * plane.horizontalMS * mupm;
        const estimatedX = plane.posMapCoord[0] + xMapUnitsCanTravel;
        let crossHairP, chColor = COLOR_HUD_LIGHT_GREEN;
        if(estimatedX > state.map.carrierRWArrestingGearBounds.xEnd) {
            crossHairP = [
                (tdlX1 + tdlX2) / 2,
                tldY2 - tdlYBuff / 2];
            chColor = "#f00";
        }
        else if(estimatedX < state.map.carrierRWArrestingGearBounds.xStart) {
            crossHairP = [
                (tdlX1 + tdlX2) / 2,
                tldY1 + tdlYBuff / 2];
                chColor = "#ff0";
        }
        else {
            let targetSize = state.map.carrierRWArrestingGearBounds.xEnd - state.map.carrierRWArrestingGearBounds.xStart;
            let gaugeDistance = tldY1 - tldY2;
            let percentFilled = (estimatedX - state.map.carrierRWArrestingGearBounds.xStart) / targetSize;
            crossHairP = [
                (tdlX1 + tdlX2) / 2,
                tldY1 - gaugeDistance * percentFilled];
        }
        if(crossHairP) {
            state.ctx.beginPath();
            state.ctx.strokeStyle = chColor;
            state.ctx.lineWidth = 4;
            state.ctx.arc(crossHairP[0], crossHairP[1], tdlYBuff / 3, 0, TWO_PI);
            state.ctx.stroke();
            state.ctx.beginPath();
            state.ctx.lineWidth = 2;
            state.ctx.moveTo(crossHairP[0], crossHairP[1] - tdlYBuff / 2);
            state.ctx.lineTo(crossHairP[0], crossHairP[1] + tdlYBuff / 2);
            state.ctx.stroke();
            state.ctx.beginPath();
            state.ctx.moveTo(crossHairP[0] - tdlYBuff / 2, crossHairP[1]);
            state.ctx.lineTo(crossHairP[0] + tdlYBuff / 2, crossHairP[1]);
            state.ctx.stroke();
        }
    }
}

function _drawFuelIndicator(state, nowTS) {
    const plane = state.plane;
    const mupm = state.map.mapUnitsPerMeter;
    const indicatorCenterX = state.camera.canvasHalfW + (plane.dimensions[0][0] / 2 * mupm);
    const indicatorY2 = state.camera.canvasHalfH - (plane.dimensions[0][1] / 2 * mupm) - 5;
    const anyLeft = plane.fuelRemaining > 0;

    state.ctx.beginPath();
    state.ctx.fillStyle = "#f00";
    state.ctx.font = "bold 20px Courier New";
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "left";
    state.ctx.fillText(anyLeft?"FUEL":"⚠️ NO FUEL", indicatorCenterX, indicatorY2);

    if(anyLeft) {
        // Outer bar
        const barX1 = indicatorCenterX + 5;
        const percent = plane.fuelRemaining / plane.startingFuel;
        const barLen = Math.min(plane.startingFuel<6?80:130, state.camera.canvasHalfH / 1.6);
        const barY1 = indicatorY2 - barLen;
        const barW = 16;
        state.ctx.beginPath();
        state.ctx.fillStyle = "#f00";
        state.ctx.rect(barX1, barY1 + barLen * (1 - percent), barW, barLen * percent);
        state.ctx.fill();
        state.ctx.beginPath();
        state.ctx.strokeStyle = "#fff";
        state.ctx.lineWidth = 2;
        state.ctx.rect(barX1, barY1, barW, barLen);
        state.ctx.stroke();

        // Tick marks
        const yInt = Math.round(barLen / plane.startingFuel);
        for(let i=1; i<plane.startingFuel; i++) {
            state.ctx.beginPath();
            state.ctx.strokeStyle = "#fff";
            state.ctx.lineWidth = 2;
            state.ctx.moveTo(
                barX1,
                barY1 + yInt * i
            );
            state.ctx.lineTo(
                barX1 + barW,
                barY1 + yInt * i
            );
            state.ctx.stroke();
        }

        const animationLenMS = 700;
        if(state.plane.fuelUsedLastTS && state.plane.fuelUsedLastTS + animationLenMS >= nowTS) {
            // fuel used animation
            const percent = (nowTS - state.plane.fuelUsedLastTS) / animationLenMS
            const alpha = 1 - percent;
            const radiusPx = 80 * percent;
            state.ctx.beginPath();
            state.ctx.fillStyle = `rgb(255, 0, 0, ${ alpha })`;
            state.ctx.arc(
                barX1 + barW / 2,
                barY1 + barLen * (1 - percent),
                radiusPx,
                0, TWO_PI,
            );
            state.ctx.fill();
        }
    }
}


function _drawHorizonAndCloudsLayer(state) {
    const mupm = state.map.mapUnitsPerMeter
    const cl = state.map.cloudLayer;
    const planeYPos = state.plane.posMapCoord[1];

    const cloudsBelow = cl.topY < planeYPos;
    const cloudsAbove = cl.bottomY > planeYPos;

    const gradientSize = CLOUD_GRADIENT_SIZE_M * mupm;
    const toCloudsGradientStart = cl.topY + gradientSize;
    const fromCloudsGradientEnd = cl.bottomY - gradientSize;

    if(cloudsBelow) {
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_SKY;
        state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
        state.ctx.fill();

        state.ctx.beginPath();
        const imgSideLen = Math.min(
            state.camera.canvasHalfW * 0.6,
            state.camera.canvasHalfH * 0.6,
        )
        state.ctx.drawImage(
            state.map.sunImg,
            5, 5,
            imgSideLen,
            imgSideLen,
        );

        if(planeYPos < toCloudsGradientStart) {
            const percentGray = (toCloudsGradientStart - planeYPos) / gradientSize;
            state.ctx.beginPath();
            state.ctx.fillStyle = COLOR_CLOUD_LAYER(percentGray);
            state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
            state.ctx.fill();
        }
    }
    else if (cloudsAbove) {
        state.ctx.beginPath();
        if(state.map.terrain === TERRAIN_FOREST) {
            state.ctx.fillStyle = COLOR_GROUND_FOREST;
        } else if(state.map.terrain === TERRAIN_DESERT) {
            state.ctx.fillStyle = COLOR_GROUD_DESERT;
        } else if (state.map.terrain === TERRAIN_OCEAN) {
            state.ctx.fillStyle = COLOR_SURFACE_OCEAN;
        } else { throw NOT_IMPLEMENTED; }
        state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
        state.ctx.fill();

        if(planeYPos > fromCloudsGradientEnd) {
            const percentGray = (planeYPos - fromCloudsGradientEnd) / gradientSize;
            state.ctx.beginPath();
            state.ctx.fillStyle = COLOR_CLOUD_LAYER(percentGray);
            state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
            state.ctx.fill();
        }
    }
    else {
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_CLOUD_LAYER(1);
        state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
        state.ctx.fill();
    }
}

function _drawCrashingEffect(state) {
    const mupm = state.map.mapUnitsPerMeter;

    const markCanvasCoord = mapCoordToCanvasCoord(
        [
            state.plane.posMapCoord[0],
            state.plane.posMapCoord[1] - state.plane.dimensions[0][1] / 2 * mupm,
        ],
        state.plane.posMapCoord,
        state.camera,
    );
    state.ctx.beginPath();
    state.ctx.fillStyle = "rgb(0, 0, 0, 0.7)";
    state.ctx.ellipse(
        markCanvasCoord[0], markCanvasCoord[1],
        2.5 * mupm, 0.4 * mupm,
        0,
        0, TWO_PI,
    );
    state.ctx.fill();

    if(state.plane.crashFrame <= CRASH_EFFECT_1_MAX_FRAME) {
        let bottomAlpha = 0.5;
        let phase1PercentComplete = state.plane.crashFrame / CRASH_EFFECT_1_MAX_FRAME;
        let phase1Alpha = bottomAlpha + 0.5 * (1 - phase1PercentComplete);
        const expMapX = state.plane.posMapCoord[0] + getRandomFloat(-2, 2) * mupm;
        const expMapY = state.plane.posMapCoord[1] + getRandomFloat(-0.5, 2.5) * mupm;
        const expCanvasCoord = mapCoordToCanvasCoord(
            [expMapX, expMapY], state.plane.posMapCoord, state.camera,
        );
        const expRadius = getRandomFloat(4, 6) * mupm;

        state.ctx.beginPath();
        state.ctx.fillStyle = `rgb(99, 92, 85, ${ phase1Alpha.toFixed(2) })`;
        state.ctx.ellipse(
            expCanvasCoord[0], expCanvasCoord[1],
            expRadius * getRandomFloat(0.8, 1.3),
            expRadius * getRandomFloat(0.8, 1.3),
            0,
            0, TWO_PI,);
        state.ctx.fill();
    }
    else if (state.plane.crashFrame <= CRASH_EFFECT_2_MAX_FRAME) {
        const percentComplete = (
            state.plane.crashFrame - CRASH_EFFECT_1_MAX_FRAME
        ) / (CRASH_EFFECT_2_MAX_FRAME - CRASH_EFFECT_1_MAX_FRAME);
        const radius = (4 + 7 * percentComplete) * mupm;
        const yRise = 4 * percentComplete * mupm;
        const alpha = 0.5 * (1 - percentComplete);
        const hazeCanvasCoord = mapCoordToCanvasCoord(
            [state.plane.posMapCoord[0], state.plane.posMapCoord[1] + yRise],
            state.plane.posMapCoord,
            state.camera,
        );
        state.ctx.beginPath();
        state.ctx.fillStyle = `rgb(99, 92, 85, ${ alpha.toFixed(2) })`;
        state.ctx.arc(
            hazeCanvasCoord[0],
            hazeCanvasCoord[1],
            radius,
            0, TWO_PI,
        );
        state.ctx.fill();
    }

    window._debrisObjects.forEach(debris => {
        let doCanvasCoord = mapCoordToCanvasCoord(
            debris.mapCoords, state.plane.posMapCoord, state.camera,
        );
        state.ctx.beginPath()
        state.ctx.fillStyle = "#000";
        state.ctx.arc(
            doCanvasCoord[0], doCanvasCoord[1],
            debris.radius,
            0, TWO_PI,
        );
        state.ctx.fill();
    });
}

function _drawLevelName(state, nowTS) {
    const elapsedTime = nowTS - state.game.gameStartTS;
    const alpha = (elapsedTime < LEVEL_NAME_DISPLAY_DURATION_MS
        ? 1
        : 1 - ((elapsedTime - LEVEL_NAME_DISPLAY_DURATION_MS) / LEVEL_NAME_DISPLAY_FADEOUT_MS));
    state.ctx.beginPath()
    state.ctx.fillStyle = `rgb(0, 0, 0, ${ alpha } )`;
    state.ctx.textBaseline = "bottom";
    state.ctx.textAlign = "center";
    state.ctx.font = "italic bold 32px Garamond";
    state.ctx.fillText(
        "\"" + state.game.levelName + "\"",
        state.camera.canvasHalfW,
        state.camera.canvasH / 5
    );
}

function _drawWindIndicator(state) {
    if(state.map.windMaxDeltaPerSecond === null) {
        return;
    }
    const windArrowY1 = state.camera.canvasH / 4;
    const windLabelY1 = windArrowY1 - 5;
    state.ctx.beginPath();
    state.ctx.textBaseline = "bottom";
    state.ctx.textAlign = "center";
    state.ctx.fillStyle = COLOR_PURPLE;
    state.ctx.font = "bold 28px Courier New";
    state.ctx.fillText("WIND", state.camera.canvasHalfW, windLabelY1);
    if(Math.abs(state.map.windXVel) < 0.1) {
        return;
    }
    const arrowMaxLenth = state.camera.canvasHalfW * 0.85;
    const arrowHeight = 14;
    const arrowHeadPointY = windArrowY1 + arrowHeight / 2;
    const arrowHeadTopY = windArrowY1 - 7;
    const arrowHeadBottomY = windArrowY1 + arrowHeight + 7;
    const headBuff = 3;
    if(state.map.windXVel > 0) {
        // Head wind, forward arrow.
        const arrowLength = arrowMaxLenth * (state.map.windXVel / WIND_MAX_MAGNITUDE_MS);
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_PURPLE;
        state.ctx.rect(
            state.camera.canvasHalfW, windArrowY1,
            arrowLength, arrowHeight,
        );
        state.ctx.fill();
        // Arrow head
        const arrowHeadPointX = state.camera.canvasHalfW + arrowLength + 12;
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_PURPLE;
        state.ctx.moveTo(
            state.camera.canvasHalfW + (arrowLength - headBuff),
            arrowHeadTopY,
        );
        state.ctx.lineTo(
            state.camera.canvasHalfW + (arrowLength - headBuff),
            arrowHeadBottomY,
        );
        state.ctx.lineTo(
            arrowHeadPointX,
            arrowHeadPointY,
        );
        state.ctx.fill();
    }
    else {
        // Tail wind, backwards arrow.
        const arrowLength = arrowMaxLenth * (-1 * state.map.windXVel / WIND_MAX_MAGNITUDE_MS);
        const arrowX1 = state.camera.canvasHalfW - arrowLength;
        state.ctx.beginPath()
        state.ctx.fillStyle = COLOR_PURPLE;
        state.ctx.rect(
            arrowX1, windArrowY1,
            arrowLength, arrowHeight,
        );
        state.ctx.fill();
        // Arrow head
        const arrowHeadPointX = state.camera.canvasHalfW - (arrowLength + 12);
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_PURPLE;
        state.ctx.moveTo(
            state.camera.canvasHalfW - (arrowLength - headBuff),
            arrowHeadTopY,
        );
        state.ctx.lineTo(
            state.camera.canvasHalfW - (arrowLength - headBuff),
            arrowHeadBottomY,
        );
        state.ctx.lineTo(
            arrowHeadPointX,
            arrowHeadPointY,
        )
        state.ctx.fill();
    }
}

function _drawAAFireEffects(state) {
    const nowTS = performance.now();
    const mupm = state.map.mapUnitsPerMeter;
    state.map.aaFire.forEach(aaf => {
        const ageFrame = state.game.frame - aaf.createdFrame;
        if(ageFrame < 6) {
            let r, a, w;
            if (ageFrame === 0) {
                r = 1.5 * mupm;
                a = 0.9;
                w = 2
            } else if (ageFrame === 1) {
                r = 3 * mupm;
                a = 0.7;
                w = 1.7;
            } else if (ageFrame === 2) {
                r = 4.25 * mupm;
                a = 0.7;
                w = 1.5;
            } else if (ageFrame === 3) {
                r = 5.5 * mupm;
                a = 0.5;
                w = 1.2;
            } else if (ageFrame === 4) {
                r = 7 * mupm;
                a = 0.4;
                w = 1;
            } else if (ageFrame === 5) {
                r = 7.5 * mupm;
                a = 0.3;
                w = 1;
            } else { throw NOT_IMPLEMENTED; }

            if(ageFrame < 2) {
                state.ctx.beginPath();
                state.ctx.strokeStyle = "#000";
                state.ctx.lineWidth = w;
                const lineCanvasP0 = mapCoordToCanvasCoord(
                    aaf.p0, state.plane.posMapCoord, state.camera
                );
                const lineCanvasP1 = mapCoordToCanvasCoord(
                    aaf.p1, state.plane.posMapCoord, state.camera
                );
                state.ctx.moveTo(...lineCanvasP0);
                state.ctx.lineTo(...lineCanvasP1);
                state.ctx.stroke();
            }

            const expP = mapCoordToCanvasCoord(
                aaf.p1, state.plane.posMapCoord, state.camera
            );
            state.ctx.beginPath();
            state.ctx.fillStyle = AA_EXPLOSION_COLOR(a);
            state.ctx.arc(
                expP[0], expP[1],
                r,
                0, TWO_PI,
            );
            state.ctx.fill();
            state.ctx.beginPath();
            state.ctx.fillStyle = `rgb(255, 0, 0, ${a/1.2})`;
            state.ctx.arc(
                expP[0] + getRandomFloat(-2, 2) * mupm,
                expP[1] + getRandomFloat(-2, 2) * mupm,
                r / getRandomFloat(1, 3),
                0, TWO_PI,
            );
            state.ctx.fill();
        }
        else if (nowTS < aaf.createdTS + AA_FIRE_TOTAL_DURATION) {
            const expP = mapCoordToCanvasCoord(
                aaf.p1, state.plane.posMapCoord, state.camera
            );
            state.ctx.beginPath();
            state.ctx.fillStyle = AA_EXPLOSION_COLOR(0.3);
            state.ctx.arc(
                expP[0], expP[1],
                7.5 * mupm,
                0, TWO_PI,
            );
            state.ctx.fill();
        }
    });
}

function _drawCloudEffects(
    state,
    canvasMinMapCoordY,
    canvasMaxMapCoordY,
    _canvasMinMapCoordX,
    canvasMaxMapCoordX,
) {
    if(window._fa2_isPaused) {
        return;
    }

    const cl = state.map.cloudLayer;
    const planeYPos = state.plane.posMapCoord[1];
    const mupm = state.map.mapUnitsPerMeter;

    if(state.game.frame % 12 === 0 && (canvasMinMapCoordY <= cl.topY && canvasMaxMapCoordY >= cl.bottomY)) {
        const newCloudRadius = getRandomFloat(5 * mupm, 18 * mupm);
        const newCloudPosY = getRandomFloat(
            canvasMinMapCoordY - newCloudRadius * 0.7,
            canvasMaxMapCoordY + newCloudRadius * 0.7,
        );
        const newCloudPosX = canvasMaxMapCoordX + newCloudRadius;
        window._cloudEffects.push(deepCopy({
            mapCoord: [newCloudPosX, newCloudPosY],
            radiusX: newCloudRadius * getRandomFloat(1, 1.5),
            radiusY: newCloudRadius * getRandomFloat(0.6, 1),
        }));
    }

    const ixToRemove = state.game.frame % 60 === 0 ? [] : null;
    for(let i in window._cloudEffects) {
        let ce = window._cloudEffects[i];
        let ceCanvasCoord = mapCoordToCanvasCoord(
            ce.mapCoord, state.plane.posMapCoord, state.camera,
        );
        if(ixToRemove && (ceCanvasCoord + ce.radiusX) < 0) {
            ixToRemove.push(i);
        }
        else {
            state.ctx.beginPath();
            state.ctx.fillStyle = "rgb(200, 200, 200, 0.25)";
            state.ctx.ellipse(
                ceCanvasCoord[0], ceCanvasCoord[1],
                ce.radiusX, ce.radiusY,
                0,
                0, TWO_PI,
            );
            state.ctx.fill();
        }
    }
    if(ixToRemove && ixToRemove.length) {
        window._cloudEffects = window._cloudEffects.filter((_ce, ix) => {
            return ixToRemove.indexOf(ix) != -1
        })
    }
}

function drawTireStrikes(state, nowTS) {
    // Draw tire strikes
    state.map.tireStrikes.forEach(ts => {
        const tsCanvasPoint = mapCoordToCanvasCoord(
            ts.originMapPoint, state.plane.posMapCoord, state.camera,
        );
        // Draw mark on runway
        state.ctx.beginPath();
        state.ctx.strokeStyle = "rgb(0, 0, 0, 0.6)";
        state.ctx.lineWidth = 6;
        state.ctx.moveTo(
            tsCanvasPoint[0] - (0.75 * state.map.mapUnitsPerMeter),
            tsCanvasPoint[1],
        );
        state.ctx.lineTo(
            tsCanvasPoint[0] + (0.75 * state.map.mapUnitsPerMeter),
            tsCanvasPoint[1],
        );
        state.ctx.stroke();

        // Draw "rising haze" effect if strike was recent
        const tireStrikeRHLifespanMS = 1600;
        const ageMS = nowTS - ts.createdTS;
        if(ageMS > tireStrikeRHLifespanMS) {
            return;
        }
        const radiusCurve = ageSeconds => Math.pow(ageSeconds, 2) * 0.5 + 0.5;
        const percentAge = ageMS / tireStrikeRHLifespanMS;
        const alpha = 1 - percentAge;
        const radius = Math.max(0.2, radiusCurve(ageMS / 1000)) * state.map.mapUnitsPerMeter;
        const xOffset = -1 * state.map.mapUnitsPerMeter * percentAge;
        const yOffset = 2 * state.map.mapUnitsPerMeter * percentAge;

        state.ctx.beginPath();
        state.ctx.fillStyle = `rgb(50, 50, 50, ${ alpha })`;
        state.ctx.arc(
            tsCanvasPoint[0] + xOffset,
            tsCanvasPoint[1] - yOffset,
            radius,
            0,
            TWO_PI,
        );
        state.ctx.fill();
    });
}


function _drawRunway(state, nowTS, cameraMapCoordXMax) {
    const runwayHalfVisualH = state.map.rwVisualWidthM / 2 * state.map.mapUnitsPerMeter;
    const rwCanvasP0 = mapCoordToCanvasCoord(
        state.map.rwP0MapCoord, state.plane.posMapCoord, state.camera
    );
    const rwCanvasP1 = mapCoordToCanvasCoord(
        state.map.rwP1MapCoord, state.plane.posMapCoord, state.camera,
    );
    state.ctx.beginPath();
    let addPaintLines = false;
    let paintLineColor;
    if(state.map.rwType === RUNWAY_TYPE_CONCRETE) {
        addPaintLines = true;
        state.ctx.fillStyle = RUNWAY_TYPE_CONCRETE_COLOR;
        paintLineColor = "#fff"
    } else if (state.map.rwType === RUNWAY_TYPE_DIRT) {
        state.ctx.fillStyle = RUNWAY_TYPE_DIRT_COLOR;
        paintLineColor = "#949494"
    }
    state.ctx.rect(
        rwCanvasP0[0],
        rwCanvasP0[1] - runwayHalfVisualH,
        rwCanvasP1[0] - rwCanvasP0[0],
        runwayHalfVisualH * 2,
    );
    state.ctx.fill();

    const rwLenMeters = (rwCanvasP1[0] - rwCanvasP0[0]) / state.map.mapUnitsPerMeter;
    const paintLineLengthMeters = 9;
    const paintLineIntervalMeters = 16;
    let rwMeterPtr = paintLineIntervalMeters;
    while(true)
    {
        if(rwMeterPtr >= rwLenMeters - paintLineIntervalMeters) {
            break;
        }

        const paintLineP0X = state.map.rwP0MapCoord[0] + rwMeterPtr * state.map.mapUnitsPerMeter;
        if(paintLineP0X > cameraMapCoordXMax) {
            break;
        }
        const paintLineP0 = mapCoordToCanvasCoord(
            [
                paintLineP0X,
                state.map.rwP0MapCoord[1],
            ],
            state.plane.posMapCoord,
            state.camera,
        );
        const paintLineP1 = mapCoordToCanvasCoord(
            [
                paintLineP0X + paintLineLengthMeters * state.map.mapUnitsPerMeter,
                state.map.rwP0MapCoord[1],
            ],
            state.plane.posMapCoord,
            state.camera,
        );
        if(paintLineP1[0] >= 0) {
            state.ctx.beginPath();
            state.ctx.strokeStyle = paintLineColor;
            state.ctx.lineWidth = state.map.rwVisualWidthM * 1.5;
            state.ctx.moveTo(...paintLineP0);
            state.ctx.lineTo(...paintLineP1);
            state.ctx.stroke();
        }
        rwMeterPtr += (paintLineLengthMeters + paintLineIntervalMeters);
    }

    drawTireStrikes(state, nowTS);
}

function _drawCarrierRunway(state, nowTS) {
    const mupm = state.map.mapUnitsPerMeter;
    const plane = state.plane;
    // Runway Map Coords
    const rwMapTopLeft = [
        state.map.rwP0MapCoord[0],
        state.map.rwP0MapCoord[1] + (state.map.rwVisualWidthM * mupm / 2),
    ];
    const rwLength = state.map.rwP1MapCoord[0] - state.map.rwP0MapCoord[0];
    const rwHeight = state.map.rwVisualWidthM * mupm;

    // Boat Map coords
    const mapMidY = state.map.rwP0MapCoord[1] - ((state.map.rwVisualWidthM / 2  * mupm) + (2.5 * mupm));
    const boatMapTopLeft = [
        rwMapTopLeft[0],
        rwMapTopLeft[1] + 2.5 * mupm
    ];
    const boatMapTopRight = [
        state.map.carrierMaxMapX,
        boatMapTopLeft[1],
    ];
    const boatMapMiddleRight = [
        boatMapTopRight[0],
        mapMidY,
    ];
    const boatMapBottomRight = [
        boatMapTopRight[0] - (4 * mupm),
        0,
    ];
    const boatMapBottomLeft = [
        boatMapTopLeft[0] + (6 * mupm),
        0,
    ];
    const boatMapMidLeft = [
        boatMapTopLeft[0],
        mapMidY,
    ];

    // Boat Deck
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_DECK;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        boatMapTopLeft, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapTopRight, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapMiddleRight, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapMidLeft, plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_SIDE;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        boatMapMiddleRight, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapBottomRight, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapBottomLeft, plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        boatMapMidLeft, plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();

    // Runway
    const rwTopLefCC = mapCoordToCanvasCoord(
        rwMapTopLeft, plane.posMapCoord, state.camera,
    );
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_RUNWAY;
    state.ctx.rect(
        rwTopLefCC[0], rwTopLefCC[1],
        rwLength, rwHeight,
    );
    state.ctx.fill();
    state.ctx.beginPath();
    state.ctx.strokeStyle = "#000";
    state.ctx.lineWidth = 7;
    state.ctx.rect(
        rwTopLefCC[0], rwTopLefCC[1],
        rwLength, rwHeight,
    );
    state.ctx.stroke();
    state.ctx.beginPath();
    state.ctx.setLineDash([25, 25]);
    state.ctx.strokeStyle = "#999902";
    state.ctx.lineWidth = 7;
    state.ctx.rect(
        rwTopLefCC[0], rwTopLefCC[1],
        rwLength, rwHeight,
    );
    state.ctx.stroke();
    state.ctx.setLineDash([]);

    // Tire Strikes
    drawTireStrikes(state, nowTS);

    // Arrestor cables
    for(let i in state.map.carrierRWArrestorCableMapXs) {
        state.ctx.beginPath();
        state.ctx.strokeStyle = "#5e5e5e";
        state.ctx.lineWidth = 3;
        let cableX = state.map.carrierRWArrestorCableMapXs[i];
        state.ctx.moveTo(...mapCoordToCanvasCoord(
            [cableX, rwMapTopLeft[1] + 1.5 * mupm],
            plane.posMapCoord,
            state.camera,
        ));
        const pointOfContactX = plane.posMapCoord[0] - plane.dimensions[plane.flare][0] / 2 * mupm
        if(
            plane.carrierRWArrestorCableCaught !== null
            && i == plane.carrierRWArrestorCableCaught
            && cableX < pointOfContactX
        ) {
            state.ctx.lineTo(...mapCoordToCanvasCoord(
                [
                    pointOfContactX,
                    plane.posMapCoord[1] - plane.dimensions[plane.flare][1] / 3 * mupm,
                ],
                plane.posMapCoord,
                state.camera,
            ));
        }
        state.ctx.lineTo(...mapCoordToCanvasCoord(
            [cableX, rwMapTopLeft[1] - (rwHeight + 1.5 * mupm)],
            plane.posMapCoord,
            state.camera,
        ));
        state.ctx.stroke();
    }

    // Arresting Gear Target Area
    const agtaCCTopLeft = mapCoordToCanvasCoord(
        [
            state.map.carrierRWArrestingGearBounds.xStart,
            rwMapTopLeft[1],
        ],
        plane.posMapCoord,
        state.camera,
    );
    const agtaWidth = (
        state.map.carrierRWArrestingGearBounds.xEnd
        - state.map.carrierRWArrestingGearBounds.xStart
    );
    state.ctx.beginPath();
    state.ctx.fillStyle = 'rgb(0, 255, 0, 0.3)';
    const flickerExt = getRandomFloat(0, 2 * mupm)
    state.ctx.rect(
        agtaCCTopLeft[0], agtaCCTopLeft[1] - flickerExt,
        agtaWidth,
        rwHeight + flickerExt * 2,
    );
    state.ctx.fill();

    // control tower
    let objY1, objY2;
    // Base
    const ctBaseMapX1 = state.map.rwP0MapCoord[0] + (rwLength * 0.5);
    const ctBaseMapX2 = ctBaseMapX1 + (8 * mupm);
    const ctBaseMapY1 = boatMapTopLeft[1] - (0.5 * mupm);
    const ctBaseMapY2 = ctBaseMapY1 + (6 * mupm);
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_SIDE;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [ctBaseMapX1, ctBaseMapY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctBaseMapX1, ctBaseMapY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctBaseMapX2, ctBaseMapY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctBaseMapX2, ctBaseMapY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    const ctWindowMapX1 = ctBaseMapX1 - 3 * mupm;
    const ctWindowMapX2 = ctBaseMapX2 + 3 * mupm;
    const ctWindowDivX1 = ctWindowMapX1 - 0.6 * mupm
    const ctWindowDivX2 = ctWindowMapX2 + 0.6 * mupm
    const ctwindowYHeight = 1.5 * mupm;
    const ctWindowDivHeight = 0.6 * mupm;
    // Window layer 1
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_WINDOW
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 3;
    objY1 = ctBaseMapY2;
    objY2 = ctBaseMapY2 + ctwindowYHeight;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    state.ctx.stroke();
    // Divider layer 1
    objY1 = ctBaseMapY2 + ctwindowYHeight
    objY2 = ctBaseMapY2 + ctwindowYHeight + ctWindowDivHeight
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_SIDE
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 1;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    // Window Layer 2
    objY1 = objY2;
    objY2 = objY1 + ctwindowYHeight;
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_WINDOW
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 3;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    state.ctx.stroke();
    // Divider Layer 2
    objY1 = objY2;
    objY2 = objY1 + ctWindowDivHeight;
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_SIDE
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 1;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    // Window Layer 3
    objY1 = objY2;
    objY2 = objY1 + ctwindowYHeight;
    const topWindowX1 = ctWindowMapX1 + ((ctWindowMapX2 - ctWindowMapX1) / 2);
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_WINDOW
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 3;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [topWindowX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [topWindowX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowMapX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [topWindowX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();
    state.ctx.stroke();
    // Divider Layer 3
    objY1 = objY2;
    objY2 = objY1 + ctWindowDivHeight;
    const topDivX1 = topWindowX1 - (0.5 * mupm);
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_CARRIER_SIDE
    state.ctx.strokeStyle = "#000";
    state.lineWidth = 1;
    state.ctx.moveTo(...mapCoordToCanvasCoord(
        [topDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [topDivX1, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY2], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [ctWindowDivX2, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.lineTo(...mapCoordToCanvasCoord(
        [topDivX1, objY1], plane.posMapCoord, state.camera,
    ));
    state.ctx.fill();

    // Draw planes on deck
    const noFlare = IS_NOT_FLARING;
    let topLeftPlaneCorner, planeRowXPointer, planeRowYPointer;
    const planeXPX = state.plane.dimensions[noFlare][0] * mupm;
    const planeYPX = state.plane.dimensions[noFlare][1] * mupm;
    const xInt = (1 * mupm);
    const yInt = (0.85 * mupm);

    planeRowXPointer = state.map.rwP1MapCoord[0] + (5 * mupm);
    planeRowYPointer = boatMapTopLeft[1] - (0.5 * mupm);
    topLeftPlaneCorner = mapCoordToCanvasCoord(
        [planeRowXPointer, planeRowYPointer], plane.posMapCoord, state.camera,
    );
    state.ctx.drawImage(
        state.plane.assets[noFlare],
        topLeftPlaneCorner[0], topLeftPlaneCorner[1],
        planeXPX, planeYPX,
    );
    planeRowXPointer += xInt
    planeRowYPointer -= yInt
    topLeftPlaneCorner = mapCoordToCanvasCoord(
        [planeRowXPointer, planeRowYPointer], plane.posMapCoord, state.camera,
    );
    state.ctx.drawImage(
        state.plane.assets[noFlare],
        topLeftPlaneCorner[0], topLeftPlaneCorner[1],
        planeXPX, planeYPX,
    );
    planeRowXPointer += xInt
    planeRowYPointer -= yInt
    topLeftPlaneCorner = mapCoordToCanvasCoord(
        [planeRowXPointer, planeRowYPointer], plane.posMapCoord, state.camera,
    );
    state.ctx.drawImage(
        state.plane.assets[noFlare],
        topLeftPlaneCorner[0], topLeftPlaneCorner[1],
        planeXPX, planeYPX,
    );
    planeRowXPointer += xInt
    planeRowYPointer -= yInt
    topLeftPlaneCorner = mapCoordToCanvasCoord(
        [planeRowXPointer, planeRowYPointer], plane.posMapCoord, state.camera,
    );
    state.ctx.drawImage(
        state.plane.assets[noFlare],
        topLeftPlaneCorner[0], topLeftPlaneCorner[1],
        planeXPX, planeYPX,
    );
}

function drawScoreScreen(state) {
    const sbAgeMS = performance.now() - state.game.score.scorePhaseStartedTS;
    const sbXMaxPX = 500;
    const sbXMinOffset = 10;
    const sbWidth = Math.min(sbXMaxPX, state.camera.canvasW - sbXMinOffset * 2);
    const sbXOffset = (state.camera.canvasW - sbWidth) / 2;

    const sbYMaxPX = 800;
    const sbHeightTopOffset = MAIN_BUTTON_Y_LENGTH + 10;
    const sbHeightMinBottomOffset = 10;
    const sbHeight = Math.min(
        sbYMaxPX,
        state.camera.canvasH - (sbHeightTopOffset  + sbHeightMinBottomOffset)
    );

    // 0-500 MS: purple container fade in
    const fadeInPercent = Math.min(1, sbAgeMS / 500)
    const maxAlpha = 0.78;
    const currentAlhpa = maxAlpha * fadeInPercent;
    state.ctx.beginPath();
    state.ctx.fillStyle = COLOR_SCORE_BOARD_BACKGROUND(currentAlhpa);
    state.ctx.rect(sbXOffset, sbHeightTopOffset, sbWidth, sbHeight);
    state.ctx.fill();
    if(fadeInPercent < 1) {
        return;
    }

    const col1XOffset = sbXOffset + 10;
    const col2XOffset = sbXOffset + sbWidth - 10;
    const rowYSizeMedium = 38;
    let yOffset = sbHeightTopOffset + 30

    // Level completed
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "center";
    state.ctx.fillStyle = "#fff";
    state.ctx.font = "normal 36px Arial";
    state.ctx.fillText(
        "Level " + state.game.level + " ✅",
        state.camera.canvasHalfW,
        yOffset
    );

    // Landing description (700MS)
    if(sbAgeMS < 700) {
        return;
    }
    yOffset += rowYSizeMedium;
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "center";
    state.ctx.font = "italic 26px Arial";
    state.ctx.fillText(
        "\"" + state.game.score.overall.value + " landing\"",
        state.camera.canvasHalfW,
        yOffset,
    );

    // Vertical speed (900MS)
    if(sbAgeMS < 900) {
        return;
    }
    yOffset += rowYSizeMedium;
    state.ctx.beginPath();
    state.ctx.textAlign = "left";
    state.ctx.textBaseline = "middle";
    state.ctx.font = "normal 24px Arial";
    state.ctx.fillText(
        "Vertical Speed",
        col1XOffset,
        yOffset
    );
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "right";
    state.ctx.font = "normal 24px Arial";
    state.ctx.fillText(
        (state.game.score.verticalSpeed.emphasize ? "⭐ " : "")
        + state.game.score.verticalSpeed.value,
        col2XOffset,
        yOffset,
    );
    // ACCURACY (1100MS)
    if(sbAgeMS < 1100) {
        return;
    }
    yOffset += rowYSizeMedium;
    state.ctx.beginPath();
    state.ctx.textAlign = "left";
    state.ctx.font = "normal 30px Arial";
    state.ctx.fillText(
        "Accuracy",
        col1XOffset,
        yOffset
    );
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "right";
    state.ctx.font = "normal 24px Arial";
    state.ctx.fillText(
        (state.game.score.accuracy.emphasize ? "⭐ " : "")
        + state.game.score.accuracy.value,
        col2XOffset,
        yOffset,
    );
    // Total score (1300ms -> 2100MS)
    if(sbAgeMS < 1300) {
        return;
    }
    yOffset += rowYSizeMedium;
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "left";
    state.ctx.font = "bold 30px Arial";
    state.ctx.fillStyle = "#ff0";
    state.ctx.fillText(
        "Score",
        col1XOffset,
        yOffset
    );
    const displayedPercent = Math.min(1, (sbAgeMS - 1300) / 800);
    const totalScore = state.game.score.total;
    const scoreToShow = Math.round(totalScore * displayedPercent);
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "right";
    state.ctx.font = "bold 30px Arial";
    if(displayedPercent < 1) {
        state.ctx.fillStyle = `rgb(${getRandomInt(200, 255)} ${getRandomInt(200, 255)} ${getRandomInt(0, 100)})`
    } else {
        state.ctx.fillStyle = "#ff0";
    }
    state.ctx.fillText(
        scoreToShow,
        col2XOffset,
        yOffset,
    );
    // High score
    if(displayedPercent >= 1) {
        yOffset += rowYSizeMedium;
        if(state.game.score.isNewHighScore) {
            state.ctx.beginPath();
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.font = "normal 28px Arial";
            state.ctx.fillStyle = "#ff0";
            state.ctx.fillText(
                "🎉 New High Score 🎉",
                state.camera.canvasHalfW,
                yOffset,
            );
        }
        else if(state.game.score.currentHighScore !== null) {
            state.ctx.beginPath();
            state.ctx.textBaseline = "middle";
            state.ctx.textAlign = "center";
            state.ctx.font = "italic 24px Arial";
            state.ctx.fillStyle = "#fff";
            state.ctx.fillText(
                "high score: " + state.game.score.currentHighScore,
                state.camera.canvasHalfW,
                yOffset,
            );
        }
        else {
            console.warn("no high score data to show")
        }
    }
}

function drawHorizontalDistanceArrow(state) {
    const plane = state.plane;
    if(
        !plane.alive
        || plane.posMapCoord[0] > state.map.rwP0MapCoord[0]
        || state.game.level !== 7
    ) {
        return;
    }

    // Horizontal Distance Text
    const mupm = state.map.mapUnitsPerMeter;
    const distanceToDiveM = Math.round((state.map.glideSlopes[0].p1[0] - plane.posMapCoord[0]) / mupm);
    const diveSoon = distanceToDiveM < 400;
    if(distanceToDiveM < 0) {
        return;
    }
    const rwDText1P = [
        state.camera.canvasHalfW,
        Math.round(state.camera.canvasH * 0.35),
    ];
    state.ctx.beginPath();
    state.ctx.fillStyle = (diveSoon && state.game.frame % 120 < 60) ? "#f00" : "#000";
    state.ctx.font = `${diveSoon ? "bold 32" : 20}px Arial`;
    state.ctx.textBaseline = "bottom";
    state.ctx.textAlign = "left";
    state.ctx.fillText("DIVE", ...rwDText1P);
    const rwDText2P = [
        rwDText1P[0],
        rwDText1P[1] + 25,
    ];
    state.ctx.beginPath();
    state.ctx.fillStyle = diveSoon ? "#f00" : "#000";
    state.ctx.font = "bold 25px Arial";
    state.ctx.fillText(`${distanceToDiveM.toFixed(0)} M`, ...rwDText2P);

    // Runway Distance Arrow
    const rwDLineP1 = [
        rwDText2P[0],
        rwDText2P[1] + 17,
    ];
    const rwDLineP2 = [
        state.camera.canvasW * 0.9,
        rwDText2P[1] + 17,
    ];
    state.ctx.beginPath();
    state.ctx.strokeStyle = "#000";
    state.ctx.lineWidth = 1;
    state.ctx.moveTo(...rwDLineP1);
    state.ctx.lineTo(...rwDLineP2);
    state.ctx.stroke();
    const altArrowHeadLen = 15;
    state.ctx.beginPath();
    state.ctx.moveTo(...rwDLineP2);
    state.ctx.lineTo(rwDLineP2[0] - altArrowHeadLen, rwDLineP2[1] - altArrowHeadLen / 2);
    state.ctx.stroke();
    state.ctx.beginPath();
    state.ctx.moveTo(...rwDLineP2);
    state.ctx.lineTo(rwDLineP2[0] - altArrowHeadLen, rwDLineP2[1] + altArrowHeadLen / 2);
    state.ctx.stroke();
}

function drawDebugData(state) {
    // Text info
    state.ctx.beginPath();
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "right";
    state.ctx.fillStyle = "black";
    state.ctx.font = "normal 18px Arial";

    let yPointer = state.camera.canvasH - 10;
    const yInterval = 20;
    const xOffset =  state.camera.canvasW - 10;

    state.ctx.fillText(`FPS: ${Math.round(state.game.dataFPS)}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`phase: ${state.game.phase}`, xOffset, yPointer);
    yPointer -= yInterval;
    state.ctx.fillText(`flare: ${state.plane.flare}`, xOffset, yPointer);
    yPointer -= yInterval;
    if(Array.isArray(state.plane.posMapCoord)) {
        state.ctx.fillText(`X pos: ${Math.round(state.plane.posMapCoord[0])}`, xOffset, yPointer);
        yPointer -= yInterval;
        state.ctx.fillText(`Y pos: ${Math.round(state.plane.posMapCoord[1])}`, xOffset, yPointer);
        yPointer -= yInterval;
    }
    if(state.plane.horizontalMS !== null && state.plane.verticalMS !== null) {
        state.ctx.fillText(`X m/s: ${state.plane.horizontalMS.toFixed(2)}`, xOffset, yPointer);
        yPointer -= yInterval;
        state.ctx.fillText(`Y m/s: ${state.plane.verticalMS.toFixed(2)}`, xOffset, yPointer);
        yPointer -= yInterval;
    }

    // Wind
    if(state.map.windXVel !== null && state.map.windXTarg !== null) {
        state.ctx.fillText(`windXVel: ${state.map.windXVel.toFixed(2)}`, xOffset, yPointer);
        yPointer -= yInterval;
        state.ctx.fillText(`windXTarg: ${state.map.windXTarg.toFixed(2)}`, xOffset, yPointer);
        yPointer -= yInterval;
    }

    // Draw map scape
    if(state.map.mapUnitsPerMeter && state.camera.canvasH) {
        const msXOffset = 25;
        const msYOffset = 15;
        const msPXLen = state.camera.canvasW / 3;
        const msMLen = Math.round(msPXLen / state.map.mapUnitsPerMeter, 1);
        const msP0 = [msXOffset, state.camera.canvasH - msYOffset];
        const msP1 = [msXOffset + msPXLen, state.camera.canvasH - msYOffset];
        state.ctx.beginPath();
        state.ctx.strokeStyle = "#000000";
        state.ctx.lineWidth = 2;
        state.ctx.moveTo(...msP0);
        state.ctx.lineTo(...msP1);
        state.ctx.stroke();
        state.ctx.beginPath();
        state.ctx.textBaseline = "bottom";
        state.ctx.textAlign = "right";
        state.ctx.fillStyle = "black";
        state.ctx.font = "normal 18px Arial";
        state.ctx.fillText(`${msMLen}M`, ...msP1);
    }

}

