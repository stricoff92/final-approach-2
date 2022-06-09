

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

    let singleClickTimers = [];
    const singleClickDelayMS = 250;
    const canvas = document.getElementById("game-canvas");
    canvas.addEventListener("click", event => {
        const t = setTimeout(() => {
            singleClickTimers = [];
            const rect = canvas.getBoundingClientRect();
            const clickCanvasCoord = [
                Math.round(event.clientX - rect.left),
                Math.round(event.clientY - rect.top),
            ];
            window.registerClick({
                clickCanvasCoord,
                isDoubleClick: false,
            });
        }, singleClickDelayMS);
        singleClickTimers.push(t);
    });
    canvas.addEventListener('dblclick', event => {
        singleClickTimers.forEach(t => { clearTimeout(t) });
        singleClickTimers = [];

        const rect = canvas.getBoundingClientRect();
        const clickCanvasCoord = [
            Math.round(event.clientX - rect.left),
            Math.round(event.clientY - rect.top),
        ];
        window.registerClick({
            clickCanvasCoord,
            isDoubleClick: true,
        });
    });

    setTimeout(runDataLoop);
    window.requestAnimationFrame(runDisplayLoop);



});