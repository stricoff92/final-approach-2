

function createNewState(maxCompletedLevel) {

    window._cloudEffects = [];
    window._debrisObjects = [];

    const canvas = document.getElementById(CANVAS_ID);
    const ctx = canvas.getContext("2d")
    maxCompletedLevel = maxCompletedLevel || 0;
    const availableLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return {
        isDebug: urlContainsDebug(),
        ctx,
        pageTitle:{text: "Select A Level", color: COLOR_PURPLE},
        game: {
            phase: PHASE_0_LOBBY,
            maxCountDownFrames: 60,
            countDownFrames: 0,
            frame: 0,
            maxCompletedLevel,
            availableLevels,
            dataFPS: null,
            level: null,
            levelName: null,
            gameStartTS: null,
            lastFrameTS: performance.now(),
            acceptControlCommands: false,
            score: {
                total: null,
                scorePhaseStartedTS: null,
                isNewHighScore: false,
                currentHighScore: null,
                overall: {
                    value: null,
                    points: null,
                },
                verticalSpeed: {
                    value: null,
                    points: null,
                    emphasize: false,
                },
                accuracy: {
                    value: null,
                    points: null,
                    emphasize: false,
                },
            }
        },
        camera: {
            canvasW: null,
            canvasH: null,
            canvasHalfW: null,
            canvasHalfH: null,
        },
        plane: {
            asset: null,
            assets: [],
            dimensions: [],
            posMapCoord: null,
            horizontalMS: null,
            verticalMS: null,
            lastAccelerateUpFrame: null,
            lastAccelerateDownFrame: null,
            upAccelerationPerCmdMS: null,
            levelOnNextManeuver: false,
            downAccelerationPerCmdMS: null,
            terminalVerticalMS: null,
            verticalAccelerationMS: null,
            flare: IS_FLARING,
            touchDownFlareMinMS: null,
            minTouchdownVerticalMS: null,
            carrierRWArrestorCableCaught: null,
            startingFuel: null,
            fuelRemaining: null,
            fuelUsedLastTS: null,
            touchdownStats: {
                runwayUsedStartX: null,
                runwayUsedEndX: null,
                runwayUsedM: null,
                runwayWastedM: null,
                distanceToGlideSlopeM: null,
                verticalMS: null,
                isSmooth: false,
                isRough: false,
                isFlaired: false,
                bounces: 0,
            },
            adjustPlanePosition: state => {},
            previousPoints: [],
            previousAflamePoints: [],
            alive: true,
            aflame: false,
            crashFrame: 0,
            touchedDown: false,
            halted: false,
            rwNegAccelerationMS: null,
        },
        map: {
            terrain: null,
            mapUnitsPerMeter: null,
            windXVel: null,
            windMaxDeltaPerSecond: null,
            windXMin: null,
            windXMax: null,
            windXTarg: null,
            cloudLayer: null,
            rwP0MapCoord: null,
            rwP1MapCoord: null,
            rwType: null,
            rwVisualWidthM: null,
            carrierRWArrestingGearBounds: null,
            carrierMinMapX: null,
            carrierMaxMapX: null,
            carrierRWArrestorCableMapXs: null,
            getDangerStatus: state => {},
            getAutopilotStatus: state => {},
            glideSlopes: [],
            tireStrikes: [],
            aaFire: [],
            aaFireP0: null,
            sunImg: null,
            jungleCamoTruckImg: null,
        },
        buttons: availableLevels.map(levelNumber => {
            const disabled = levelNumber > (maxCompletedLevel + 1);
            const btn = {
                type: BUTTON_TYPE_GRID,
                text: disabled ? '🔒' : `Level ${levelNumber}`,
                boxCoord: null,
                disabled,
                handler: disabled ? ()=>{console.log("btn disabled")} : () => {
                    window.addCommand({
                        cmd: COMMAND_START_LEVEL,
                        args: [ levelNumber ],
                    });
                }
            };
            return btn;
        }),
    }
}

function orientButtons(state) {
    const gridBtns = [], mainBtns = [], ctrlBtns = [];
    state.buttons.forEach((btn, wix) => {
        if(btn.type === BUTTON_TYPE_GRID) {
            gridBtns.push([btn, wix]);
        } else if(btn.type === BUTTON_TYPE_MAIN) {
            mainBtns.push([btn, wix]);
        } else {
            throw NOT_IMPLEMENTED;
        }
    });

    if(gridBtns.length) {
        const gridBtnsCount = gridBtns.length;
        const gridBtnMargin = 4;
        const gridBtnWidth = 125;
        const gridBtnHeight = 35;
        const gridBtnCol0XOffset = state.camera.canvasHalfW - (gridBtnWidth + gridBtnMargin)// 30;
        const gridBtnRow0YOffset = 100;
        let rowPointer = 0;
        let colPointer = 0;
        const gridMaxRows = Math.min(5, Math.floor(
            state.camera.canvasH - (gridBtnRow0YOffset * 2) / gridBtnHeight
        ));

        for(let i=0; i < gridBtnsCount; i++) {
            let [_btn, wix] = gridBtns[i];
            let btnX1 = gridBtnCol0XOffset + (colPointer * gridBtnWidth) + (gridBtnMargin * colPointer);
            let btnX2 = btnX1 + gridBtnWidth;
            let btnY1 = gridBtnRow0YOffset + (rowPointer * gridBtnHeight) + (gridBtnMargin * rowPointer);
            let btnY2 = btnY1 + gridBtnHeight;
            state.buttons[wix].boxCoord =  [[btnX1, btnY1], [btnX2, btnY2]]

            rowPointer++
            if(rowPointer >= gridMaxRows) {
                rowPointer = 0;
                colPointer++;
            }
        }
    }

    if(ctrlBtns.length) {
        const ctrlBtnsCount = ctrlBtns.length;
        const ctrlBtnHeight = Math.floor(state.camera.canvasH * 0.95 / ctrlBtnsCount);
        const ctrlBtnWidth = Math.min(state.camera.canvasW / 10, 60);
        let y1Pointer = 0;
        for(let i = 0; i < ctrlBtnsCount; i++) {
            let [_btn, wix] = ctrlBtns[i];

            if(state.buttons[wix].assetHref && !state.buttons[wix].asset) {
                state.buttons[wix].asset = new Image();
                state.buttons[wix].asset.src = state.buttons[wix].assetHref;
            }

            state.buttons[wix].boxCoord =  [
                [0, y1Pointer],
                [ctrlBtnWidth, y1Pointer + ctrlBtnHeight]
            ]
            y1Pointer += ctrlBtnHeight;
        }
    }

    if(mainBtns.length) {
        const mainBtnsCount = mainBtns.length;
        const mainBtnHeight = MAIN_BUTTON_Y_LENGTH;
        const mainBtnWidth = 100;
        let x1Pointer = state.camera.canvasW - mainBtnWidth;
        for(let i = 0; i < mainBtnsCount; i++) {
            let [_btn, wix] = mainBtns[i];
            state.buttons[wix].boxCoord =  [
                [x1Pointer, 0],
                [x1Pointer + mainBtnWidth, mainBtnHeight]
            ];
            x1Pointer -= mainBtnWidth;
        }
    }

    return state;
}


function runDataLoop() {
    let state = window.readGameState();

    // Calculate FPS
    const mupm = state.map.mapUnitsPerMeter;
    const nowTS = performance.now();
    const lastFrameTS = state.game.lastFrameTS;
    const diff = nowTS - lastFrameTS;
    const fps = 1000 / diff;
    state.game.lastFrameTS = nowTS;
    state.game.dataFPS = fps;

    // Position buttons and check for clicks
    state = orientButtons(state);
    const nextClick = window.nextClick();
    if(nextClick) {
        const isArrow = nextClick.clickCanvasCoord === null;
        nextClick.clickCanvasCoord = nextClick.clickCanvasCoord || [state.camera.canvasHalfW, state.camera.canvasHalfH]
        const isBottomHalfClick = nextClick.clickCanvasCoord[1] > state.camera.canvasHalfH;
        let isButtonClick = false;
        for(let i = 0; i < state.buttons.length; i++) {
            let clickInside = coordInsideBoxCoord(
                nextClick.clickCanvasCoord,
                state.buttons[i].boxCoord,
            )
            if (clickInside) {
                state.buttons[i].handler();
                isButtonClick = true;
                break;
            }
        }
        if (!isButtonClick && state.game.phase === PHASE_2_LIVE) {
            const cmd = isArrow ? (nextClick.isTopHalfOfScreenClick ? COMMAND_ACCELERATE_UP : COMMAND_ACCELERATE_DOWN) : isBottomHalfClick ? COMMAND_ACCELERATE_DOWN : COMMAND_ACCELERATE_UP;
            window.addCommand({ cmd });
        }
    }

    if(state.game.phase === PHASE_2_LIVE || state.game.phase === PHASE_3_SCORESCREEN) {
        let commands = [];
        while(true) {
            let cmd = window.nextCommand()
            if(cmd) {
                commands.push(cmd);
            } else {
                break;
            }
        }

        state.game.frame++;
        if(state.game.frame % 500 === 0) {
            console.log({ state });
        }

        const aaFireIXsToRemove = []
        state.map.aaFire.forEach((d, ix) => {
            if(nowTS > d.createdTS + AA_FIRE_TOTAL_DURATION) {
                aaFireIXsToRemove.push(ix);
            }
        });
        if(aaFireIXsToRemove.length) {
            state.map.aaFire = state.map.aaFire.filter((_d, ix) => {
                return aaFireIXsToRemove.indexOf(ix) === -1;
            });
        }

        let dangerStatus;
        if(state.plane.alive && state.map.getDangerStatus) {
            dangerStatus = state.map.getDangerStatus(state);
        }
        if(dangerStatus && dangerStatus === DANGER_STATUS_INSTANT) {
            state.game.acceptControlCommands = false;
            state.plane.alive = false;
            state.plane.aflame = true;
            const aaFireP1 = [
                state.plane.posMapCoord[0] + (getRandomFloat(-1, 1) * mupm),
                state.plane.posMapCoord[1] + (getRandomFloat(-1, 1) * mupm),
            ];
            state.map.aaFire.push({
                createdTS: nowTS,
                createdFrame: state.game.frame,
                fatal: true,
                p0: state.map.aaFireP0,
                p1: aaFireP1,
            });
            createAAFireDebrisObjects(state, aaFireP1);
        }

        // Process commands
        const cmdCt = commands.length;
        const acceptCommands = Boolean(
            state.game.acceptControlCommands
            && !state.map.getAutopilotStatus(state)
        );
        for(let i=0; i<cmdCt; i++) {
            let cmd = commands[i];
            let maneuverPerformed = false;
            if(cmd.cmd === COMMAND_QUIT_LEVEL) {
                window.setGameState(
                    updateCameraCanvasMetaData(
                        createNewState(state.game.maxCompletedLevel)
                    )
                );
                setTimeout(runDataLoop);
                return;
            }
            else if(cmd.cmd === COMMAND_ACCELERATE_UP && acceptCommands) {
                if(state.plane.startingFuel !== null) {
                    if(state.plane.fuelRemaining > 0) {
                        state.plane.lastAccelerateUpFrame = state.game.frame;
                        state.plane.fuelRemaining--;
                        state.plane.fuelUsedLastTS = nowTS;
                        maneuverPerformed = true;
                    }
                } else {
                    state.plane.lastAccelerateUpFrame = state.game.frame;
                    maneuverPerformed = true;
                }
            }
            else if(cmd.cmd === COMMAND_ACCELERATE_DOWN && acceptCommands) {
                state.plane.lastAccelerateDownFrame = state.game.frame;
                maneuverPerformed = true;
            }
            if(
                maneuverPerformed
                && dangerStatus
                && dangerStatus === DANGER_STATUS_ON_LEVEL
            ) {
                state.game.acceptControlCommands = false;
                state.plane.alive = false;
                state.plane.aflame = true;
                const aaFireP1 = [
                    state.plane.posMapCoord[0] + (getRandomFloat(-1, 1) * mupm),
                    state.plane.posMapCoord[1] + (getRandomFloat(-1, 1) * mupm),
                ];
                state.map.aaFire.push({
                    createdTS: nowTS,
                    createdFrame: state.game.frame,
                    fatal: true,
                    p0: state.map.aaFireP0,
                    p1: aaFireP1,
                });
                createAAFireDebrisObjects(state, aaFireP1);
            }
        }

        const belowClouds = state.plane.posMapCoord[1] < state.map.cloudLayer.bottomY;
        if(
            dangerStatus
            && dangerStatus === DANGER_STATUS_ON_LEVEL
            && state.game.frame % (belowClouds ? 16 : 45) === 0
            && Math.random() > (belowClouds ? 0.33 : 0.5)
        ) {
            const getNearby = () => {
                if(Math.random() > 0.5) {
                    return getRandomFloat(5, 7.5) * mupm;
                } else {
                    return getRandomFloat(-7.5, -5) * mupm;
                }
            }
            const aaFireP1 = [
                state.plane.posMapCoord[0] + getNearby(),
                state.plane.posMapCoord[1] + getNearby(),
            ];
            state.map.aaFire.push({
                createdTS: nowTS,
                createdFrame: state.game.frame,
                fatal: false,
                p0: state.map.aaFireP0,
                p1: aaFireP1,
            });
            createAAFireDebrisObjects(state, aaFireP1);
        }

        if(state.plane.crashFrame) {
            state.plane.crashFrame++;
        }
        adjustDebrisPositions(state);

        // Adjust state for plane flying through the air
        if(!state.plane.touchedDown && !state.plane.crashFrame) {
            state = adjustMapWindValues(state);
            state = state.plane.adjustPlanePosition(state);
        }

        // check for ground contact and adjust state for plane
        // that is touching the ground.
        if(!state.plane.crashFrame && !state.plane.halted) {
            state = processGroundInteractions(state);
        }

        if(state.plane.halted && state.game.phase !== PHASE_3_SCORESCREEN) {
            state = calculateScore(state);
            state.game.phase = PHASE_3_SCORESCREEN;
            state.game.maxCompletedLevel = Math.max(
                state.game.level,
                state.game.maxCompletedLevel,
            );
            const totalScore = state.game.score.total;
            setCookie(
                getCNamMaxCompletedLevel(),
                state.game.maxCompletedLevel.toFixed(0),
            );
            if(state.game.score.isNewHighScore) {
                setCookie(
                    getCNameHighScore(state.game.level),
                    totalScore.toFixed(0),
                );
            }
        }

        if (state.plane.aflame && !state.plane.crashFrame) {
            state.plane.previousAflamePoints.unshift(
                deepCopy(state.plane.posMapCoord)
            );
            if(state.plane.previousAflamePoints.length > AFLAME_NODES_COUNT) {
                state.plane.previousAflamePoints = state.plane.previousAflamePoints.slice(0, AFLAME_NODES_COUNT);
            }
        }
        if(state.game.frame % 10 === 0 && !state.plane.halted && !state.plane.touchedDown) {
            state.plane.previousPoints.unshift(
                deepCopy(state.plane.posMapCoord)
            );
            state.plane.previousPoints = state.plane.previousPoints.slice(0, 10);
        }

        window.setGameState(state);

        const runtime = performance.now() - nowTS;
        const targetRuntimeMS = 16.667; // 60 FPS
        const timeout = Math.max(0, (targetRuntimeMS - runtime));
        setTimeout(runDataLoop, timeout);

        return;
    }

    // process commands
    const nextCmd = window.nextCommand();
    if(nextCmd) {
        if(
            nextCmd.cmd === COMMAND_START_LEVEL
            && state.game.phase === PHASE_0_LOBBY
        ) {
            state.game.phase = PHASE_1_COUNTDOWN;
            state.game.level = nextCmd.args[0];
            state.pageTitle = {
                text: "Get Ready!",
                color: COLOR_PURPLE,
            }
            state.buttons = [];
            state = setPlaneProps(state);
            state = setMapProps(state);
        }
    }

    // process count down
    if(state.game.phase === PHASE_1_COUNTDOWN) {
        state.game.countDownFrames++;
        if(state.game.countDownFrames >= state.game.maxCountDownFrames) {
            state.pageTitle = null;
            state.game.frame = 1;
            state.game.phase = PHASE_2_LIVE,
            state.game.acceptControlCommands = true;
            state.game.gameStartTS = performance.now();

            state.buttons = [{
                type: BUTTON_TYPE_MAIN,
                boxCoord: null,
                text: 'QUIT',
                handler: () => {
                    window.addCommand({
                        cmd: COMMAND_QUIT_LEVEL,
                    });
                },
            }];
        }
    }

    window.setGameState(state);

    const runtime = performance.now() - nowTS;
    const targetRuntimeMS = 16.667; // 60 FPS
    const timeout = Math.max(0, (targetRuntimeMS - runtime));
    setTimeout(runDataLoop, timeout);
    return;
}

const shakeSizeCurve = tdMs => Math.max(
    0.03,
    Math.abs(tdMs) / 15
);

function processGroundInteractions(state) {
    if(window._fa2_isPaused) {
        return;
    }
    const isCarrierLanding = state.map.rwType === RUNWAY_TYPE_CARRIER;
    const plane = state.plane;
    if(plane.crashFrame) {
        throw NOT_IMPLEMENTED;
    }
    const fps = state.game.dataFPS;

    const planeBottomMapCoordY = (
        state.plane.posMapCoord[1]
        - (
            state.plane.dimensions[state.plane.flare][1] / 2
            * state.map.mapUnitsPerMeter
        )
    );

    if(plane.touchedDown) {
        // Plane has touched down and negatively accelerating
        if(plane.horizontalMS > 0) {
            let deltaHVMF;
            if(plane.carrierRWArrestorCableCaught !== null) {
                const arrestorCurve = xMS => knotsToMS(-0.02 * Math.pow(mPSToKnots(xMS), 2) - 5)
                deltaHVMF = arrestorCurve(plane.horizontalMS) / fps;
            } else {
                deltaHVMF = plane.rwNegAccelerationMS * (!plane.flare ? 1 : 2) / fps;
            }
            const newHorizontalMS = Math.max(0, plane.horizontalMS + deltaHVMF)
            state.plane.horizontalMS = newHorizontalMS;
            if(newHorizontalMS > 0) {
                state.plane.posMapCoord[0] += (newHorizontalMS * state.map.mapUnitsPerMeter / fps);
                if(state.plane.posMapCoord[0] > state.map.rwP1MapCoord[0]) {
                    // Plane overan the runway
                    if(state.plane.carrierRWArrestorCableCaught === null) {
                        console.log("👉 overran runway");
                        state.plane.crashFrame++;
                        state.plane.alive = false;
                        createCrashDebrisObjects(state);
                    } else {
                        console.log("👉 forced halted");
                        state.plane.halted = true;
                        state.plane.touchdownStats.runwayUsedEndX = plane.posMapCoord[0];
                        state.plane.touchdownStats.runwayUsedM = (
                            state.plane.touchdownStats.runwayUsedEndX
                            - state.plane.touchdownStats.runwayUsedStartX
                        ) / state.map.mapUnitsPerMeter;
                    }
                }
                else {
                    if(
                        plane.flare === IS_FLARING
                        && (
                            newHorizontalMS < plane.touchDownFlareMinMS
                            || plane.carrierRWArrestorCableCaught !== null
                        )
                    ) {
                        state.plane.flare = IS_NOT_FLARING;
                        state.map.tireStrikes.push({
                            originMapPoint: deepCopy([
                                plane.posMapCoord[0] + plane.dimensions[IS_NOT_FLARING][0] / 2 * state.map.mapUnitsPerMeter,
                                planeBottomMapCoordY,
                            ]),
                            createdTS: performance.now(),
                            shakeMeters: (
                                plane.carrierRWArrestorCableCaught !== null
                                ? shakeSizeCurve(state.plane.touchdownStats.verticalMS / 1.5)
                                : 0.1
                            ),
                        });
                        console.log("👉 end of flare");
                    }
                }
            }
        } else {
            console.log("👉 halted");
            state.plane.halted = true;
            state.plane.touchdownStats.runwayUsedEndX = plane.posMapCoord[0];
            state.plane.touchdownStats.runwayUsedM = (
                state.plane.touchdownStats.runwayUsedEndX
                - state.plane.touchdownStats.runwayUsedStartX
            ) / state.map.mapUnitsPerMeter;
        }
        return state;
    }

    const planeBottomDiffY = state.plane.posMapCoord[1] - planeBottomMapCoordY;
    const overRunway = Boolean(
        state.plane.posMapCoord[0] >= state.map.rwP0MapCoord[0]
        && state.plane.posMapCoord[0] <= state.map.rwP1MapCoord[0]
    );
    const overNonLandableBoatPart = Boolean(
        isCarrierLanding
        && state.plane.posMapCoord[0] >= state.map.rwP1MapCoord[0]
        && state.plane.posMapCoord[0] <= state.map.carrierMaxMapX
    );

    // Plane crashed into the ground or non landable part of boat.
    if(
        (!overRunway && planeBottomMapCoordY <= 0)
        || (overNonLandableBoatPart && planeBottomMapCoordY < state.map.rwP1MapCoord[1])
    ) {
        state.plane.crashFrame++;
        state.plane.alive = false;
        createCrashDebrisObjects(state);
        return state;
    }

    const touchingRunway = Boolean(
        overRunway
        && planeBottomMapCoordY <= state.map.rwP0MapCoord[1]
    );
    if(touchingRunway) {

        const touchdownMS = state.plane.verticalMS;
        const isCrash = Boolean(
            touchdownMS < state.plane.minTouchdownVerticalMS
            || (isCarrierLanding && lineInterceptsBoatRear(
                state.map.rwP0MapCoord,
                planeToMapBoxCoords(state)
            ))
        );
        const noBounceMin = state.plane.minTouchdownVerticalMS * 0.333;
        const bigBounceMin = state.plane.minTouchdownVerticalMS * 0.666;
        let addRubberStrike = true;
        console.log({
            touchdownMS,
            flare: state.plane.flare,
            bigBounceMin,
            noBounceMin,
            planePosMapCoord: state.plane.posMapCoord,
        });

        const arrestorGearCaught = Boolean(
            isCarrierLanding
            && plane.posMapCoord[0] >= state.map.carrierRWArrestorCableMapXs[0]
            && plane.posMapCoord[0] <= state.map.carrierRWArrestorCableMapXs[
                state.map.carrierRWArrestorCableMapXs.length - 1
            ]
        );
        let arrestorIXCaught;
        if(arrestorGearCaught) {
            for(let i in state.map.carrierRWArrestorCableMapXs) {
                if(state.plane.posMapCoord[0] <= state.map.carrierRWArrestorCableMapXs[i]){
                    arrestorIXCaught = parseInt(i);
                    console.log(`👉 Arrestor Gear #${arrestorIXCaught+1} Caught`);
                    break;
                }
            }
            if(typeof arrestorIXCaught === "undefined") {
                throw NOT_IMPLEMENTED;
            }
            state.plane.carrierRWArrestorCableCaught = arrestorIXCaught;
        }

        // check for plane crash into runway
        if (isCrash)
        {
            console.log("👉 crash");
            state.plane.crashFrame++;
            state.plane.alive = false;
            addRubberStrike = false;
            createCrashDebrisObjects(state);
        }
        else if(!isCrash && (touchdownMS >= noBounceMin || arrestorGearCaught)) {
            // touchdown
            state.plane.touchedDown = true;
            state.game.acceptControlCommands = false;
            state.plane.verticalMS = 0;
            state.plane.posMapCoord[1] = state.map.rwP0MapCoord[1] + planeBottomDiffY;
            state.plane.touchdownStats.isSmooth = plane.touchdownStats.bounces === 0;
            state.plane.touchdownStats.verticalMS = touchdownMS;
            state.plane.touchdownStats.isFlaired = plane.flare === IS_FLARING;
            state.plane.touchdownStats.runwayUsedStartX = plane.posMapCoord[0];
            const lastGSIX = state.map.glideSlopes.length - 1;
            state.plane.touchdownStats.distanceToGlideSlopeM = Math.abs(
                // (plane.posMapCoord[0] - state.map.gsP1MapCoord[0])
                (plane.posMapCoord[0] - state.map.glideSlopes[lastGSIX].p1[0])
                / state.map.mapUnitsPerMeter
            )
            state.plane.touchdownStats.runwayWastedM = Math.max(
                0,
                // (plane.posMapCoord[0] - state.map.gsP1MapCoord[0])
                (plane.posMapCoord[0] - state.map.glideSlopes[lastGSIX].p1[0])
                / state.map.mapUnitsPerMeter
            );

            console.log("👉 touch down");
            console.log(state.plane.touchdownStats);

        } else if (!isCrash && touchdownMS > bigBounceMin) {
            // small bounce off landing
            state.plane.verticalMS = Math.abs(state.plane.verticalMS) * 0.8;
            state.plane.posMapCoord[1] = state.map.rwP0MapCoord[1] + (state.plane.posMapCoord[1] - planeBottomMapCoordY);
            state.plane.touchdownStats.bounces++;
            console.log("👉 small bounce");
        } else {
            // big bounce off runway
            state.plane.verticalMS = Math.abs(state.plane.verticalMS);
            state.plane.posMapCoord[1] = state.map.rwP0MapCoord[1] + (state.plane.posMapCoord[1] - planeBottomMapCoordY);
            state.plane.touchdownStats.isRough = true;
            state.plane.touchdownStats.bounces++;
            console.log("👉 big bounce");
        }
        if (addRubberStrike) {
            state.map.tireStrikes.push({
                originMapPoint: deepCopy([
                    plane.posMapCoord[0],
                    planeBottomMapCoordY,
                ]),
                createdTS: performance.now(),
                shakeMeters: shakeSizeCurve(touchdownMS),
            });
        }
    }
    return state;
}

function adjustMapWindValues(state) {
    if(state.map.windMaxDeltaPerSecond === null){
        return state;
    }
    const fps = state.game.dataFPS;
    let delta;
    if(state.map.windXVel < state.map.windXTarg) {
        // Increase windMS to reach target.
        delta = Math.min(
            state.map.windXTarg - state.map.windXVel,
            getRandomFloat(
                state.map.windMaxDeltaPerSecond / 4,
                state.map.windMaxDeltaPerSecond
            ) / fps,
        );
        state.map.windXVel += delta
    }
    else if(state.map.windXVel > state.map.windXTarg) {
        // Decrease windMS to reach target.
        delta = Math.max(
            state.map.windXTarg - state.map.windXVel,
            getRandomFloat(
                -1 * state.map.windMaxDeltaPerSecond,
                -1 * state.map.windMaxDeltaPerSecond / 4,
            ) / fps,
        );
        state.map.windXVel += delta;
    }
    else {
        // Set new target
        state.map.windXTarg = getRandomFloat(
            state.map.windXMin,
            state.map.windXMax,
        );
    }
    return state;
}

function createCrashDebrisObjects(state) {
    const mupm = state.map.mapUnitsPerMeter;
    const count = getRandomInt(10, 21);
    const createdAt = performance.now();
    for(let i=0; i < count; i++) {
        window._debrisObjects.push({
            createdAt,
            lifespanMS: 2000,
            mapCoords: [
                state.plane.posMapCoord[0] + getRandomFloat(-3.5, 3.5) * mupm,
                state.plane.posMapCoord[1] + getRandomFloat(-3.5, 3.5) * mupm,
            ],
            radius: getRandomFloat(0.15, 0.5) * mupm,
            xVeloctyMS: Math.max(
                    3,
                    state.plane.horizontalMS * getRandomFloat(0.6, 2.5)
                ) * (Math.random() < 0.4 ? -1 : 1),
            yVelocityMS: state.plane.verticalMS * getRandomFloat(-2.5, 2.5),
        });
    }
}

function createAAFireDebrisObjects(state, mapCoord) {
    const mupm = state.map.mapUnitsPerMeter;
    const count = getRandomInt(8, 15);
    const createdAt = performance.now();
    for(let i=0; i < count; i++) {
        window._debrisObjects.push({
            createdAt,
            isAAFire: true,
            lifespanMS: 1000,
            mapCoords: [
                mapCoord[0] + getRandomFloat(-0.5, 0.5) * mupm,
                mapCoord[1] + getRandomFloat(-0.5, 0.5) * mupm,
            ],
            radius: getRandomFloat(0.14, 0.35) * mupm,
            xVeloctyMS: getRandomFloat(40, 60) * (Math.random() < 0.5 ? -1 : 1),
            yVelocityMS: getRandomFloat(40, 60) * (Math.random() < 0.5 ? -1 : 1),
        });
    }
}

function adjustDebrisPositions(state) {
    const fps = state.game.dataFPS;
    const mupm = state.map.mapUnitsPerMeter;
    const ixsToRemove = [];
    for(let i in window._debrisObjects) {
        if(state.game.lastFrameTS > window._debrisObjects[i].createdAt + window._debrisObjects[i].lifespanMS) {
            ixsToRemove.push(parseInt(i));
        } else {
            window._debrisObjects[i].mapCoords[0] += (window._debrisObjects[i].xVeloctyMS * mupm / fps);
            window._debrisObjects[i].mapCoords[1] += (window._debrisObjects[i].yVelocityMS * mupm / fps);
        }
    }
    if(ixsToRemove.length) {
        window._debrisObjects = window._debrisObjects.filter((_o, ix) => ixsToRemove.indexOf(ix) == -1);
    }
}
