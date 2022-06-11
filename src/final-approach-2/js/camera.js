

function getCanvasCornerMapCoords(state) {
    const cornerTopLeftMapCoord = [
        state.plane.posMapCoord[0] - state.camera.canvasHalfW,
        state.plane.posMapCoord[1] - state.camera.canvasHalfH,
    ];
    const cornerTopRightMapCoord = [
        state.plane.posMapCoord[0] + state.camera.canvasHalfW,
        state.plane.posMapCoord[1] - state.camera.canvasHalfH,
    ];
    const cornerBottomLeftMapCoord = [
        state.plane.posMapCoord[0] - state.camera.canvasHalfW,
        state.plane.posMapCoord[1] + state.camera.canvasHalfH,
    ];
    const cornerBottomRightMapCoord = [
        state.plane.posMapCoord[0] + state.camera.canvasHalfW,
        state.plane.posMapCoord[1] + state.camera.canvasHalfH,
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

    if (state.game.phase === PHASE_2_LIVE) {
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
        140,
        65,
        0,
        percent * TWO_PI,
    );
    state.ctx.stroke();
}



function drawHelp(state) {
    state.ctx.beginPath();
    state.ctx.fillStyle = "#f00";
    state.ctx.font = "bold italic 36px Arial";
    state.ctx.textBaseline = "middle";
    state.ctx.textAlign = "center";
    const titleOffset = 70;
    state.ctx.fillText(
        "Land the plane.",
        state.camera.canvasHalfW, titleOffset
    );
    state.ctx.beginPath();
    const imgSide = Math.min(state.camera.canvasH * 0.8, state.camera.canvasW);
    const tlcX = (state.camera.canvasW - imgSide) / 2;
    state.ctx.drawImage(state.helpImg, tlcX, titleOffset + 20, imgSide, imgSide);
}

function drawGameScene(state) {
    const nowTS = performance.now();
    const plane = state.plane;
    const planeMapDims = plane.dimensions[plane.flare];

    const [
        scTopLeftMapCoord,
        scTopRightMapCoord,
        scBottomLeftMapCoord,
        scBottomRightMapCoord,
    ] = getCanvasCornerMapCoords(state);

    // Draw ground/sky horizon
    const planeAltMeters = plane.posMapCoord[1] / state.map.mapUnitsPerMeter;
    const maxAltToShowHorizonMeters = 100;
    if(planeAltMeters > maxAltToShowHorizonMeters) {
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_SKY_FOREST;
        state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH)
        state.ctx.fill();
    } else {
        const percentSky = planeAltMeters / maxAltToShowHorizonMeters;
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_SKY_FOREST;
        state.ctx.rect(0, 0, state.camera.canvasW, state.camera.canvasH * percentSky)
        state.ctx.fill();
        state.ctx.beginPath();
        state.ctx.fillStyle = COLOR_GROUND_FOREST;
        state.ctx.rect(0, state.camera.canvasH * percentSky, state.camera.canvasW, state.camera.canvasH)
        state.ctx.fill();
    }

    // Draw runway
    const cameraMapCoordXMin = scTopLeftMapCoord[0];
    const cameraMapCoordXMax = scTopRightMapCoord[0];
    const runwayVisible = Boolean((
        state.map.rwP0MapCoord[0] >= cameraMapCoordXMin
        && state.map.rwP0MapCoord[0] <= cameraMapCoordXMax
    ) || (
        state.map.rwP1MapCoord[0] >= cameraMapCoordXMin
        && state.map.rwP1MapCoord[0] <= cameraMapCoordXMax
    ) || (
        state.map.rwP0MapCoord[0] <= cameraMapCoordXMin
        && state.map.rwP1MapCoord[0] >= cameraMapCoordXMax
    ));
    if(runwayVisible) {
        _drawRunway(state, nowTS, cameraMapCoordXMax);
    }

    // Draw Glide Slope
    if(Math.random() < 0.9) {
        const gsCanvasP0 = mapCoordToCanvasCoord(
            state.map.gsP0MapCoord, plane.posMapCoord, state.camera
        );
        const gsCanvasP1 = mapCoordToCanvasCoord(
            state.map.gsP1MapCoord, plane.posMapCoord, state.camera
        );
        state.ctx.beginPath();
        state.ctx.strokeStyle = `rgb(242, 0, 255, ${ getRandomFloat(0.2, 0.8) })`;
        state.ctx.lineWidth = getRandomFloat(0.3, 2.4);
        state.ctx.moveTo(...gsCanvasP0);
        state.ctx.lineTo(...gsCanvasP1);
        state.ctx.stroke();
    }

    // Draw altitude indicator if over min altutude
    const runwayAltitudeM = state.map.rwP0MapCoord[1] * state.map.mapUnitsPerMeter;
    const planeBottomAltitudeM = (
        state.plane.posMapCoord[1]
        - (
            state.plane.dimensions[state.plane.flare][1] / 2
            * state.map.mapUnitsPerMeter
        )
    ) / state.map.mapUnitsPerMeter;
    if(!plane.crashFrame && planeBottomAltitudeM > (runwayAltitudeM + 8)) {
        // Altitude Text
        const altText1P = [
            state.camera.canvasHalfW,
            Math.round(state.camera.canvasH * 0.6),
        ];
        state.ctx.beginPath();
        state.ctx.fillStyle = "#000";
        state.ctx.font = "20px Arial";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "left";
        state.ctx.fillText("ground", ...altText1P);
        const altText2P = [
            altText1P[0],
            altText1P[1] + 25,
        ];
        state.ctx.beginPath();
        state.ctx.font = "bold 25px Arial";
        state.ctx.fillText(`${planeBottomAltitudeM.toFixed(0)} M`, ...altText2P);

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
        state.ctx.strokeStyle = "#000"
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

    if(!plane.crashFrame && plane.posMapCoord[0] < state.map.rwP0MapCoord[0]) {
        // Runway Distance Text
        const distanceToRWM = (state.map.rwP0MapCoord[0] - plane.posMapCoord[0]) / state.map.mapUnitsPerMeter;
        const rwDText1P = [
            state.camera.canvasHalfW,
            Math.round(state.camera.canvasH * 0.35),
        ];
        state.ctx.beginPath();
        state.ctx.fillStyle = "#000";
        state.ctx.font = "20px Arial";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "left";
        state.ctx.fillText("runway", ...rwDText1P);
        const rwDText2P = [
            rwDText1P[0],
            rwDText1P[1] + 25,
        ];
        state.ctx.beginPath();
        state.ctx.font = "bold 25px Arial";
        state.ctx.fillText(`${distanceToRWM.toFixed(0)} M`, ...rwDText2P);

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
        state.ctx.strokeStyle = "#000"
        state.ctx.lineWidth = 1;
        state.ctx.moveTo(...rwDLineP1);
        state.ctx.lineTo(...rwDLineP2);
        state.ctx.stroke();
        const altArrowHeadLen = 15
        state.ctx.beginPath();
        state.ctx.moveTo(...rwDLineP2);
        state.ctx.lineTo(rwDLineP2[0] - altArrowHeadLen, rwDLineP2[1] - altArrowHeadLen / 2);
        state.ctx.stroke();
        state.ctx.beginPath();
        state.ctx.moveTo(...rwDLineP2);
        state.ctx.lineTo(rwDLineP2[0] - altArrowHeadLen, rwDLineP2[1] + altArrowHeadLen / 2);
        state.ctx.stroke();
    }



    if(!plane.crashFrame) {
        // Draw Plane Shadow
        const planeCanvasDims = planeMapDims.map(d => d * state.map.mapUnitsPerMeter);
        const shadowCenterMapCoord = [
            plane.posMapCoord[0] + state.plane.posMapCoord[1] * 0.4,
            plane.posMapCoord[1] * -0.2,
        ];
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

        const shakeLifespanMS = 450;
        const tireStrikeLen = state.map.tireStrikes.length;
        const lastTireStrike = tireStrikeLen > 0 ? state.map.tireStrikes[tireStrikeLen - 1] : null;
        const showVisualSkake = Boolean(lastTireStrike !== null && lastTireStrike.createdTS + shakeLifespanMS >= nowTS);

        // Draw plane
        const planeCanvasX1 = state.camera.canvasHalfW - (planeCanvasDims[0] / 2);
        const planeCanvasY1 = state.camera.canvasHalfH - (planeCanvasDims[1] / 2);
        state.ctx.beginPath();
        state.ctx.drawImage(
            plane.assets[plane.flare],
            planeCanvasX1 + (showVisualSkake ? getRandomFloat(-1 * lastTireStrike.shakeMeters, lastTireStrike.shakeMeters) * state.map.mapUnitsPerMeter : 0),
            planeCanvasY1 + (showVisualSkake ? getRandomFloat(-1 * lastTireStrike.shakeMeters, lastTireStrike.shakeMeters) * state.map.mapUnitsPerMeter : 0),
            planeCanvasDims[0],
            planeCanvasDims[1],
        );
    }

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
}

function _drawRunway(state, nowTS, cameraMapCoordXMax) {
    const runwayHalfVisualHMeters = 4.3 * state.map.mapUnitsPerMeter;
    const rwCanvasP0 = mapCoordToCanvasCoord(
        state.map.rwP0MapCoord, state.plane.posMapCoord, state.camera
    );
    const rwCanvasP1 = mapCoordToCanvasCoord(
        state.map.rwP1MapCoord, state.plane.posMapCoord, state.camera,
    );
    state.ctx.beginPath()
    state.ctx.fillStyle = COLOR_RW_FOREST;
    state.ctx.rect(
        rwCanvasP0[0],
        rwCanvasP0[1] - runwayHalfVisualHMeters,
        rwCanvasP1[0] - rwCanvasP0[0],
        runwayHalfVisualHMeters * 2,
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
            state.ctx.strokeStyle = "#fff";
            state.ctx.lineWidth = 8;
            state.ctx.moveTo(...paintLineP0);
            state.ctx.lineTo(...paintLineP1);
            state.ctx.stroke();
        }
        rwMeterPtr += (paintLineLengthMeters + paintLineIntervalMeters);
    }

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
    // Draw map scape
    if(state.map.mapUnitsPerMeter && state.camera.canvasH) {
        const msXOffset = 25;
        const msYOffset = 15;
        const msPXLen = state.camera.canvasW / 3;
        const msMLen = Math.round(msPXLen / state.map.mapUnitsPerMeter, 1)
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

