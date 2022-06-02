
function createNewState(maxCompletedLevel) {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d")
    maxCompletedLevel = maxCompletedLevel || 0;
    const availableLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return {
        ctx,
        pageTitle: {
            text: "Select A Level",
            color: COLOR_PURPLE,
        },
        game: {
            phase: PHASE_0_LOBBY,
            maxCountDownFrames: 220,
            countDownFrames: 0,
            frame: 0,
            maxCompletedLevel,
            availableLevels,
            dataFPS: null,
            level: null,
            lastFrameTS: performance.now(),
        },
        camera: {
            canvasW: null,
            canvasH: null,
            canvasHalfW: null,
            canvasHalfH: null,
        },
        plane: {
            asset: null,
            xVelMS: null,
            yVelMS: null,
            massKG: null,
            posMapCoord: null,
            attitude: null,
            thrust: null,
            maxTouchdownSpeedMS: null,
            adjustPlanePosition: (state) => {},
            previousPoints: [],
            crashFrame: 0,
            touchedDown: false,
            rwNegAccelerationMS: null,

        },
        map: {
            terrain: null,
            mapUnitsPerMeter: null,
            windXVel: null,
            windVolitility: null,
            windXMin: null,
            windXMax: null,
            windXTarg: null,
            rwP0MapCoord: null,
            rwP1MapCoord: null,
            gsP0MapCoord: null,
            gsP1MapCoord: null,
        },
        buttons: availableLevels.map(levelNumber => {
            const btn = {
                type: BUTTON_TYPE_GRID,
                text: `Level ${levelNumber}`,
                boxCoord: null,
                disabled: levelNumber >= (maxCompletedLevel + 1),
                handler: () => {
                    window.addCommand({
                        cmd: "start-level",
                        args: [ levelNumber ],
                    });
                }
            };
            return btn;
        }),
    }
}

function orientButtons(state) {
    const gridBtns = [];
    state.buttons.forEach((btn, wix) => {
        if(btn.type === BUTTON_TYPE_GRID) {
            gridBtns.push([btn, wix])
        }
    });

    if(gridBtns.length) {
        const gridBtnMargin = 4;
        const gridBtnWidth = 125;
        const gridBtnHeight = 40;
        const gridBtnCol0XOffset = state.camera.canvasHalfW - (gridBtnWidth + gridBtnMargin)// 30;
        const gridBtnRow0YOffset = 70;
        let rowPointer = 0;
        let colPointer = 0;
        const gridMaxRows = Math.min(5, Math.floor(
            state.camera.canvasH - (gridBtnRow0YOffset * 2) / gridBtnHeight
        ));

        for(let i=0; i< gridBtns.length; i++) {
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

    return state;
}


function runDataLoop() {
    let state = window.readGameState();

    // Calculate FPS
    const nowTS = performance.now();
    const lastFrameTS = state.game.lastFrameTS;
    const diff = nowTS - lastFrameTS;
    const fps = 1000 / diff;
    state.game.lastFrameTS = nowTS;
    state.game.dataFPS = fps;

    // Increment Frame number
    if(state.game.phase === PHASE_2_LIVE) {
        state.game.frame++;
        if(state.game.frame % 500 === 0) {
            console.log({ state });
        }
    }

    // Position buttons and check for clicks
    state = orientButtons(state);
    const clickCanvasCoord = window.nextClick();
    if(clickCanvasCoord) {
        for(let i = 0; i < state.buttons.length; i++) {
            let clickInside = coordInsideBoxCoord(
                clickCanvasCoord,
                state.buttons[i].boxCoord,
            )
            if (clickInside) {
                state.buttons[i].handler();
                break;
            }
        }
    }

    if(state.game.phase === PHASE_2_LIVE) {
        let commands = [];
        while(true) {
            let cmd = window.nextCommand()
            if(cmd) {
                commands.push(cmd);
            } else {
                break;
            }
        }
        if(!state.plane.crashFrame) {
            const cmdCt = commands.length;
            for(let i=0; i<cmdCt; i++) {
                let cmd = commands[i];
                if(cmd.cmd === "quit-level") {
                    window.setGameState(
                        createNewState(state.game.maxCompletedLevel)
                    );
                    setTimeout(runDataLoop);
                    return;
                }
                else if(cmd.cmd === "set-attitude") {
                    state.plane.attitude = cmd.args[0];
                }
                else if(cmd.cmd === "set-thrust") {
                    state.plane.thrust = cmd.args[0];
                }
            }
        }
        else if(state.plane.crashFrame) {
            state.plane.crashFrame++;
            if(state.plane.crashFrame > 200) {
                // Score screen
            }
        }
        else if(state.plane.touchedDown) {
            const overRunway = Boolean(
                state.plane.posMapCoord[0] >= state.map.rwP0MapCoord[0]
                && state.plane.posMapCoord[0] <= state.map.rwP1MapCoord[0]
            )
            if(!overRunway) {
                state.plane.crashFrame = 1;
            } else {
                const frameDeltaX = state.plane.rwNegAccelerationMS / state.game.dataFPS;
                state.plane.xVelMS -= frameDeltaX;
                if(Math.abs(state.plane.xVelMS) < 3.5) {
                    state.plane.xVelMS = 0;
                }
            }
        }
        else {
            state = state.plane.adjustPlanePosition(state);
        }
        if(state.game.frame % 70 === 0) {
            state.plane.previousPoints.push(
                [state.plane.posMapCoord, state.plane.thrust]
            );
            state.plane.previousPoints = state.plane.previousPoints.slice(0, 50);
        }

        state = checkForGroundContact(state)

        window.setGameState(state);
        setTimeout(runDataLoop);
        return;

    }

    // process commands
    const nextCmd = window.nextCommand();
    if(nextCmd) {
        if(
            nextCmd.cmd === "start-level"
            && state.game.phase === PHASE_0_LOBBY
        ) {
            state.game.phase = PHASE_1_COUNTDOWN;
            state.game.level = nextCmd.args[0];
            state.pageTitle = {
                text: "Get Ready!",
                color: COLOR_PURPLE,
            }
            state.buttons = [];
        }
    }

    // process count down
    if(state.game.phase === PHASE_1_COUNTDOWN) {
        state.game.countDownFrames++;
        if(state.game.countDownFrames >= state.game.maxCountDownFrames) {
            state.pageTitle = null;
            state.game.phase = PHASE_2_LIVE,
            state.buttons = [{
                type: BUTTON_TYPE_MAIN,
                boxCoord: null,
                text: 'QUIT',
                handler: () => {
                    window.addCommand({
                        cmd: "quit-level",
                    });
                },
            }, {
                type: BUTTON_TYPE_CTRL,
                boxCoord: null,
                assetHref: "css/c152-2.svg",
                selected: (state.plane.attitude === ATTITUDE_2) && state.plane.thrust,
                handler: () => {
                    window.addCommand({
                        cmd: "set-attitude",
                        args: [ 2 ],
                    });
                    window.addCommand({
                        cmd: "set-thrust",
                        args: [ true ],
                    });
                },
            }, {
                type: BUTTON_TYPE_CTRL,
                boxCoord: null,
                assetHref: "css/c152-2.svg",
                selected: (state.plane.attitude === ATTITUDE_2) && !state.plane.thrust,
                handler: () => {
                    window.addCommand({
                        cmd: "set-attitude",
                        args: [ 2 ],
                    });
                    window.addCommand({
                        cmd: "set-thrust",
                        args: [ false ],
                    });
                },
            }, {
                type: BUTTON_TYPE_CTRL,
                boxCoord: null,
                assetHref: "css/c152-1.svg",
                selected: (state.plane.attitude === ATTITUDE_1) && !state.plane.thrust,
                handler: () => {
                    window.addCommand({
                        cmd: "set-attitude",
                        args: [ 1 ],
                    });
                    window.addCommand({
                        cmd: "set-thrust",
                        args: [ false ],
                    });
                },
            }, {
                type: BUTTON_TYPE_CTRL,
                boxCoord: null,
                assetHref: "css/c152-0.svg",
                selected: (state.plane.attitude === ATTITUDE_0) && !state.plane.thrust,
                handler: () => {
                    window.addCommand({
                        cmd: "set-attitude",
                        args: [ 0 ],
                    });
                    window.addCommand({
                        cmd: "set-thrust",
                        args: [ false ],
                    });
                },
            }];
            state = setPlaneProps(state);
            state = setMapProps(state);
        }
    }


    window.setGameState(state);
    setTimeout(runDataLoop);
}


function checkForGroundContact(state) {

    const overRunway = Boolean(
        state.plane.posMapCoord[0] >= state.map.rwP0MapCoord[0]
        && state.plane.posMapCoord[0] <= state.map.rwP1MapCoord[0]
    );
    const touchingRunway = Boolean(
        overRunway
        && state.plane.posMapCoord[1] <= state.map.rwP0MapCoord[1]
    );
    if(touchingRunway) {
        const touchdownSpeedMS = state.plane.yVelMS;
        if (
            touchdownSpeedMS > state.plane.maxTouchdownSpeedMS
            || state.plane.attitude === ATTITUDE_0
        ) {
            state.plane.crashFrame = 1;
        }
        else if(touchdownSpeedMS <= (state.plane.maxTouchdownSpeedMS / 4)) {
            state.plane.touchedDown = true;
            state.plane.yVelMS = 0;
            state.plane.posMapCoord[1] = state.map.rwP0MapCoord[1];

        } else if (touchdownSpeedMS > (state.plane.maxTouchdownSpeedMS * 0.75)) {
            state.plane.yVelMS = Math.abs(state.plane.yVelMS) * 1.5;
            if(state.plane.posMapCoord[1] < state.map.rwP0MapCoord[1]) {
                state.plane.posMapCoord[1] += ((
                    state.map.rwP0MapCoord[1] - state.plane.posMapCoord[1]
                ) * 2);
            }

        } else {
            state.plane.yVelMS = Math.abs(state.plane.yVelMS);
            if(state.plane.posMapCoord[1] < state.map.rwP0MapCoord[1]) {
                state.plane.posMapCoord[1] += ((
                    state.map.rwP0MapCoord[1] - state.plane.posMapCoord[1]
                ) * 2);
            }
        }
    }

    return state;
}

