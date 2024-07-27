document.addEventListener("readystatechange", () => {
    if (document.readyState != "interactive") {
        return;
    }
    /** @type {HTMLCanvasElement} */
    const cv = document.getElementById("cv");
    let width = 0;
    let height = 0;
    function adapt() {
        cv.width = width = cv.clientWidth;
        cv.height = height = cv.clientHeight;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(0, 0, width, height);
    }
    window.addEventListener("resize", adapt);
    adapt();
    const mag = 25;
    const dt = 1 / 80;
    let mx = 1;
    let my = 1;
    let x = 1;
    let y = 1;
    let z = 0;
    let t = 0;
    cv.addEventListener("mousemove", (event) => {
        mx = (event.layerX - 0.5 * width) / mag;
        my = (event.layerY - 0.5 * height) / mag;
    });
    function step() {
        /** @type {CanvasRenderingContext2D} */
        const ctx = cv.getContext("2d");
        if ((t & 0xF) == 0) {
            ctx.fillStyle = "rgb(0 0 0/0.03125)";
            ctx.fillRect(0, 0, width, height);
        }
        ctx.lineWidth = 3;
        if (z >= 10) {
            ctx.strokeStyle = "rgb(" + Math.min(20 * (z - 10), 255) + " 220 0/0.75)";
        } else {
            ctx.strokeStyle = "rgb(0 220 " + Math.min(20 * (10 - z), 255) + "/0.75)";
        }
        ctx.beginPath();
        ctx.moveTo(0.5 * width + mag * x, 0.5 * height + mag * y);
        for (let j = 0; j < 10; j++) {
            let r = Math.hypot(x - mx, my - y);
            r = 24 / (1 + r * r);
            let dx = 8 * (y - x) + r * (x - mx);
            let dy = x * (16 + 4 * Math.sin(t / 800)) - 0.25 * y - x * z + r * (y - my);
            let dz = x * y - 1.75 * z;
            x += dx * dt;
            y += dy * dt;
            z += dz * dt;
            t++;
            ctx.lineTo(0.5 * width + mag * x, 0.5 * height + mag * y);
        }
        ctx.stroke();
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
});