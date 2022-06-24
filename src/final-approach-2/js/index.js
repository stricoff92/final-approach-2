
function resizeCanvas(updateState) {
    const canvas = document.getElementById(CANVAS_ID);
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

    const canvas = document.getElementById(CANVAS_ID);
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


    const state = updateCameraCanvasMetaData(createNewState());
    console.log("camera state updated")
    window.setGameState(state);

    // Register single clicks on the canvas.
    canvas.addEventListener("click", event => {
        let rect = canvas.getBoundingClientRect();
        let clickCanvasCoord = [
            Math.round(event.clientX - rect.left),
            Math.round(event.clientY - rect.top),
        ];
        window.registerClick({
            clickCanvasCoord,
        });
    });

    window._fa2_isPaused = false;
    window.addEventListener('keydown', event => {
        const key = event.key;
        const clickCanvasCoord = null;
        switch (true) {
            case key === "ArrowLeft" || key === "ArrowUp" || key === " ":
                if(!window._fa2_isPaused) {
                    window.registerClick({
                        clickCanvasCoord,
                        isTopHalfOfScreenClick: true,
                    });
                } else {
                    if(key === "ArrowLeft") {
                        window._gamestate.plane.posMapCoord[0] -= (window._fa2_default_slew || 50);
                    } else if (key === "ArrowUp") {
                        window._gamestate.plane.posMapCoord[1] += (window._fa2_default_slew || 50);
                    }
                }
                break;
            case key === "ArrowRight" || key === "ArrowDown":
                if(!window._fa2_isPaused) {
                    window.registerClick({
                        clickCanvasCoord,
                        isTopHalfOfScreenClick: false,
                    });
                } else {
                    if(key === "ArrowRight") {
                        window._gamestate.plane.posMapCoord[0] += (window._fa2_default_slew || 50);
                    } else if (key === "ArrowDown") {
                        window._gamestate.plane.posMapCoord[1] -= (window._fa2_default_slew || 50);
                    }
                }
                break;
            case key === "p":
                window._fa2_isPaused = !!!window._fa2_isPaused;
        }
    });

    setTimeout(runDataLoop);
    window.requestAnimationFrame(runDisplayLoop);

});
