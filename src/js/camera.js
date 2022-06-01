

function runDisplayLoop() {

    const state = window.readGameState();
    clearCanvas(state);

    drawButtons(state);


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
        state.ctx.fillStyle = "#000";
        state.ctx.rect(...rectArgs);
        state.ctx.fill();

        state.ctx.beginPath();
        state.ctx.font = "28px Arial";
        state.ctx.fillStyle = "#fff";
        state.ctx.textBaseline = "middle";
        state.ctx.textAlign = "center";
        state.ctx.fillText(
            btn.text,
            rectArgs[0] + Math.floor(rectArgs[2] / 2),
            rectArgs[1] + Math.floor(rectArgs[3] / 2),
        );
    });
}
