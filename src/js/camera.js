

function runDisplayLoop() {

    const state = window.readGameState();
    clearCanvas(state);

    drawPageTitle(state);
    drawButtons(state);
    if(state.game.phase === PHASE_1_COUNTDOWN) {
        drawLoadingIcon(state);
    }

    window.requestAnimationFrame(runDisplayLoop)
}

function clearCanvas(state) {
    state.ctx.clearRect(0, 0, state.camera.canvasW * 2, state.camera.canvasH * 2)
}

function drawButtons(state) {
    state.buttons.forEach(btn => {
        if(btn.boxCoord === null) {
            return;
        }
        const rectArgs = boxCoordToRectArgs(btn.boxCoord)
        state.ctx.beginPath();
        state.ctx.fillStyle = btn.backgroundColor || "#000";
        state.ctx.rect(...rectArgs);
        state.ctx.fill();

        state.ctx.beginPath();
        state.ctx.font = btn.font || "28px Arial";
        state.ctx.fillStyle = btn.textColor || "#fff";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "center";
        state.ctx.fillText(
            btn.text,
            rectArgs[0] + Math.floor(rectArgs[2] / 2),
            rectArgs[1] + Math.floor(rectArgs[3] / 2),
        );
    });
}

function drawPageTitle(state) {
    if(state.pageTitle) {
        state.ctx.beginPath();
        state.ctx.fillStyle = state.pageTitle.color;
        state.ctx.font = "bold 38px Arial";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "center";
        state.ctx.fillText(
            state.pageTitle.text,
            state.camera.canvasHalfW,
            30,
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
