

function resizeCanvas() {
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
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded");

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, false);

});