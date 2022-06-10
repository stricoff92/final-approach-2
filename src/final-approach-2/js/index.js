
function resizeCanvas(updateState) {
    const canvas = document.getElementById("game-canvas");
    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
    console.log({
        sw: canvas.scrollWidth,
        sh: canvas.scrollHeight,
    });
    console.log({
        EVENT: "Resizing Canvas",
        w: canvas.width,
        h: canvas.height,
        sw: canvas.scrollWidth,
        sh: canvas.scrollHeight,
    });

    let state;
    try {
        state = window.readGameState()
    } catch(err) {
        console.warn(err)
    }
    if(!state) {
        return;
    }
    console.log("camera state updated")
    window.setGameState(updateCameraCanvasMetaData(state))
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded");

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, false);

    const canvas = document.getElementById("game-canvas");
    if(urlContainsDebug()) {
        canvas.style.border = "1px solid #f00";
    }

    window.setGameState = function(gs) {
        window._gamestate = gs;
    }
    window.readGameState = function() {
        return window._gamestate;
    }

    window._cmd_queue = [];
    window.addCommand = cmd => {
        window._cmd_queue.push(cmd);
    }
    window.nextCommand = () => {
        return window._cmd_queue.shift();
    }

    window._click_queue = [];
    window.nextClick = () => {
        return window._click_queue.shift();
    }
    window.registerClick = data => {
        console.log(data);
        window._click_queue.push(data);
    }

    console.log("camera state updated")
    const state = updateCameraCanvasMetaData(createNewState());
    window.setGameState(state);

    // Register single & double clicks on the canvas.

    const singleClickDelayMS = 200;
    let lastSingleClickTS;
    let singleClickTimer;
    let diffBeteenClicks;
    canvas.addEventListener("click", event => {
        const nowTS = performance.now();
        if(!lastSingleClickTS) {
            lastSingleClickTS = nowTS;
            diffBeteenClicks = singleClickDelayMS + 1;
        } else {
            diffBeteenClicks = nowTS - lastSingleClickTS;
            lastSingleClickTS = nowTS;
        }
        if(diffBeteenClicks > singleClickDelayMS) {
            singleClickTimer = setTimeout(() => {
                let rect = canvas.getBoundingClientRect();
                let clickCanvasCoord = [
                    Math.round(event.clientX - rect.left),
                    Math.round(event.clientY - rect.top),
                ];
                window.registerClick({
                    clickCanvasCoord,
                    isDoubleClick: false,
                });
            }, singleClickDelayMS);
        } else {
            clearTimeout(singleClickTimer);
            const rect = canvas.getBoundingClientRect();
            const clickCanvasCoord = [
                Math.round(event.clientX - rect.left),
                Math.round(event.clientY - rect.top),
            ];
            window.registerClick({
                clickCanvasCoord,
                isDoubleClick: true,
            });
        }
    });

    window.addEventListener('keydown', event => {
        const key = event.key;
        const clickCanvasCoord = null;
        switch (true) {
            case event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === " ":
                window.registerClick({
                    clickCanvasCoord,
                    isDoubleClick: true,
                });
                break;
            case event.key === "ArrowRight" || event.key === "ArrowDown":
                window.registerClick({
                    clickCanvasCoord,
                    isDoubleClick: false,
                });
        }
    });

    setTimeout(runDataLoop);
    window.requestAnimationFrame(runDisplayLoop);

});
