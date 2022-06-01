
function createNewState(maxCompletedLevel) {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d")
    maxCompletedLevel = maxCompletedLevel || 0;
    const availableLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return {
        ctx,
        pageTitle: {
            text: "Select A Level",
            color: "#620080",
        },
        game: {
            phase: PHASE_0_LOBBY,
            maxCountDownFrames: 300,
            countDownFrames: 0,
            frame: 0,
            maxCompletedLevel,
            availableLevels,
            dataFPS: null,
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
        },
        map: {
            terrain: null,
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

    // process commands
    const nextCmd = window.nextCommand();
    if(nextCmd) {
        if(
            nextCmd.cmd === "start-level"
            && state.game.phase === PHASE_0_LOBBY
        ) {
            const level = nextCmd.args[0];
            state.game.phase = PHASE_1_COUNTDOWN;
            state.pageTitle = {
                text: "Get Ready!",
                color: "#620080",
            }
            state.buttons = [{
                type: BUTTON_TYPE_MAIN,
                text: "Cancel",
                boxCoord: null,
                handler: () => {
                    window.addCommand({
                        cmd: "quit",
                    });
                }
            }];
            console.log("count down!")
        }
        else if(nextCmd.cmd === "quit") {
            window.setGameState(
                createNewState(state.game.maxCompletedLevel)
            );
        }
    }

    // process count down
    if(state.game.phase === PHASE_1_COUNTDOWN) {
        state.game.countDownFrames++;
        if(state.game.countDownFrames >= state.game.maxCountDownFrames) {
            state.game.phase === PHASE_2_LIVE
            // Add control buttons here
        }
    }


    window.setGameState(state);
    setTimeout(runDataLoop);
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
            let [btn, wix] = gridBtns[i];

            let btnX1 = gridBtnCol0XOffset + (colPointer * gridBtnWidth) + gridBtnMargin * colPointer;
            let btnX2 = btnX1 + gridBtnWidth;
            let btnY1 = gridBtnRow0YOffset + (rowPointer * gridBtnHeight) + gridBtnMargin * rowPointer;
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

