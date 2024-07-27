class Utility {
    static HINT_KEY = "title";
    static collect(self, ids, doc = document) {
        let id, node;
        for (id of ids) {
            node = doc.getElementById(id);
            if (node != null) {
                self[id] = node;
            } else {
                console.warn(`Utility.collect(${id})`);
            }
        }
    }
    static element(tagName, id, className, text) {
        const element = document.createElement(tagName);
        if (id != null) {
            element.id = id;
        }
        if (className != null) {
            element.className = className;
        }
        if (text != null) {
            element.innerText = text;
        }
        return element;
    }
    static contain(className, ...contents) {
        const div = document.createElement("div");
        if (className != null) {
            div.className = className;
        }
        for (const item of contents) {
            div.appendChild(item);
        }
        return div;
    }
    static div(className, text, hint, click) {
        const div = document.createElement("div");
        if (className != null) {
            div.className = className;
        }
        if (text != null) {
            div.innerText = text;
        }
        if (hint != null) {
            div.setAttribute(Utility.HINT_KEY, hint);
        }
        if (click != null) {
            div.addEventListener("click", click);
        }
        return div;
    }
    static row(...contents) {
        const doc = document;
        const tr = doc.createElement("tr");
        for (const item of contents) {
            if (item instanceof HTMLElement) {
                if (item.tagName == "TD") {
                    tr.appendChild(item);
                } else {
                    const td = doc.createElement("td");
                    td.appendChild(item);
                    tr.appendChild(td);
                }
            } else {
                tr.appendChild(Utility.element("td", null, null, item));
            }
        }
        return tr;
    }
    static li(tagName, ...contents) {
        const doc = document;
        const tag = doc.createElement(tagName);
        for (const item of contents) {
            if (item instanceof HTMLElement) {
                if (item.tagName == "LI") {
                    tag.appendChild(item);
                } else {
                    const li = doc.createElement("li");
                    li.appendChild(item);
                    tag.appendChild(li);
                }
            } else {
                tag.appendChild(Utility.element("li", null, null, item));
            }
        }
        return tag;
    }
    static txt(text) {
        return document.createTextNode(text);
    }
    static NS = "http://www.w3.org/2000/svg";
    static svg(tagName, className) {
        const element = document.createElementNS(Utility.NS, tagName || "svg");
        if (className != null) {
            element.className = className;
        }
        return element;
    }
    static hasClass(node, className) {
        return node != null && "classList" in node && node.classList.contains(className);
    }
}
class Color {
    static hex2(x) {
        return (0xf & (x >> 4)) == (0xf & x);
    }
    static clamp(x) {
        return Math.max(0x00, Math.min(Math.round(x), 0xff));
    }
    static fix(x) {
        if (x <= 0) {
            return "0";
        } else if (x >= 0xff) {
            return "1";
        }
        return (x / 0xff).toFixed(4);
    }
    #r; #g; #b; #a; // from 0x00 to 0xff
    #mute;
    #listeners;
    constructor(color) {
        /** @type {boolean} */
        this.#mute = false;
        /** @type {function[]} */
        this.#listeners = null;
        if (!this.setColorValue(color)) {
            this.setRGBA(0xcc00aaff);
            this.valueOf = this.getRGBA;
        }
    }
    set color(value) {
        this.setColorValue(value);
    }
    get color() {
        return this.valueOf();
    }
    setRGBA(value) {
        value = Number(value);
        if (Number.isNaN(value)) {
            return false;
        } else {
            value &= 0xffffffff;
        }
        this.#r = 0xff & (value >> 24);
        this.#g = 0xff & (value >> 16);
        this.#b = 0xff & (value >> 8);
        this.#a = 0xff & value;
        this.fire();
        return true;
    }
    getRGBA() {
        return (this.#r << 24) | (this.#g << 16) | (this.#b << 8) | this.#a;
    }
    setARGB(value) {
        value = Number(value);
        if (Number.isNaN(value)) {
            return false;
        } else {
            value &= 0xffffffff;
        }
        this.#a = 0xff & (value >> 24);
        this.#r = 0xff & (value >> 16);
        this.#g = 0xff & (value >> 8);
        this.#b = 0xff & value;
        this.fire();
        return true;
    }
    getARGB() {
        return (this.#a << 24) | (this.#r << 16) | (this.#g << 8) | this.#b;
    }
    setPoundHex(string, opaque) {
        string = String(string).substring(1);
        let value = parseInt(string, 16);
        if (Number.isNaN(value)) {
            return false;
        }
        switch (string.length) {
            case 1:
                value |= value << 4;
                // no break here
            case 2:
                value = (value << 24) | (value << 16) | (value << 8) | 0xff;
                break;
            case 3:
                value = ((value & 0xf00) << 8) | ((value & 0x0f0) << 4) | (value & 0x00f);
                value = (value << 12) | (value << 8) | 0xff;
                break;
            case 4:
                value = ((value & 0xf000) << 12) | ((value & 0x0f00) << 8) | ((value & 0x00f0) << 4) | (value & 0x000f);
                value |= value << 4;
                break;
            case 6:
                value = (value << 8) | 0xff;
                break;
            case 8:
                break;
            default:
                return false;
        }
        if (opaque) {
            value |= 0xff;
        }
        this.setRGBA(value);
        return true;
    }
    getPoundHex(simplify = 1, opaque) {
        let a = this.#a;
        if (opaque) {
            a = 0xff;
        }
        if (simplify > 0 && a == 0xff) {
            if (simplify > 1 && Color.hex2(this.#r) && Color.hex2(this.#g) && Color.hex2(this.#b)) {
                return "#" + (0x1000 | ((0xf & this.#r) << 8) | ((0xf & this.#g) << 4) | (0xf & this.#b)).toString(16).substring(1);
            } else {
                return "#" + (0x1000000 | (this.#r << 16) | (this.#g << 8) | this.#b).toString(16).substring(1);
            }
        } else {
            if (simplify > 1 && Color.hex2(this.#r) && Color.hex2(this.#g) && Color.hex2(this.#b) && Color.hex2(a)) {
                return "#" + (0x10000 | ((0xf & this.#r) << 12) | ((0xf & this.#g) << 8) | ((0xf & this.#b) << 4) | (0xf & a)).toString(16).substring(1);
            } else {
                return "#" + (0x10000 | (this.#r << 8) | this.#g).toString(16).substring(1) + (0x10000 | (this.#b << 8) | a).toString(16).substring(1);
            }
        }
    }
    setFunctional(string) {
        const left = string.indexOf('(');
        const right = string.indexOf(')');
        if (0 < left && left < right) {
            string = string.substring(left + 1, right);
            const array = string.split(",");
            const length = array.length;
            if (length != 3 && length != 4) {
                return false;
            }
            let index, item;
            for (index = 0; index < length; index++) {
                item = array[index].trim();
                if (item.endsWith('%')) {
                    item = Color.clamp(100 * parseFloat(item.substring(0, item.length - 1)));
                } else if (index < 3) {
                    item = Color.clamp(parseFloat(item));
                } else {
                    item = Color.clamp(0xff * parseFloat(item));
                }
                if (!isFinite(item)) {
                    return false;
                }
                array[index] = item;
            }
            this.#r = array[0];
            this.#g = array[1];
            this.#b = array[2];
            if (length == 4) {
                this.#a = array[3];
            }
            this.fire();
            return true;
        }
        return false;
    }
    getFunctional() {
        if (this.#a == 0xff) {
            return `rgb(${this.#r}, ${this.#g}, ${this.#b})`;
        } else {
            return `rgba(${this.#r}, ${this.#g}, ${this.#b}, ${Color.fix(this.#a)})`;
        }
    }
    setVector3(string) {
        // TODO
        this.fire();
        return true;
    }
    getVector3() {
        return `vec3(${Color.fix(this.#r)}, ${Color.fix(this.#g)}, ${Color.fix(this.#b)})`;
    }
    setVector4(string) {
        // TODO
        this.fire();
        return true;
    }
    getVector4() {
        return `vec4(${Color.fix(this.#r)}, ${Color.fix(this.#g)}, ${Color.fix(this.#b)}, ${Color.fix(this.#a)})`;
    }
    setColorConstructor(string) {
        // TODO
        this.fire();
        return true;
    }
    getColorConstructor() {
        if (this.#a == 0xff) {
            return `Color(${this.#r}, ${this.#g}, ${this.#b})`;
        } else {
            return `Color(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`;
        }
    }
    setArray3(array) {
        this.#r = 0xff & array[0];
        this.#g = 0xff & array[1];
        this.#b = 0xff & array[2];
        this.fire();
        return true;
    }
    getArray3() {
        return [this.#r, this.#g, this.#b];
    }
    setArray4(array) {
        this.#r = 0xff & array[0];
        this.#g = 0xff & array[1];
        this.#b = 0xff & array[2];
        this.#a = 0xff & array[3];
        this.fire();
        return true;
    }
    getArray4() {
        return [this.#r, this.#g, this.#b, this.#a];
    }
    setColor(that) {
        this.#r = 0xff & that.r;
        this.#g = 0xff & that.g;
        this.#b = 0xff & that.b;
        this.#a = 0xff & that.a;
        this.fire();
        return true;
    }
    getColor() {
        return this;
    }
    setColorValue(value) {
        switch (typeof value) {
            case "number":
                if (this.setRGBA(value)) {
                    this.valueOf = this.getRGBA;
                    return true;
                }
                break;
            case "string":
                if (value.startsWith("#")) {
                    if (this.setPoundHex(value)) {
                        this.valueOf = this.getPoundHex;
                        return true;
                    }
                } else if (value.startsWith("rgb")) {
                    if (this.setFunctional(value)) {
                        this.valueOf = this.getFunctional;
                        return true;
                    }
                } else if (value.startsWith("Color")) {
                    if (this.setColorConstructor(value)) {
                        this.valueOf = this.getColorConstructor;
                        return true;
                    }
                } else if (value.startsWith("vec3")) {
                    if (this.setVector3(value)) {
                        this.valueOf = this.getVector3;
                        return true;
                    }
                } else if (value.startsWith("vec4")) {
                    if (this.setVector4(value)) {
                        this.valueOf = this.getVector4;
                        return true;
                    }
                }
                break;
            case "object":
                if (value instanceof Array) {
                    if (value.length == 3) {
                        this.setArray3(value);
                        this.valueOf = this.getArray3;
                        return true;
                    } else if (value.length == 4) {
                        this.setArray4(value);
                        this.valueOf = this.getArray4;
                        return true;
                    }
                } else if (value instanceof Color) {
                    this.setColor(value);
                    this.valueOf = this.getColor;
                    return true;
                }
                break;
        }
        return false;
    }
    setHueSaturationValue(hue, saturation, value) {
        const max = Color.clamp(0xff * value);
        if (Number.isNaN(max)) {
            return false;
        } else if (max == 0) {
            this.#r = 0;
            this.#g = 0;
            this.#b = 0;
            this.fire();
            return true;
        }
        const min = Color.clamp(0xff * value * (1 - saturation));
        if (Number.isNaN(min)) {
            return false;
        } else if (min >= max) {
            this.#r = max;
            this.#g = max;
            this.#b = max;
            this.fire();
            return true;
        }
        hue = Number(hue) % 1;
        if (Number.isNaN(hue)) {
            return false;
        } else if (hue < 0) {
            hue += 1;
        }
        hue *= 6;
        const mid = max - (max - min) * Math.abs(hue % 2 - 1);
        switch (Math.floor(hue)) {
            case 0:
                this.#r = Color.clamp(max);
                this.#g = Color.clamp(mid);
                this.#b = Color.clamp(min);
                break;
            case 1:
                this.#r = Color.clamp(mid);
                this.#g = Color.clamp(max);
                this.#b = Color.clamp(min);
                break;
            case 2:
                this.#r = Color.clamp(min);
                this.#g = Color.clamp(max);
                this.#b = Color.clamp(mid);
                break;
            case 3:
                this.#r = Color.clamp(min);
                this.#g = Color.clamp(mid);
                this.#b = Color.clamp(max);
                break;
            case 4:
                this.#r = Color.clamp(mid);
                this.#g = Color.clamp(min);
                this.#b = Color.clamp(max);
                break;
            case 5:
                this.#r = Color.clamp(max);
                this.#g = Color.clamp(min);
                this.#b = Color.clamp(mid);
                break;
            default:
                return false;
        }
        this.fire();
        return true;
    }
    set r(x) {
        this.#r = 0xff & x;
        this.fire();
    }
    get r() {
        return this.#r;
    }
    set g(x) {
        this.#r = 0xff & x;
        this.fire();
    }
    get g() {
        return this.#g;
    }
    set b(x) {
        this.#r = 0xff & x;
        this.fire();
    }
    get b() {
        return this.#b;
    }
    set a(x) {
        this.#a = x;
        this.fire();
    }
    get a() {
        return this.#a;
    }
    set y(x) {
        x -= this.y;
        this.add(x, x, x);
    }
    get y() {
        return 0.299 * this.#r + 0.587 * this.#g + 0.114 * this.#b;
    }
    set u(x) {
        x -= this.u;
        this.add(0, -0.39465 * x, 2.03211 * x);
    }
    get u() {
        return -0.14713 * this.#r + -0.28886 * this.g + 0.436 * this.#b;
    }
    set v(x) {
        x -= this.v;
        this.add(1.13983 * x, -0.58060 * x, 0);
    }
    get v() {
        return 0.615 * this.#r + -0.51409 * this.#g + -0.10001 * this.#b;
    }
    set red(x) {
        x *= 0xff;
        if (Number.isNaN(x)) {
            return;
        }
        this.#r = Color.clamp(x);
        this.fire();
    }
    get red() {
        return this.#r / 0xff;
    }
    set green(x) {
        x *= 0xff;
        if (Number.isNaN(x)) {
            return;
        }
        this.#g = Color.clamp(x);
        this.fire();
    }
    get green() {
        return this.#g / 0xff;
    }
    set blue(x) {
        x *= 0xff;
        if (Number.isNaN(x)) {
            return;
        }
        this.#b = Color.clamp(x);
        this.fire();
    }
    get blue() {
        return this.#b / 0xff;
    }
    set alpha(x) {
        x *= 0xff;
        if (Number.isNaN(x)) {
            return;
        }
        this.#a = Color.clamp(x);
        this.fire();
    }
    get alpha() {
        return this.#a / 0xff;
    }
    set hue(x) {
        x = Number(x) % 1;
        if (Number.isNaN(x)) {
            return false;
        } else if (x < 0) {
            x += 1;
        }
        x *= 6;
        const max = Math.max(this.#r, this.#g, this.#b);
        if (max == 0) {
            return false;
        }
        const min = Math.min(this.#r, this.#g, this.#b);
        const mid = max - (max - min) * Math.abs(x % 2 - 1);
        switch (Math.floor(x)) {
            case 0:
                this.#r = Color.clamp(max);
                this.#g = Color.clamp(mid);
                this.#b = Color.clamp(min);
                break;
            case 1:
                this.#r = Color.clamp(mid);
                this.#g = Color.clamp(max);
                this.#b = Color.clamp(min);
                break;
            case 2:
                this.#r = Color.clamp(min);
                this.#g = Color.clamp(max);
                this.#b = Color.clamp(mid);
                break;
            case 3:
                this.#r = Color.clamp(min);
                this.#g = Color.clamp(mid);
                this.#b = Color.clamp(max);
                break;
            case 4:
                this.#r = Color.clamp(mid);
                this.#g = Color.clamp(min);
                this.#b = Color.clamp(max);
                break;
            case 5:
                this.#r = Color.clamp(max);
                this.#g = Color.clamp(min);
                this.#b = Color.clamp(mid);
                break;
            default:
                return false;
        }
        this.fire();
        return true;
    }
    get hue() {
        const max = Math.max(this.#r, this.#g, this.#b);
        if (max == 0) {
            return 0;
        }
        const range = max - Math.min(this.#r, this.#g, this.#b);
        if (range == 0) {
            return 0;
        }
        let h;
        if (max == this.#r) {
            h = (this.#g - this.#b) / range;
            if (h < 0) {
                h += 6;
            }
        } else if (max == this.#g) {
            h = 2 + (this.#b - this.#r) / range;
        } else {
            h = 4 + (this.r - this.#g) / range;
        }
        return h / 6;
    }
    set chroma(x) {
        const max = Math.max(this.#r, this.#g, this.#b);
        if (max != 0) {
            const min = Math.min(this.#r, this.#g, this.#b);
            this.multiplyMax((0xff * x) / (max - min), max);
        }
    }
    get chroma() {
        return (Math.max(this.#r, this.#g, this.#b) - Math.min(this.#r, this.#g, this.#b)) / 0xff;
    }
    set saturation(x) {
        const max = Math.max(this.#r, this.#g, this.#b);
        if (max != 0) {
            const min = Math.min(this.#r, this.#g, this.#b);
            this.multiplyMax((max * x) / (max - min), max);
        }
    }
    get saturation() {
        const max = Math.max(this.#r, this.#g, this.#b);
        if (max == 0) {
            return 0;
        } else {
            return 1 - (Math.min(this.#r, this.#g, this.#b) / max);
        }
    }
    set value(x) {
        this.multiply(x / this.value);
    }
    get value() {
        return Math.max(this.#r, this.#g, this.#b) / 0xff;
    }
    set lightness(x) {
        this.multiply(x / this.lightness);
    }
    get lightness() {
        return (Math.max(this.#r, this.#g, this.#b) + Math.min(this.#r, this.#g, this.#b)) / (2 * 0xff);
    }
    set intensity(x) {
        this.multiply(x / this.intensity);
    }
    get intensity() {
        return (this.#r + this.#g + this.#b) / (3 * 0xff);
    }
    add(r, g, b) {
        this.#r = Color.clamp(this.#r + r);
        this.#g = Color.clamp(this.#g + g);
        this.#b = Color.clamp(this.#b + b);
        this.fire();
    }
    multiply(x) {
        if (isNaN(x)) {
            return;
        }
        if (x < 0) {
            x = 0;
        }
        if (isFinite(x)) {
            this.#r = Color.clamp(this.#r * x);
            this.#g = Color.clamp(this.#g * x);
            this.#b = Color.clamp(this.#b * x);
        } else { // positive infinity
            this.#r = 0xff;
            this.#g = 0xff;
            this.#b = 0xff;
        }
        this.fire();
    }
    multiplyMax(x, max) {
        if (isFinite(x)) {
            this.#r = Color.clamp(max - x * (max - this.#r));
            this.#g = Color.clamp(max - x * (max - this.#g));
            this.#b = Color.clamp(max - x * (max - this.#b));
        }
        this.fire();
    }
    disable() {
        this.#mute = true;
    }
    enable() {
        this.#mute = false;
    }
    fire() {
        if (this.#mute || this.#listeners == null) {
            return;
        }
        this.#mute = true;
        try {
            for (const listener of this.#listeners) {
                listener(this);
            }
        } finally {
            this.#mute = false;
        }
    }
    /**
     * @param {function} callback 
     * @param {HTMLElement} element 
     * @param {boolean} immediate 
     * @returns {boolean}
     */
    addListener(callback, element, immediate) {
        if ((typeof callback) === "function") {
            if ((typeof element) === "object") {
                const callback0 = callback;
                if (WeakRef != null) {
                    if (!(element instanceof WeakRef)) {
                        element = new WeakRef(element);
                    }
                    callback = (self, first) => {
                        const element0 = element.deref();
                        if (element0 != null && (first || element0.isConnected)) {
                            callback0(self);
                        } else if (this.#listeners != null) {
                            const index = this.#listeners.indexOf(callback);
                            if (index != -1) {
                                this.#listeners.splice(index, 1);
                            }
                        }
                    };
                } else {
                    callback = (self, first) => {
                        if (first || element.isConnected) {
                            callback0(self);
                        } else if (this.#listeners != null) {
                            const index = this.#listeners.indexOf(callback);
                            if (index != -1) {
                                this.#listeners.splice(index, 1);
                            }
                        }
                    };
                }
            }
            if (this.#listeners != null) {
                this.#listeners.push(callback);
            } else {
                this.#listeners = [callback];
            }
            if (immediate) {
                this.#mute = true;
                try {
                    callback(this, true);
                } finally {
                    this.#mute = false;
                }
            }
            return true;
        }
        return false;
    }
    bindProperty(self, key, listener, valueOf, ...args) {
        if ((typeof valueOf) !== "function") {
            valueOf = this.valueOf;
        }
        let mute = false;
        Object.defineProperty(self, key, {
            get: () => {
                return valueOf.call(this, ...args);
            },
            set: value => {
                mute = true;
                this.color = value;
                mute = false;
            }
        });
        this.addListener(() => {
            if (mute) {
                return;
            }
            listener.call(self, key, this);
        });
    }
    bindColorLabel(element, opaque) {
        this.addListener(() => {
            element.style.backgroundColor = this.getPoundHex(1, opaque);
        }, element, true);
        return element;
    }
    bindTextLabel(element, valueOf, ...args) {
        if (element == null) {
            element = Utility.div();
        }
        if ((typeof valueOf) !== "function") {
            valueOf = this.valueOf;
        }
        this.addListener(() => {
            element.textContent = valueOf.call(this, ...args);
        }, element, true);
        return element;
    }
    bindInputText(element, valueOf, ...args) {
        if (element == null) {
            element = Control.inputText("");
        }
        if ((typeof valueOf) !== "function") {
            valueOf = this.valueOf;
        }
        let mute = false;
        element.addEventListener("input", () => {
            mute = true;
            element.classList.toggle("error", !this.setColorValue(element.value));
            mute = false;
        });
        this.addListener(() => {
            if (mute) {
                return;
            }
            element.value = valueOf.call(this, ...args);
        }, element, true);
        return element;
    }
    openEyeDropper() {
        (new EyeDropper()).open().then(result => {
            this.setPoundHex(result.sRGBHex);
        });
    }
    colorLabel() {
        const root = Utility.div("control color alpha-checkboard");
        const opaque = Utility.div("left focusable");
        const translucent = Utility.div("right focusable");
        this.bindColorLabel(opaque, true);
        this.bindColorLabel(translucent, false);
        opaque.addEventListener("keydown", event => {
            switch (event.key) {
                case '=': case '+':
                    if (event.ctrlKey) {
                        this.value = 1;
                    } else {
                        this.value += 0.1;
                    }
                    break;
                case '-': case '_':
                    if (event.ctrlKey) {
                        this.value = 0;
                    } else {
                        this.value -= 0.1;
                    }
                    break;
                case 'S': case 's':
                    this.openEyeDropper();
                    break;
                case 'C': case 'c':
                    Control.clipboard = this.getPoundHex(1, true);
                    break;
                case 'V': case 'v':
                    this.setPoundHex(Control.clipboard, true);
                    break;
                case 'D': case 'd':
                    this.debug();
                    break;
            }
        });
        translucent.addEventListener("keydown", event => {
            switch (event.key) {
                case '=': case '+':
                    if (event.ctrlKey) {
                        this.alpha = 1;
                    } else {
                        this.alpha += 0.1;
                    }
                    break;
                case '-': case '_':
                    if (event.ctrlKey) {
                        this.alpha = 0;
                    } else {
                        this.alpha -= 0.1;
                    }
                    break;
                case 'S': case 's':
                    this.openEyeDropper();
                    break;
                case 'C': case 'c':
                    Control.clipboard = this.getPoundHex(1, false);
                    break;
                case 'V': case 'v':
                    this.setPoundHex(Control.clipboard, false);
                    break;
                case 'D': case 'd':
                    this.debug();
                    break;
            }
        });
        root.append(opaque, translucent);
        return root;
    }
    static GRADIENT_KEYS = ["red", "green", "blue", "saturation", "value"];
    contrastColor() {
        if (this.y > 0x7f) {
            return "#000000";
        } else {
            return "#ffffff";
        }
    }
    componentSlider(key, vertical) {
        const root = Utility.div("control range discrete color-component focusable");
        if (vertical) {
            root.classList.add("vertical");
        }
        const that = new Color();
        root.addEventListener("keydown", event => {
            switch (event.key) {
                case '=': case '+':
                    if (event.ctrlKey) {
                        this[key] = 1;
                    } else {
                        this[key] += 0.1;
                    }
                    break;
                case '-': case '_':
                    if (event.ctrlKey) {
                        this[key] = 0;
                    } else {
                        this[key] -= 0.1;
                    }
                    break;
                case 'S': case 's':
                    this.openEyeDropper();
                    break;
                case 'C': case 'c':
                    that.setRGBA(0xff);
                    that[key] = this[key];
                    Control.clipboard = that.getPoundHex();
                    break;
                case 'V': case 'v':
                    that.setPoundHex(Control.clipboard);
                    this[key] = that[key];
                    break;
                case 'D':
                    this.debug();
                    break;
                case 'd':
                    that.debug();
                    break;
            }
        });
        root.addEventListener("mousemove", event => {
            if (event.buttons == 0) {
                return;
            }
            if (vertical) {
                this[key] = (event.layerY - 2.5) / (root.clientHeight - 5);
            } else {
                this[key] = (event.layerX - 2.5) / (root.clientWidth - 5);
            }
        });
        const caret = Utility.div("caret");
        if (key == "hue") {
            root.classList.add("light");
            root.style.backgroundImage = `linear-gradient(${vertical ? 180 : 90}deg,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)`;
        } else if (key == "alpha") {
            root.classList.add("alpha-checkboard");
            root.appendChild(Utility.div("alpha-component-overlay"));
        }
        root.appendChild(caret);
        this.addListener(() => {
            if (Color.GRADIENT_KEYS.includes(key)) {
                that.setColor(this);
                that[key] = 0;
                const c0 = that.getPoundHex(1, true);
                that.setColor(this);
                that[key] = 1;
                const c1 = that.getPoundHex(1, true);
                root.style.backgroundImage = `linear-gradient(${vertical ? 0 : 90}deg,${c0} 0%,${c1} 100%)`;
                caret.style.backgroundColor = this.contrastColor();
            }
            if (vertical) {
                caret.style.top = ((root.clientHeight - 5) * this[key]) + "px";
            } else {
                caret.style.left = ((root.clientWidth - 5) * this[key]) + "px";
            }
        }, root);
        return root;
    }
    saturationSquare() {
        const root = Utility.div("saturation-square");
        const that = new Color();
        const crosshair = Utility.div("crosshair");
        root.addEventListener("mousemove", event => {
            if (event.buttons == 0) {
                return;
            }
            this.setHueSaturationValue(this.hue, event.layerX / root.clientWidth, 1.0 - event.layerY / root.clientHeight);
            crosshair.style.left = (event.layerX - 4.5) + "px";
            crosshair.style.top = (event.layerY - 4.5) + "px";
        });
        root.appendChild(crosshair);
        this.addListener(() => {
            that.setHueSaturationValue(this.hue, 1.0, 1.0);
            root.style.backgroundImage = `linear-gradient(0deg,#000f 0%,#0000 100%),linear-gradient(90deg,#fff 0%,${that.getPoundHex()} 100%)`;
        }, root);
        return root;
    }
    hueDisk() {
        const root = Utility.div("hue-disk");
        root.addEventListener("mousemove", event => {
            if (event.buttons == 0) {
                return;
            }
        });
        const crosshair = Utility.div("crosshair");
        root.appendChild(crosshair);
        this.addListener(() => {
            that.setColor(this); // fixme
        }, root);
        return root;
    }
    rgbBandsControl() {
        const root = Utility.div("color-bands pad");
        for (const comp of ["red", "blue", "green", "alpha"]) {
            const fieldName = comp.substring(0, 1);
            root.appendChild(Utility.div("key", fieldName.toUpperCase()));
            const label = Utility.div("value number");
            this.bindTextLabel(label, () => this[fieldName]);
            root.append(label, this.componentSlider(comp));
        }
        window.setTimeout(this.fire.bind(this), 0);
        return root;
    }
    hsvBandsControl() {
        const root = Utility.div("color-bands pad");
        for (const comp of ["hue", "saturation", "value", "alpha"]) {
            const label = Utility.div("value number");
            this.bindTextLabel(label, () => Math.round(0xff * this[comp]));
            root.append(Utility.div("key", comp.substring(0, 1).toUpperCase()), label, this.componentSlider(comp));
        }
        window.setTimeout(this.fire.bind(this), 0);
        return root;
    }
    hsvSquareControl() {
        const root = Utility.div("color-square pad");
        root.append(this.saturationSquare(), this.componentSlider("hue", true), this.componentSlider("alpha"));
        window.setTimeout(this.fire.bind(this), 0);
        return root;
    }
    hsvDiskControl() {
        const root = Utility.div("color-square pad");
        root.append(this.hueDisk(), this.componentSlider("saturation", true), this.componentSlider("alpha"));
        window.setTimeout(this.fire.bind(this), 0);
        return root;
    }
    debug() {
        console.log("Color.debug()", this.#r, this.#g, this.#b, this.#a, this.#mute, this.#listeners);
    }
    toString() {
        return this.getPoundHex();
    }
}
class Control {
    static ROOT = Symbol();
    static focused = null;
    static active = null;
    static clipboard = null;
    static install() {
        Utility.HINT_KEY = "hint";
        let dispatching = null;
        window.addEventListener("keydown", event => {
            if (dispatching == event) {
                return;
            }
            if (event.key == "Escape") {
                event.preventDefault();
                if (this.active != null && this.active.dispatchEvent(new FocusEvent("blur", event))) {
                    this.active = null;
                }
                return;
            }
            console.log("focused active", this.focused, this.active);
            if (this.focused != null && this.focused != event.target) {
                dispatching = new KeyboardEvent("keydown", {
                    target: this.focused,
                    key: event.key,
                    code: event.code,
                    ctrlKey: event.ctrlKey,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                    metaKey: event.metaKey
                });
                if (this.focused.dispatchEvent(dispatching)) {
                    event.preventDefault();
                }
            }
        });
        window.addEventListener("mousedown", event => {
            if (this.active == null) {
                return;
            }
            let node = event.target;
            while (node != null) {
                if (node == this.active) {
                    return;
                }
                node = node.parentNode;
            }
            if (this.active.dispatchEvent(new FocusEvent("blur", event))) {
                this.active = null;
            }
        });
        window.addEventListener("mouseover", event => {
            this.focused = null;
            let node = event.target;
            while (node != null) {
                if ("classList" in node && node.classList.contains("focusable")) { // data-focusable
                    this.focused = node;
                    break;
                }
                node = node.parentNode;
            }
        });
    }
    static activate(node) {
        if (this.active == node) {
            return false;
        }
        if (this.active != null) {
            this.active.dispatchEvent(new FocusEvent("blur"));
        }
        this.active = node;
        return true;
    }
    static deactivate(node) {
        if (this.active == node) {
            this.active.dispatchEvent(new FocusEvent("blur"));
            this.active = null;
            return true;
        } else {
            return false;
        }
    }
    /**
     * @param {HTMLElement | HTMLElement[]} node 
     * @param {string | undefined} label 
     * @param {boolean} open 
     * @returns {HTMLElement}
     */
    static disclosure(node, label, open) {
        const root = Utility.div(open ? "disclosure open" : "disclosure");
        const head = Utility.div(null, label);
        head.addEventListener("click", () => {
            root.classList.toggle("open");
        });
        root.appendChild(head);
        const body = Utility.div();
        if (node instanceof Array) {
            for (const n of node) {
                body.appendChild(n);
            }
        } else {
            body.appendChild(node);
        }
        root.appendChild(body);
        return root;
    }
    /**
     * @param {string} value 
     * @param {function} submit
     * @param {boolean} select 
     * @returns {HTMLInputElement} type="text"
     */
    static inputText(value, submit, select) {
        const input = Utility.element("input", null, "input-text");
        input.setAttribute("type", "text");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("autocorrect", "false");
        input.value = value;
        if (submit != null) {
            input.addEventListener("keydown", event => {
                if (event.key == "Enter") {
                    submit();
                }
            });
            input.addEventListener("blur", submit);
        }
        input.addEventListener("click", event => {
            event.preventDefault();
        });
        if (select) {
            window.setTimeout(() => {
                input.setSelectionRange(0, input.value.length);
                input.focus();
            }, 0);
        }
        return input;
    }
    static button(label, self, listener) {
        const root = Utility.div("control button", label, null, () => {
            listener.call(self, label); // do not bind
        });
        if (self == this.ROOT) {
            self = root;
        }
        return root;
    }
    static toggle(label, self, key, listener, value) {
        if (value == null) {
            value = self[key];
        }
        const root = Utility.div(value ? "control toggle selected" : "control toggle", label, null, () => {
            value = root.classList.toggle("selected");
            listener.call(self, value, key, label); // do not bind
        });
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = next;
                root.classList.toggle("selected", value);
            }
        });
        if (self == this.ROOT) {
            self = root;
        }
        return root;
    }
    static check(label, self, key, listener, value) {
        if (value == null) {
            value = self[key];
        }
        const root = Utility.div(value ? "control check selected" : "control check", label, null, () => {
            value = root.classList.toggle("selected");
            listener.call(self, value, key, label);
        });
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = next;
                root.classList.toggle("selected", value);
            }
        });
        if (self == this.ROOT) {
            self = root;
        }
        return root;
    }
    static text(label, self, key, listener, value = "") {
        if (value == null) {
            value = self[key];
        }
        value = String(value);
        const root = Utility.div("control text");
        const nodeValue = Utility.div("value");
        if (label != null) {
            root.classList.add("labelled");
            root.appendChild(Utility.div("label", label));
        }
        root.append(nodeValue, Utility.div("block-icon", "\ue877"));
        nodeValue.innerText = value;
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = next;
                nodeValue.innerText = value;
                this.deactivate(root);
            }
        });
        let start;
        root.addEventListener("blur", () => {
            let changed = false;
            if (start != null) {
                changed = start != value;
                value = start;
                start = null;
            }
            root.innerHTML = "";
            root.classList.remove("input");
            nodeValue.innerText = value;
            if (label != null) {
                root.appendChild(Utility.div("label", label));
            }
            root.append(nodeValue, Utility.div("block-icon", "\ue877"));
            if (changed) {
                listener.call(self, value, key, label);
            }
        });
        root.addEventListener("click", event => {
            if (start == null) {
                event.preventDefault();
                start = value;
            } else {
                return;
            }
            const input = this.inputText(value, () => {
                start = input.value;
                this.deactivate(root);
            }, true);
            this.activate(root);
            input.addEventListener("input", () => {
                value = input.value;
                listener.call(self, value, key, label);
            });
            root.innerHTML = "";
            root.appendChild(input);
            root.classList.remove("input");
        });
        return root;
    }
    static PROGRESS_POWER = 3;
    static PROGRESS_FACTOR = Math.E ** (2 * Control.PROGRESS_POWER);
    static setProgress(meter, value, min, max) {
        if (isFinite(min)) {
            if (isFinite(max)) {
                value = (value - min) / (max - min);
            } else {
                value = 1 - Control.PROGRESS_POWER / (Control.PROGRESS_POWER + Math.log(value - min + 1));
            }
        } else {
            if (isFinite(max)) {
                value = Control.PROGRESS_POWER / (Control.PROGRESS_POWER + Math.log(max - value + 1));
            } else {
                value = 0.5 + Math.atan(value / Control.PROGRESS_FACTOR) / Math.PI;
            }
        }
        value = Math.max(0, Math.min(100 * value, 100));
        meter.style.backgroundImage = `linear-gradient(90deg, #5379b4 0%, #5379b4 ${value}%, #6e6e6e ${value}%, #6e6e6e 100%)`;
    }
    static getProgress(value, min, max) {
        value = Math.max(0, Math.min(value, 1));
        if (isFinite(min)) {
            if (isFinite(max)) {
                value = min + value * (max - min);
            } else {
                value = min + Math.exp(Control.PROGRESS_POWER * value / (1 - value)) - 1;
            }
        } else {
            if (isFinite(max)) {
                value = max + 1 - Math.exp(Control.PROGRESS_POWER / value - Control.PROGRESS_POWER);
            } else {
                value = Control.PROGRESS_FACTOR * Math.tan(Math.PI * (value - 0.5));
            }
        }
        return value;
    }
    static continuous(label, self, key, listener, value = 0.5, min = 0.0, max = 1.0, stringify = String) {
        min = parseFloat(min);
        max = parseFloat(max);
        if (!(min <= max)) {
            throw new RangeError(`[${min}, ${max}]`);
        }
        const factor = Math.min(0.25, (max - min) / 1024);
        if (value == null) {
            value = self[key];
        }
        const root = Utility.div("control range continuous");
        const nodeValue = label != null ? Utility.div("value") : root;
        if (label != null) {
            root.classList.add("labelled");
            root.append(Utility.div("label", label), nodeValue);
        }
        function parse(next) {
            return Math.max(min, Math.min(parseFloat(next), max));
        }
        value = parse(value);
        function change() {
            nodeValue.innerText = stringify(value);
            Control.setProgress(root, value, min, max);
        }
        change();
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = parse(next);
                change();
                this.deactivate(root);
            }
        });
        let start;
        let cancelled;
        root.addEventListener("blur", () => {
            cancelled = true;
            let changed = false;
            if (start != null) {
                changed = start != value;
                value = start;
                start = null;
            }
            root.innerHTML = "";
            root.classList.remove("input");
            change();
            if (label != null) {
                root.append(Utility.div("label", label), nodeValue);
            }
            if (changed) {
                listener.call(self, value, key, label);
            }
        });
        root.addEventListener("contextmenu", event => {
            event.preventDefault();
        });
        root.addEventListener("mousedown", event => {
            event.preventDefault();
            cancelled = false;
        });
        root.addEventListener("mousemove", event => {
            if (cancelled || event.buttons == 0 || !nodeValue.isConnected) {
                return;
            }
            event.preventDefault();
            if (start == null) {
                start = value;
                this.activate(root);
                if (event.buttons == 2) {
                    root.requestPointerLock();
                }
            }
            let changed = false;
            if (event.shiftKey || event.buttons == 2) {
                const move = event.movementX;
                if (event.ctrlKey) {
                    if (move < 0) {
                        if (isFinite(min) && value != min) {
                            value = min;
                            changed = true;
                        }
                    } else if (move > 0) {
                        if (isFinite(max) && value != max) {
                            value = max;
                            changed = true;
                        }
                    }
                } else {
                    let next = factor;
                    if (event.altKey) {
                        next /= 16;
                    }
                    next = parse(value + next * move);
                    if (next != value) {
                        value = next;
                        changed = true;
                    }
                }
            } else {
                const next = parse(Control.getProgress(event.layerX / root.clientWidth, min, max));
                if (next != value) {
                    value = next;
                    changed = true;
                }
            }
            if (changed) {
                change();
                listener.call(self, value, key, label);
            }
        });
        root.addEventListener("mouseup", event => {
            if (cancelled) {
                return;
            }
            event.preventDefault();
            if (start != null) { // drag finish
                start = null;
                document.exitPointerLock();
                this.deactivate(root);
            } else if (event.button == 0) { // left click
                start = value;
                const input = this.inputText(nodeValue.innerText, () => {
                    start = parse(input.value);
                    this.deactivate(root);
                }, true);
                this.activate(root);
                input.addEventListener("input", () => {
                    value = parse(input.value);
                    listener.call(self, value, key, label);
                });
                root.innerHTML = "";
                root.appendChild(input);
                root.classList.add("input");
            }
        });
        return root;
    }
    static discrete(label, self, key, listener, value = 80, min = 0, max = 100) {
        min = parseInt(min);
        max = parseInt(max);
        if (!(min <= max)) {
            throw new RangeError(`[${min}, ${max}]`);
        }
        if (value == null) {
            value = self[key];
        }
        const root = Utility.div("control range discrete focusable");
        const content = Utility.div("content");
        const left = Utility.div("arrow inline-icon", "\ue6aa", "-1", dec);
        const right = Utility.div("arrow inline-icon", "\ue6ab", "+1", inc);
        const nodeValue = label != null ? Utility.div("value") : content;
        if (label != null) {
            root.classList.add("labelled");
            content.append(Utility.div("label", label), nodeValue);
        }
        root.append(left, content, right);
        function parse(next) {
            return Math.max(min, Math.min(Math.round(parseFloat(next)), max));
        }
        value = parse(value);
        function change() {
            nodeValue.innerText = value;
            Control.setProgress(root, value, min, max);
        }
        change();
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = parse(next);
                change();
                this.deactivate(root);
            }
        });
        function inc(event) {
            if (event.ctrlKey) {
                if (value != max) {
                    value = max;
                } else {
                    return;
                }
            } else {
                if (value + 1 <= max) {
                    value = value + 1;
                } else {
                    return;
                }
            }
            change();
            listener.call(self, value, key, label);
        }
        function dec(event) {
            if (event.ctrlKey) {
                if (value != min) {
                    value = min;
                } else {
                    return;
                }
            } else {
                if (value - 1 >= min) {
                    value = value - 1;
                } else {
                    return;
                }
            }
            change();
            listener.call(self, value, key, label);
        }
        root.addEventListener("keydown", event => {
            if ("=+".includes(event.key)) {
                inc(event);
                event.preventDefault();
            } else if ("-_".includes(event.key)) {
                dec(event);
                event.preventDefault();
            }
        });
        let insideBlur = false;
        let start;
        let cancelled;
        root.addEventListener("blur", () => {
            if (insideBlur) {
                return;
            }
            insideBlur = true;
            try {
                console.trace("discrete blur");
                cancelled = true;
                let changed = false;
                if (start != null) {
                    changed = start != value;
                    value = start;
                    start = null;
                }
                root.innerHTML = ""; // will trigger blur event
                root.classList.remove("input");
                change();
                root.append(left, content, right);
                if (changed) {
                    listener.call(self, value, key, label);
                }
            } finally {
                insideBlur = false;
            }
        });
        root.addEventListener("contextmenu", event => {
            event.preventDefault();
        });
        root.addEventListener("mousedown", event => {
            event.preventDefault();
            cancelled = false;
        });
        root.addEventListener("mousemove", event => {
            if (cancelled || event.buttons == 0 || !nodeValue.isConnected) {
                return;
            }
            event.preventDefault();
            if (start == null) {
                start = value;
                this.activate(root);
                if (event.buttons == 2) {
                    root.requestPointerLock();
                }
            }
            let changed = false;
            if (event.shiftKey || event.buttons == 2) {
                let move = event.movementX;
                if (event.ctrlKey) {
                    if (move < 0) {
                        if (isFinite(min) && value != min) {
                            value = min;
                            changed = true;
                        }
                    } else if (move > 0) {
                        if (isFinite(max) && value != max) {
                            value = max;
                            changed = true;
                        }
                    }
                } else {
                    if (event.altKey) {
                        move /= 4;
                    }
                    const next = parse(value + move);
                    if (next != value) {
                        value = next;
                        changed = true;
                    }
                }
            } else {
                const next = parse(Control.getProgress(event.layerX / root.clientWidth, min, max));
                if (next != value) {
                    value = next;
                    changed = true;
                }
            }
            if (changed) {
                change();
                listener.call(self, value, key, label);
            }
        });
        root.addEventListener("mouseup", event => {
            if (cancelled) {
                return;
            }
            event.preventDefault();
            if (start != null) { // drag finish
                start = null;
                document.exitPointerLock();
                this.deactivate(root);
            } else if (event.button == 0 && !event.target.classList.contains("arrow")) { // left click
                start = value;
                const input = this.inputText(nodeValue.innerText, () => {
                    start = parse(input.value);
                    this.deactivate(root);
                }, true);
                this.activate(root);
                input.addEventListener("input", () => {
                    value = parse(input.value);
                    listener.call(self, value, key, label);
                });
                root.innerHTML = "";
                root.appendChild(input);
                root.classList.add("input");
            }
        });
        return root;
    }
    static parseSelectMap(obj) {
        let map = {};
        if (obj instanceof Array) {
            const length = obj.length;
            for (let index = 0; index < length; index++) {
                map[String(obj[index])] = index;
            }
        } else if (obj instanceof Set) {
            for (const item of obj) {
                map[String(item)] = item;
            }
        } else if (obj instanceof Map) {
            for (const [key, value] of obj) {
                map[String(key)] = value;
            }
        } else {
            map = obj;
        }
        return map;
    }
    static select(label, self, key, listener, map) {
        map = this.parseSelectMap(map);
        let value = self[key];
        const root = Utility.div("control select");
        const nodeValue = Utility.div("value");
        if (label != null) {
            root.classList.add("labelled");
            root.appendChild(Utility.div("label", label));
        }
        root.append(nodeValue, Utility.div("block-icon", "\ue6a9"));
        function updateText() {
            let text = null;
            let next;
            for (next of Object.keys(map)) {
                if (map[next] == value) {
                    text = next;
                    break;
                }
            }
            if (text != null) {
                nodeValue.innerText = text;
                nodeValue.classList.remove("inline-icon");
            } else {
                nodeValue.innerText = "\ue614";
                nodeValue.classList.add("inline-icon");
            }
        }
        if (value == null) {
            let text;
            nodeValue.innerText = text = Object.keys(map)[0];
            value = map[text];
        } else {
            updateText();
        }
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = next;
                updateText();
            }
        });
        let drop;
        root.addEventListener("blur", () => {
            if (drop != null) {
                root.removeChild(drop);
                drop = null;
            }
        });
        root.addEventListener("click", () => {
            if (drop != null) {
                this.deactivate(root);
                return;
            }
            this.activate(root);
            drop = Utility.div("drop");
            for (const next of Object.keys(map)) {
                drop.appendChild(Utility.div(
                    map[next] == value ? "item selected" : "item",
                    next, map[next], () => {
                        nodeValue.innerText = next;
                        nodeValue.classList.remove("inline-icon");
                        value = map[next];
                        listener.call(self, value, key, label);
                    }
                ));
            }
            root.appendChild(drop);
        });
        return root;
    }
    static parseEnumMap(obj, container, click) {
        const map = new Map();
        if (obj instanceof Array) {
            const length = obj.length;
            for (let index = 0; index < length; index++) {
                const button = this.button(obj[index], this.ROOT, click); // pass button element as this to click()
                map.set(index, button);
                map.set(button, index);
                container.appendChild(button);
            }
        } else if (obj instanceof Set) {
            for (const item of obj) {
                const button = this.button(item, this.ROOT, click); // pass button element as this to click()
                map.set(item, button);
                map.set(button, item);
                container.appendChild(button);
            }
        } else if (obj instanceof Map) {
            for (const [key, value] of obj) {
                const button = this.button(key, this.ROOT, click); // pass button element as this to click()
                map.set(value, button);
                map.set(button, value);
                container.appendChild(button);
            }
        } else {
            for (const key of Object.keys(obj)) {
                const button = this.button(key, this.ROOT, click); // pass button element as this to click()
                map.set(obj[key], button);
                map.set(button, obj[key]);
                container.appendChild(button);
            }
        }
        return map;
    }
    static enum(self, key, listener, map) {
        const root = Utility.div("group enum");
        map = this.parseEnumMap(map, root, click); // pass button element as this to click()
        let value = self[key];
        if (value == null) {
            value = map.get(root.firstChild);
        }
        select(map.get(value));
        function select(button0) {
            let button1;
            for (button1 = root.firstChild; button1 != null; button1 = button1.nextSibling) {
                if ("classList" in button1) {
                    button1.classList.toggle("selected", button0 == button1);
                }
            }
        }
        function click() {
            select(this);
            value = map.get(this);
            listener.call(self, value, key);
        }
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                const button = map.get(value);
                if (button instanceof HTMLElement) {
                    value = next;
                    select(button);
                }
            }
        });
        return root;
    }
    static flag(self, key, listener, map) {
        const root = Utility.div("group flag");
        Object.defineProperty(self, key, {
            get: () => value,
            set: next => {
                value = next;
                // TODO
            }
        });
        return root;
    }
    static colorStyle = Color.prototype.rgbBandsControl;
    static color(self, key, listener, value) {
        value = new Color(value || self[key]);
        value.bindProperty(self, key, listener);
        const root = value.colorLabel();
        let drop, content, start;
        function styleChange(newStyle) {
            if (drop != null && (typeof newStyle) === "function") {
                const newContent = newStyle.call(value);
                if (newContent != null) {
                    drop.replaceChild(newContent, content);
                    content = newContent;
                }
            }
        }
        root.addEventListener("blur", () => {
            if (drop != null) {
                root.removeChild(drop);
                drop = null;
                content = null;
            }
        });
        root.addEventListener("click", event => {
            if (drop != null || event.defaultPrevented) {
                return;
            }
            start = value.getRGBA();
            this.activate(root);
            drop = Utility.div("drop popup");
            drop.appendChild(Control.enum(Control, "colorStyle", styleChange, {
                "RGB": value.rgbBandsControl,
                "HSV": value.hsvBandsControl,
                "3": value.hsvSquareControl,
                "4": value.hsvDiskControl
            }));
            drop.appendChild(content = Utility.div());
            drop.appendChild(Utility.contain("control",
                value.bindInputText()
            ));
            drop.appendChild(Utility.contain("ctl-row evenly",
                Control.button("取色", Control, () => value.openEyeDropper()),
                Control.button("确定", Control, () => Control.deactivate(root)),
                Control.button("取消", Control, () => {
                    value.setRGBA(start);
                    Control.deactivate(root);
                })
            ));
            root.appendChild(drop);
            styleChange(Control.colorStyle);
        }, true);
        return root;
    }
}
class UseControl {
    static opacity(element = document.body, label = "opacity") {
        const fun = value => {
            element.style.opacity = value;
        };
        fun.opacity = parseFloat(element.style.opacity);
        if (isNaN(fun.opacity)) {
            fun.opacity = 1.0;
        }
        return Control.continuous(label, fun, "opacity", fun, null);
    }
    static grayscale(element = document.body, label = "grayscale") {
        const fun = value => {
            element.style.filter = `grayscale(${100 * value}%)`;
        };
        return Control.continuous(label, fun, "grayscale", fun, 0.0);
    }
    static blur(element = document.body, label = "blur") {
        const fun = value => {
            element.style.filter = `blur(${value}px)`;
        };
        return Control.continuous(label, fun, "blur", fun, 0, 0, 20);
    }
    static PAIRS = {
        "(": ")",
        "[": "]",
        "{": "}",
        "\"": "\"",
        "'": "'",
    };
    static split(string, separator) {
        const length = string.length;
        const list = [];
        const stack = [];
        let index0, index1, ch, st;
        index0 = 0;
        for (index1 = 0; index1 < length; index1++) {
            ch = string[index1];
            if (stack.length == 0) {
                if (ch == separator) {
                    list.push(string.substring(index0, index1));
                    index0 = index1 + 1;
                    continue;
                }
            } else {
                top = stack.pop();
                if (ch == top) {
                    continue;
                } else {
                    stack.push(top);
                }
            }
            if (this.PAIRS[ch] != null) {
                stack.push(this.PAIRS[ch]);
            }
        }
        if (index0 < index1) {
            list.push(string.substring(index0, index1));
        }
        return list;
    }
    static getShadowBlur(expression) {
        expression = this.split(expression, " ");
        if (expression.length >= 4) {
            return parseFloat(expression[2]);
        } else {
            return 0.0;
        }
    }
    static setShadowBlur(expression, value) {
        expression = this.split(expression, " ");
        switch (expression.length) {
            default:
                return `0 0 ${value}px black`;
            case 3:
                return `${expression[0]} ${expression[1]} ${value}px ${expression[2]}`;
            case 4:
                return `${expression[0]} ${expression[1]} ${value}px ${expression[3]}`;
            case 5:
                return `${expression[0]} ${expression[1]} ${value}px ${expression[3]} ${expression[4]}`;
        }
    }
    static boxShadowBlur(element = document.body, label = "boxShadowBlur") {
        const fun = value => {
            element.style.boxShadow = this.setShadowBlur(element.style.boxShadow, value);
        };
        fun.boxShadowBlur = getShadowBlur(element.style.boxShadow);
        return Control.continuous(label, fun, "boxShadowBlur", fun, 0, 0, 20);
    }
    static textShadowBlur(element = document.body, label = "textShadowBlur") {
        const fun = value => {
            element.style.textShadow = this.setShadowBlur(element.style.textShadow, value);
        };
        fun.textShadowBlur = getShadowBlur(element.style.textShadow);
        return Control.continuous(label, fun, "textShadowBlur", fun, 0, 0, 20);
    }
    static objectFit(element = document.body, label = "objectFit") {
        const fun = value => {
            element.style.objectFit = value;
        };
        fun.objectFit = element.style.objectFit;
        return Control.select(label, fun, "objectFit", fun, new Set(["none", "contain", "cover", "fill", "scale-down"]));
    }
    static objectPosition(element = document.body, label = "objectPosition") {
        const fun = value => {
            element.style.objectPosition = value;
        };
        fun.objectPosition = element.style.objectPosition;
        return Control.select(label, fun, "objectPosition", fun, new Set(["none", "top", "right", "bottom", "left", "center"]));
    }
    static visibility(element = document.body) {
        const fun = value => {
            element.style.visibility = value;
        };
        fun.visibility = element.style.visibility;
        return Control.enum(fun, "visibility", fun, new Set(["visible", "hidden", "collapse"]));
    }
}
class Split {
    static install() {
        document.querySelectorAll(".split").forEach(node => new Split(node));
    }
    static #HANDLE_SIZE = 3;
    static fields = ["top", "right", "bottom", "left", "split-row", "split-col"];
    /**
     * @param {string | Element} panel
     */
    constructor(panel) {
        if ((typeof panel) === "string") {
            panel = document.getElementById(panel);
        }
        if (!(panel instanceof HTMLElement)) {
            return;
        }
        let node, classList, field;
        for (node = panel.firstChild; node != null; node = node.nextSibling) {
            classList = node.classList;
            if (classList == null) {
                continue;
            }
            for (field of Split.fields) {
                if (classList.contains(field)) {
                    this[field] = node;
                }
            }
        }
        /** @type {HTMLElement} */
        this.panel = panel;
        let position = parseFloat(panel.getAttribute("position"));
        if (isNaN(position)) {
            position = 0.5;
        } else {
            position = Math.max(0.0, Math.min(position, 1.0));
        }
        /** @type {number} */
        this.x = this.y = position;
        panel.addEventListener("mousedown", this.mousedown.bind(this));
        panel.addEventListener("mousemove", this.mousemove.bind(this));
        panel.addEventListener("mouseup", this.mouseup.bind(this));
        panel.addEventListener("blur", this.blur.bind(this));
        const boundResize = this.resize.bind(this);
        (new ResizeObserver(boundResize)).observe(panel);
        setTimeout(boundResize, 0);
    }
    resize(resolve) {
        const width = this.panel.clientWidth;
        const height = this.panel.clientHeight;
        if (this.top != null) {
            this.top.style.height = Math.floor(height * this.y - Split.#HANDLE_SIZE) + "px";
        }
        if (this.right != null) {
            this.right.style.width = Math.floor(width * (1.0 - this.x) - Split.#HANDLE_SIZE) + "px";
        }
        if (this.bottom != null) {
            this.bottom.style.height = Math.floor(height * (1.0 - this.y) - Split.#HANDLE_SIZE) + "px";
        }
        if (this.left != null) {
            this.left.style.width = Math.floor(width * this.x - Split.#HANDLE_SIZE) + "px";
        }
        if (this["split-row"] != null) {
            this["split-row"].style.left = Math.floor(width * this.x - Split.#HANDLE_SIZE) + "px";
            this["split-row"].style.right = Math.floor(width * (1.0 - this.x) - Split.#HANDLE_SIZE) + "px";
        }
        if (this["split-col"] != null) {
            this["split-col"].style.top = Math.floor(height * this.y - Split.#HANDLE_SIZE) + "px";
            this["split-col"].style.bottom = Math.floor(height * (1.0 - this.y) - Split.#HANDLE_SIZE) + "px";
        }
        if ((typeof resolve) === "function") {
            resolve();
        }
    }
    /**
     * @param {MouseEvent} event
     */
    mousedown(event) {
        const target = event.target;
        let hit = false;
        if (target == this["split-row"]) {
            this.sx = this.x;
            hit = true;
        }
        if (target == this["split-col"]) {
            this.sy = this.y;
            hit = true;
        }
        if (hit) {
            event.preventDefault();
            Control.activate(this.panel);
        }
    }
    /**
     * @param {MouseEvent} event
     */
    mousemove(event) {
        if (event.buttons != 1) {
            return;
        }
        let changed = false;
        if (this.sx != null) {
            let nx = Math.max(0.0, Math.min(this.x + event.movementX / this.panel.clientWidth, 1.0));
            if (nx != this.x) {
                this.x = nx;
                changed = true;
            }
        }
        if (this.sy != null) {
            let ny = Math.max(0.0, Math.min(this.y + event.movementY / this.panel.clientHeight, 1.0));
            if (ny != this.y) {
                this.y = ny;
                changed = true;
            }
        }
        if (changed) {
            this.resize();
        }
    }
    mouseup() {
        this.sx = null;
        this.sy = null;
        Control.deactivate(this.panel);
    }
    blur() {
        let changed = false;
        if (this.sx != null) {
            if (this.sx != this.x) {
                this.x = this.sx;
                changed = true;
            }
            this.sx = null;
        }
        if (this.sy != null) {
            if (this.sy != this.y) {
                this.y = this.sy;
                changed = true;
            }
            this.sy = null;
        }
        if (changed) {
            this.resize();
            return true;
        } else {
            return false;
        }
    }
}
