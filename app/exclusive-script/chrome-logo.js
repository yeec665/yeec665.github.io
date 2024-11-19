class ChromeLogo {
    static #EDGES = [
        ["#dc3327", "#ea4335"],
        ["#fcbe03", "#fbbc04"],
        ["#20903e", "#34a853"]
    ];
    static #FILL = "#2d7cee";
    static #STROKE = "#ffffff";
    constructor() {
        /** @type {number} */
        this.r = 1 / 3;
        /** @type {number} */
        this.a0 = -5 / 6 * Math.PI;
        /** @type {number} */
        this.a1 = -Math.PI;
        /** @type {HTMLCanvasElement} */
        this.canvas = document.createElement("canvas");
        this.canvas.style.aspectRatio = "1 / 1";
        /** @type {number} */
        this.r0;
        /** @type {CanvasRenderingContext2D} */
        this.context;
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
        document.body.append(this.canvas);
        this.canvas.addEventListener("dblclick", this.dblclick.bind(this));
        this.canvas.addEventListener("mousemove", this.mousemove.bind(this), {passive: true});
        this.canvas.addEventListener("wheel", this.wheel.bind(this), {passive: true});
    }
    resize() {
        const size = Math.max(1, Math.min(
            window.innerWidth,
            window.innerHeight
        ));
        this.canvas.width = size;
        this.canvas.height = size;
        this.r0 = 0.4875 * size;
        this.context = this.canvas.getContext("2d");
        this.paint();
    }
    /**
     * @param {MouseEvent} event
     */
    dblclick(event) {
        if (event.ctrlKey) {
            return;
        }
        event.preventDefault();
        if (this.task == null) {
            this.task = window.setInterval(() => {
                const a = Math.PI / 360;
                this.a0 += a;
                this.a1 += a;
                this.paint();
            }, 30);
        } else {
            window.clearInterval(this.task);
            this.task = null;
            this.mousemove(event);
        }
    }
    /**
     * @param {MouseEvent} event
     */
    mousemove(event) {
        if (event.ctrlKey || this.task != null) {
            return;
        }
        const x = event.offsetX - 0.5 * this.canvas.offsetWidth;
        const y = event.offsetY - 0.5 * this.canvas.offsetHeight;
        const r1 = Math.hypot(x, y);
        this.r = Math.max(0.1, Math.min(r1 / this.r0, 0.97));
        this.a1 = Math.atan2(y, x);
        this.paint();
    }
    /**
     * @param {WheelEvent} event
     */
    wheel(event) {
        this.a0 += Math.PI * event.deltaY / 720;
        this.paint();
    }
    paint() {
        this.clear();
        this.paintEdge();
        this.paintCenter();
    }
    clear() {
        const w = this.canvas.offsetWidth;
        const h = this.canvas.offsetHeight;
        this.context.resetTransform();
        this.context.clearRect(0, 0, w, h);
        this.context.setTransform(1, 0, 0, 1, 0.5 * w, 0.5 * h);
    }
    paintEdge() {
        const regions = ChromeLogo.#EDGES.length;
        const a = 2 * Math.PI / regions;
        const r0 = this.r0;
        const r1 = this.r * r0;
        let a0 = this.a0;
        let a1 = this.a1;
        let a2;
        for (let index = 0; index < regions; index++) {
            this.context.beginPath();
            this.context.moveTo(
                r1 * Math.cos(a1),
                r1 * Math.sin(a1)
            );
            a2 = a0 + a;
            const gradient = this.context.createLinearGradient(
                r0 * Math.cos(a0),
                r0 * Math.sin(a0),
                r0 * Math.cos(a2),
                r0 * Math.sin(a2)
            );
            this.context.arc(0, 0, r0, a0, a2, false);
            a1 += a;
            this.context.lineTo(
                r1 * Math.cos(a1),
                r1 * Math.sin(a1)
            );
            gradient.addColorStop(0, ChromeLogo.#EDGES[index][0]);
            gradient.addColorStop(1, ChromeLogo.#EDGES[index][1]);
            this.context.fillStyle = gradient;
            this.context.fill();
            a0 = a2;
        }
    }
    paintCenter() {
        this.context.lineWidth = 0.07 * this.r0;
        this.context.beginPath();
        this.context.arc(0, 0, this.r * this.r0, 0, 2 * Math.PI, false);
        this.context.fillStyle = ChromeLogo.#FILL;
        this.context.fill();
        this.context.arc(0, 0, (this.r - 0.07) * this.r0, 0, 2 * Math.PI, true);
        this.context.fillStyle = ChromeLogo.#STROKE;
        this.context.fill();
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        window.app = new ChromeLogo();
    }
});