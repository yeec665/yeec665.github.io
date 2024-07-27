class Track {
    static colors = ["#eedce9", "#7a6163", "#fedf80", "#f88774", "#fffbf7", "#fad7b1", "#9d6c6a", "#6ac2c4", "#685b5f", "#ff5742", "#fb746e", "#f2e0de", "#dea598", "#fdd979", "#fdd979", "#f44c53", "#bce6ef", "#fdb88f", "#d0deee"];
    /**
     * @return {string}
     */
    static randomColor() {
        return Track.colors[Math.floor(Track.colors.length * Math.random())];
    }
    /**
     * @return {number}
     */
    static variation() {
        return 1 + 0.5 * (Math.random() - Math.random());
    }
    /**
     * @param {Layer} layer
     */
    constructor(layer) {
        /** @type {number} radius */
        this.r = layer.r * Track.variation();
        this.position0(layer);
        /** @type {number} speed */
        this.v = layer.v * Track.variation();
        this.timing0(layer);
    }
    /**
     * @param {Layer} layer
     */
    position0(layer) {
        let side1 = Math.floor(4 * Math.random());
        this.position1(layer, side1, "x1", "y1");
        let side2 = Math.floor(4 * Math.random());
        if (side2 == 0) {
            side2 = 2;
        }
        side2 = (side1 + side2) % 4;
        this.position1(layer, side2, "x2", "y2");
        this.l = Math.hypot(this.x1 - this.x2, this.y1 - this.y2);
    }
    /**
     * @param {Layer} layer
     * @param {number} side [0, 1, 2, 3]
     * @param {string} xKey ["x1", "x2"]
     * @param {string} yKey ["y1", "y2"]
     */
    position1(layer, side, xKey, yKey) {
        const r = this.r;
        const s = (Math.SQRT2 - 1) * r;
        switch (side) {
            default:
            case 0:
                this[xKey] = (layer.vw + 2 * s) * Math.random() - s;
                this[yKey] = -r;
                break;
            case 1:
                this[xKey] = layer.vw + r;
                this[yKey] = (layer.vh + 2 * s) * Math.random() - s;
                break;
            case 2:
                this[xKey] = (layer.vw + 2 * s) * Math.random() - s;
                this[yKey] = layer.vh + r;
                break;
            case 3:
                this[xKey] = -r;
                this[yKey] = (layer.vh + 2 * s) * Math.random() - s;
                break;
        }
    }
    /**
     * @param {Layer} layer
     */
    timing0(layer) {
        this.dt = this.l / this.v;
        this.vx = (this.x2 - this.x1) / this.dt;
        this.vy = (this.y2 - this.y1) / this.dt;
        this.maxT1 = +Infinity;
        this.minT1 = layer.t;
        for (const that of layer.list) {
            this.timing1(that);
        }
        if (layer.t < this.maxT1) {
            this.t1 = layer.t;
        } else {
            this.t1 = this.minT1;
        }
        this.t2 = this.t1 + this.dt;
    }
    /**
     * @param {Track} that
     */
    timing1(that) {
        this.timing2(that, 0, 0, -this.dt, 0);
        this.timing2(that, 0, that.dt, that.dt - this.dt, that.dt);
        this.timing2(that, 1, 0, 0, that.dt);
        this.timing2(that, 1, this.dt, -this.dt, that.dt - this.dt);
        const vx = this.vx - that.vx;
        const vy = this.vy - that.vy;
        const v = vx * vx + vy * vy;
        const p = (this.vx * vx + this.vy * vy) / v;
        const q = (vx * (that.x1 - this.x1) + vy * (that.y1 - this.y1)) / v;
        let minCt, maxCt;
        if (p < 0) {
            minCt = Math.max((that.dt - q) / p, (this.dt - q) / (p - 1));
            maxCt = Math.min(-q / p, -q / (p - 1));
        } else if (p > 1) {
            minCt = Math.max(-q / p, -q / (p - 1));
            maxCt = Math.min((that.dt - q) / p, (this.dt - q) / (p - 1));
        } else {
            minCt = Math.max(-q / p, (this.dt - q) / (p - 1));
            maxCt = Math.min((that.dt - q) / p, -q / (p - 1));
        }
        if (minCt < maxCt) {
            this.timing2(that, p, q, minCt, maxCt);
        }
    }
    /**
     * @param {Track} that
     * @param {number} p
     * @param {number} q
     * @param {number} minCt
     * @param {number} maxCt
     */
    timing2(that, p, q, minCt, maxCt) {
        this.timing3(
            that,
            that.vx * p - this.vx * (p - 1),
            that.x1 - this.x1 + (that.vx - this.vx) * q,
            that.vy * p - this.vy * (p - 1),
            that.y1 - this.y1 + (that.vy - this.vy) * q,
            minCt,
            maxCt
        );
    }
    timing3(that, ax, cx, ay, cy, minCt, maxCt) {
        const r = this.r + that.r;
        const a = ax * ax + ay * ay;
        const b = -(ax * cx + ay * cy);
        const c = cx * cx + cy * cy - r * r;
        const d = Math.sqrt(b * b - a * c);
        if (d > 0) {
            const ct1 = (b - d) / a;
            const ct2 = (b + d) / a;
            if (minCt <= ct1 && ct2 <= maxCt) {
                this.maxT1 = Math.min(this.maxT1, that.t1 + ct1);
                this.minT1 = Math.max(this.minT1, that.t1 + ct2);
            } else if (minCt <= ct1) {
                this.maxT1 = Math.min(this.maxT1, that.t1 + ct1);
                this.minT1 = Math.max(this.minT1, that.t2);
            } else if (ct2 <= maxCt) {
                this.maxT1 = Math.min(this.maxT1, that.t1 - this.dt);
                this.minT1 = Math.max(this.minT1, that.t1 + ct2);
            }
        }
    }
    create() {
        this.sr = Math.floor(this.r - 0.5);
        this.shape = document.createElement("div");
        this.shape.className = "circle";
        this.shape.style.backgroundColor = Track.randomColor();
        this.shape.style.width = 2 * this.sr + "px";
        this.shape.style.height = 2 * this.sr + "px";
        return this.shape;
    }
    prepare() {
        this.shape.style.transform = `translate(${this.x1 - this.sr}px,${this.y1 - this.sr}px)`;
        this.shape.style.transitionDuration = Math.floor(this.dt) + "ms";
    }
    start() {
        this.shape.style.visibility = "visible";
        this.shape.style.transform = `translate(${this.x2 - this.sr}px,${this.y2 - this.sr}px)`;
    }
    dispose() {
        if (this.shape != null && this.shape.parentNode != null) {
            this.shape.parentNode.removeChild(this.shape);
        }
    }
}
class Layer {
    static alphaNumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    static diacritics = "\u0300\u0301\u0302\u0303\u0307\u030a\u0311\u0316\u0317\u0323\u0353\u0363\u036b\u036c";
    static badge = {
        salesgirl: {
            name: "店员",
            description: "油腻的店员声线",
            color: "#aa7127"
        },
        homophone: {
            name: "谐音梗",
            description: "扣钱！",
            color: "#91271f"
        },
        "old-meme": {
            name: "老梗",
            description: "我出生前就存在的互联网，以及其上的梗",
            color: "#1b5504"
        },
        interactive: {
            name: "交互",
            description: "又叫突破第四面墙、元故事",
            color: "#0c3583"
        },
        spider: {
            name: "蜘蛛",
            description: "我家里有蜘蛛",
            color: "#574530"
        },
        metaphor: {
            name: "奇妙比喻",
            description: "就像微分流形一样美妙",
            color: "#581477"
        },
        "suggest-triple": {
            name: "暗示三连",
            description: "你是不是没硬币了？",
            color: "#465e63"
        }
    };
    /**
     * @return {string}
     */
    static generateDiacritics() {
        let text = Layer.alphaNumeric.charAt(Math.floor(Layer.alphaNumeric.length * Math.random()));    
        const diacritic = Layer.diacritics.charAt(Math.floor(Layer.diacritics.length * Math.random()));
        const repeat = Math.floor(25 * Math.random());
        for (let i = 0; i < repeat; i++) {
            text += diacritic;
        }
        return text;
    }
    /**
     * @param {number} r average radius
     * @param {number} v average speed (px per ms)
     */
    constructor(r, v) {
        /** @type {number} average radius */
        this.r = r;
        /** @type {number} average speed (px per ms) */
        this.v = v;
        /** @type {number} reset mark counter */
        this.g = 0;
        const doc = document;
        this.bodyBack = doc.getElementById("bodyBack");
        this.initLinks(doc);
        this.initTimes(doc);
        this.initDokidoki();
        const resetThis = this.reset.bind(this);
        doc.addEventListener("visibilitychange", resetThis);
        window.addEventListener("resize", resetThis);
        resetThis();
        this.initGradient(doc);
        window.setInterval(this.tick.bind(this), 8000);
    }
    /**
     * @param {Document} doc
     */
    initLinks(doc) {
        doc.querySelectorAll("a.bv").forEach(node => {
            node.setAttribute("href", "https://www.bilibili.com/video/" + node.textContent);
            node.setAttribute("target", "_blank");
            node.setAttribute("rel", "noreferrer");
            node.setAttribute("referrerpolicy", "no-referrer");
        });
    }
    /**
     * @param {Document} doc
     */
    initTimes(doc) {
        const now = Date.now();
        doc.querySelectorAll(".time").forEach(node => {
            const time = new Date(node.innerText);
            if (isNaN(time.getTime())) {
                return;
            }
            time.setHours(0);
            time.setMinutes(0);
            time.setSeconds(0);
            const diff = Math.floor((now - time.getTime()) / (24 * 60 * 60 * 1000));
            if (diff > 0) {
                node.title = diff + "天前";
            }
        });
    }
    /**
     * @param {Document} doc
     */
    initBadges(doc) {
        doc.querySelectorAll("ol>li").forEach(li => {
            const badgeClasses = li.dataset.badge;
            if (badgeClasses == null) {
                //
            }
            console.log(badgeClasses);
        });
    }
    /**
     * @param {Document} doc
     */
    initDokidoki(doc) {
        this.input = ""; // start to accept inputs
        window.addEventListener("keydown", event => {
            if (this.input != null && event.key.length == 1) {
                this.input += event.key.toLowerCase();
                if (this.input.endsWith("dokidoki")) {
                    this.input = null; // accept no more inputs
                    this.applyDokidoki(doc, "span");
                }
            }
        });
    }
    /**
     * @param {Document} doc
     * @param {string} selector
     */
    applyDokidoki(doc, selector) {
        doc.querySelectorAll(selector).forEach(node => {
            const length = node.innerText.length;
            let text = "";
            for (let i = 0; i < length; i++) {
                if (Math.random() < 0.2) {
                    text += Layer.generateDiacritics();
                } else {
                    text += String.fromCharCode(Math.floor(0x4e00 + (0x9ff0 - 0x4e00) * Math.random()));
                }
            }
            node.innerText = text;
        });
    }
    reset() {
        this.list = [];
        this.g++;
        this.bodyBack.innerHTML = "";
        this.base = Date.now();
        this.vw = document.body.clientWidth;
        this.vh = document.body.clientHeight;
        window.setTimeout(this.start.bind(this), 0);
    }
    start() {
        this.t = Date.now() - this.base;
        for (let i = 0; i < 8; i++) {
            this.create();
        }
    }
    tick() {
        if (document.visibilityState != "visible") {
            return;
        }
        this.t = Date.now() - this.base;
        this.list = this.list.filter(track => {
            if (track.t2 > this.t) {
                return true;
            } else {
                track.dispose();
                return false;
            }
        });
        for (let i = 0; i < 4; i++) {
            if (this.list.length >= 20) {
                return;
            }
            this.create();
        }
    }
    create() {
        const newTrack = this.earlier(
            this.earlier(new Track(this), new Track(this)),
            this.earlier(new Track(this), new Track(this))
        );
        this.list.push(newTrack);
        this.bodyBack.appendChild(newTrack.create());
        newTrack.prepare();
        const g = this.g;
        window.setTimeout(() => {
            if (g != this.g) {
                return;
            }
            newTrack.start();
        }, Math.max(0, newTrack.t1 - this.t));
    }
    earlier(a, b) {
        if (a.t1 < b.t1) {
            return a;
        } else {
            return b;
        }
    }
    initGradient(doc) {
        doc.body.addEventListener("mousemove", event => {
            const percent = (event.pageX / this.vw) + (event.pageY / this.vh) - 1;
            if (isNaN(percent)) {
                return;
            }
            doc.getElementById("gradientStop1").setAttribute("offset", (42 + percent * 20) + "%");
            doc.getElementById("gradientStop2").setAttribute("offset", (42.5 + percent * 20) + "%");
            doc.getElementById("gradientStop3").setAttribute("offset", (72.5 + percent * 20) + "%");
            doc.getElementById("gradientStop4").setAttribute("offset", (73 + percent * 20) + "%");
        });
    }
}
window.addEventListener("load", () => {
    window.app = new Layer(80, 0.1);
});