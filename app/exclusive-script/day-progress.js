class DayProgress {
    static #MS_PER_DAY = 24 * 60 * 60 * 1000;
    static #MAX_CANVAS = 10800;
    static #CELL_W = 4;
    static #CELL_H = 4;
    static #BORDER_W = 1;
    static #BORDER_H = 1;
    static #BORDER = "#e4e4e4";
    static #EMPTY = "#f7f7f7";
    static #FILLED = "#2a8ce7";
    constructor() {
        /** @type {number} */
        this.offset = (() => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            return date.getTime() % DayProgress.#MS_PER_DAY;
        })();
        /** @type {HTMLCanvasElement} */
        this.canvas = document.createElement("canvas");
        this.canvas.addEventListener("click", this.click.bind(this));
        /** @type {CanvasRenderingContext2D} */
        this.context;
        /** @type {number} */
        this.task;
        /** @type {number} */
        this.xCount;
        /** @type {number} */
        this.yCount;
        /** @type {number} */
        this.xStart;
        /** @type {number} */
        this.yStart;
        /** @type {number} */
        this.filledCount;
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
        document.body.append(this.canvas);
    }
    /**
     * @return {number} 0.0 <= value < 1.0
     */
    percent() {
        return ((Date.now() - this.offset) % DayProgress.#MS_PER_DAY) / DayProgress.#MS_PER_DAY;
    }
    click() {
        console.warn("You can not stop the stream of time.");
    }
    resize() {
        if (this.task != null) {
            clearInterval(this.task);
        }
        const width = Math.min(DayProgress.#MAX_CANVAS, Math.floor(window.innerWidth));
        const height = Math.min(DayProgress.#MAX_CANVAS, Math.floor(window.innerHeight));
        this.canvas.setAttribute("width", width);
        this.canvas.setAttribute("height", height);
        const c = this.canvas.getContext("2d", {alpla: false});
        this.context = c;
        c.fillStyle = DayProgress.#BORDER;
        c.fillRect(0, 0, width, height);
        this.xCount = Math.floor((width - DayProgress.#BORDER_W) / (DayProgress.#CELL_W + DayProgress.#BORDER_W));
        this.yCount = Math.floor((height - DayProgress.#BORDER_H) / (DayProgress.#CELL_H + DayProgress.#BORDER_H));
        this.xStart = DayProgress.#BORDER_W + Math.floor(0.5 * (width - DayProgress.#BORDER_W - this.xCount * (DayProgress.#CELL_W + DayProgress.#BORDER_W)));
        this.yStart = DayProgress.#BORDER_H + Math.floor(0.5 * (height - DayProgress.#BORDER_H - this.yCount * (DayProgress.#CELL_H + DayProgress.#BORDER_H)));
        const totalCount = this.xCount * this.yCount;
        this.filledCount = Math.floor(this.percent() * totalCount);
        this.task = setInterval(this.tick.bind(this), Math.ceil(DayProgress.#MS_PER_DAY / totalCount));
        c.fillStyle = DayProgress.#FILLED;
        let i, x, y, xi, yi;
        i = -this.filledCount;
        y = this.yStart;
        for (yi = 0; yi < this.yCount; yi++) {
            x = this.xStart;
            for (xi = 0; xi < this.xCount; xi++) {
                if (i++ == 0) {
                    c.fillStyle = DayProgress.#EMPTY;
                }
                c.fillRect(x, y, DayProgress.#CELL_W, DayProgress.#CELL_H);
                x += DayProgress.#CELL_W + DayProgress.#BORDER_W;
            }
            y += DayProgress.#CELL_H + DayProgress.#BORDER_H;
        }
    }
    tick() {
        const c = this.context;
        const filledCount = Math.floor(this.percent() * this.xCount * this.yCount);
        for (let i = this.filledCount; i < filledCount; i++) {
            c.fillStyle = DayProgress.#FILLED;
            c.fillRect(
                this.xStart + (i % this.xCount) * (DayProgress.#CELL_W + DayProgress.#BORDER_W),
                this.yStart + Math.floor(i / this.xCount) * (DayProgress.#CELL_H + DayProgress.#BORDER_H),
                DayProgress.#CELL_W, DayProgress.#CELL_H
            );
        }
        this.filledCount = n;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState == "interactive") {
        window.app = new DayProgress();
    }
});