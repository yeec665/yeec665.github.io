class CharacterOverlap {
    static STORAGE_KEY = "/app/shared-library/blender/character-overlap";
    static CONFIG = {
        textAlign: "center", // ["left", "right", "center", "start", "end"]
        textBaseline: "alphabetic" // ["top", "hanging", "middle", "alphabetic", "ideographic", "bottom"]
    };
    constructor() {
        /** @type {object} */
        let config = null;
        try {
            config = JSON.parse(localStorage.getItem(CharacterOverlap.STORAGE_KEY));
        } catch (e) {}
        if (config == null) {
            config = {};
        }
        for (const key in CharacterOverlap.CONFIG) {
            if ((typeof CharacterOverlap.CONFIG[key]) === (typeof config[key])) {
                this[key] = config[key];
            } else {
                this[key] = CharacterOverlap.CONFIG[key];
            }
        }
        window.addEventListener("pagehide", () => {
            localStorage.setItem(CharacterOverlap.STORAGE_KEY, JSON.stringify(this, Object.keys(CharacterOverlap.CONFIG)));
        });
        window.setTimeout(this.init.bind(this), 0);
    }
    init() {
        for (const id of ["canvas", "textarea", "attributePanel"]) {
            this[id] = document.getElementById(id);
        }
        this.textarea.value = "世有伯乐，然后有千里马。千里马常有，而伯乐不常有。\r\n故虽有名马，祗辱于奴隶人之手，骈死于槽枥之间，不以千里称也。";
        this.textarea.addEventListener("input", this.changeThrottle.bind(this));
        const boundCanvasResize = this.canvasResize.bind(this);
        (new ResizeObserver(boundCanvasResize)).observe(this.canvas);
        new Promise(boundCanvasResize);
    }
    /**
     * @param {function} resolve
     */
    canvasResize(resolve) {
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;
        this.canvas.setAttribute("width", this.canvasWidth);
        this.canvas.setAttribute("height", this.canvasHeight);
        this.context = this.canvas.getContext("2d");
        this.changeContent();
        if ((typeof resolve) === "function") {
            resolve();
        }
    }
    changeThrottle(event) {
        if (event != null && event.isComposing) {
            return;
        }
        if (this.due == null) {
            window.setTimeout(this.changeSchedule.bind(this), 1250);
        }
        this.due = Date.now() + 1250;
    }
    changeSchedule() {
        if (this.due == null) {
            return; // should not happen
        }
        const diff = this.due - Date.now();
        if (diff < 20) {
            this.due = null;
            this.changeContent();
        } else {
            window.setTimeout(this.changeSchedule.bind(this), diff);
        }
    }
    changeContent() {
        const ctx = this.context;
        if (ctx == null) {
            return;
        }
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        ctx.globalAlpha = 1.0;
        ctx.clearRect(0, 0, w, h);
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "white";
        ctx.font = "200px sans-serif";
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;
        const text = this.textarea.value;
        for (const ch of text) {
            // metrics = ctx.measureText(char);
            ctx.fillText(ch, 0.5 * w, 0.5 * h);
        }
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    Control.install();
    Split.install();
    window.app = new CharacterOverlap();
});