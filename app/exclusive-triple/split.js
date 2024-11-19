class Split {
    static #BAR_SIZE = 3; // half of the bar width
    /**
     * @param {HTMLElement} container
     * @param {object} config {left, right, top, bottom}
     */
    constructor(container, config) {
        /** @type {HTMLElement} */
        this.container = container;
        /** @type {number} */
        this.x;
        /** @type {HTMLElement | undefined} */
        this.top;
        /** @type {HTMLElement | undefined} */
        this.right;
        /** @type {HTMLElement | undefined} */
        this.bottom;
        /** @type {HTMLElement | undefined} */
        this.left;
        /** @type {HTMLElement | undefined} */
        this.verticalBar;
        /** @type {HTMLElement | undefined} */
        this.horizontalBar;
        if (config.left != null && config.right != null) {
            this.x = config.x || 0.5;
            this.container.className = "split-vertical";
            this.left = this.append(config.left);
            this.verticalBar = this.appendBar("split-bar vertical");
            this.right = this.append(config.right);
        } else if (config.top != null && config.bottom != null) {
            this.y = config.y || 0.5;
            this.container.className = "split-horizontal";
            this.top = this.append(config.top);
            this.horizontalBar = this.appendBar("split-bar horizontal");
            this.bottom = this.append(config.bottom);
        } else {
            throw "Bad config";
        }
        /** @type {number | undefined} */
        this.sx;
        /** @type {number | undefined} */
        this.sy;
        container.addEventListener("mousedown", this.mousedown.bind(this));
        container.addEventListener("mousemove", this.mousemove.bind(this));
        container.addEventListener("mouseup", this.mouseup.bind(this));
        window.addEventListener("keydown", this.keydown.bind(this));
        const boundResize = this.resize.bind(this);
        (new ResizeObserver(boundResize)).observe(container);
        setTimeout(boundResize);
    }
    /**
     * @param {string | object} item
     * @return {HTMLElement}
     */
    append(item) {
        const self = this;
        let part;
        if ((typeof item) === "string") {
            part = document.createElement("iframe");
            part.src = item;
        } else {
            part = document.createElement("div");
            if ((typeof item) === "object") {
                new Split(part, item);
            } else {
                function replace(url) {
                    const newPart = document.createElement("iframe");
                    newPart.src = url;
                    self.replace(part, newPart);
                }
                part.addEventListener("dragenter", event => {
                    event.dataTransfer.dropEffect = "copy";
                    event.stopPropagation();
                    event.preventDefault();
                    part.classList.add("drag-accepting");
                });
                part.addEventListener("dragleave", event => {
                    event.dataTransfer.dropEffect = "copy";
                    event.stopPropagation();
                    event.preventDefault();
                    part.classList.remove("drag-accepting");
                });
                part.addEventListener("dragover", event => {
                    event.dataTransfer.dropEffect = "copy";
                    event.stopPropagation();
                    event.preventDefault();
                });
                part.addEventListener("drop", event => {
                    event.preventDefault();
                    const items = event.dataTransfer.items;
                    let item;
                    for (item of items) {
                        if (item.kind == "file") {
                            replace(URL.createObjectURL(item.getAsFile()));
                            return;
                        }
                    }
                    for (item of items) {
                        if (item.type == "text/uri-list") {
                            item.getAsString(replace);
                            return;
                        }
                    }
                    for (item of items) {
                        if (item.type == "text/plain") {
                            item.getAsString(replace);
                            return;
                        }
                    }
                });
            }
        }
        self.container.append(part);
        return part;
    }
    /**
     * @param {string} className
     * @return {HTMLElement}
     */
    appendBar(className) {
        const bar = document.createElement("div");
        bar.className = className;
        this.container.append(bar);
        return bar;
    }
    /**
     * @param {HTMLElement} oldPart
     * @param {HTMLElement} newPart
     */
    replace(oldPart, newPart) { // old first
        for (const directionKey of ["top", "right", "bottom", "left"]) {
            if (this[directionKey] == oldPart) {
                this[directionKey] = newPart;
            }
        }
        this.container.replaceChild(newPart, oldPart); // new first
        this.resize();
    }
    /**
     * @param {function | undefined} resolve
     */
    resize(resolve) {
        const width = this.width = this.container.clientWidth;
        const height = this.height = this.container.clientHeight;
        if (this.top != null) {
            this.top.style.height = Math.floor(height * this.y - Split.#BAR_SIZE) + "px";
        }
        if (this.right != null) {
            this.right.style.width = Math.floor(width * (1.0 - this.x) - Split.#BAR_SIZE) + "px";
        }
        if (this.bottom != null) {
            this.bottom.style.height = Math.floor(height * (1.0 - this.y) - Split.#BAR_SIZE) + "px";
        }
        if (this.left != null) {
            this.left.style.width = Math.floor(width * this.x - Split.#BAR_SIZE) + "px";
        }
        if (this.verticalBar != null) {
            this.verticalBar.style.left = Math.floor(width * this.x - Split.#BAR_SIZE) + "px";
            this.verticalBar.style.right = Math.floor(width * (1.0 - this.x) - Split.#BAR_SIZE) + "px";
        }
        if (this.horizontalBar != null) {
            this.horizontalBar.style.top = Math.floor(height * this.y - Split.#BAR_SIZE) + "px";
            this.horizontalBar.style.bottom = Math.floor(height * (1.0 - this.y) - Split.#BAR_SIZE) + "px";
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
        if (target == this.verticalBar) {
            this.sx = this.x;
            hit = true;
        }
        if (target == this.horizontalBar) {
            this.sy = this.y;
            hit = true;
        }
        if (hit) {
            event.preventDefault();
            for (const directionKey of ["top", "right", "bottom", "left"]) {
                if (this[directionKey] != null) {
                    this[directionKey].style.display = "none";
                }
            }
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
            let nx = Math.max(0.0, Math.min(this.x + event.movementX / this.width, 1.0));
            if (nx != this.x) {
                this.x = nx;
                changed = true;
            }
        }
        if (this.sy != null) {
            let ny = Math.max(0.0, Math.min(this.y + event.movementY / this.height, 1.0));
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
        for (const directionKey of ["top", "right", "bottom", "left"]) {
            if (this[directionKey] != null) {
                this[directionKey].style.display = "";
            }
        }
    }
    /**
     * @param {MouseEvent} event
     * @return {boolean}
     */
    keydown(event) {
        if (event.key != "Escape") {
            return false;
        }
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
            event.preventDefault();
            this.resize();
            return true;
        } else {
            return false;
        }
    }
}
document.addEventListener("readystatechange", () => {
    const doc = document;
    if (doc.readyState !== "interactive") {
        return;
    }
    const params = new URLSearchParams(location.search);
    try {
        window.app = new Split(doc.body, JSON.parse(params.get("split")));
        doc.querySelector("main").remove();
    } catch (e) {
        console.error(e);
        const page = params.get("page") || "browser.html";
        function search(split) {
            location.search = "?split=" + encodeURIComponent(JSON.stringify(split));
        }
        doc.getElementById("buttonSplitVertial").addEventListener("click", () => {
            search({left: page, right: page});
        });
        doc.getElementById("buttonSplitHorizontal").addEventListener("click", () => {
            search({top: page, bottom: page});
        });
        doc.getElementById("buttonSplitLeft").addEventListener("click", () => {
            search({left: {top: page, bottom: page}, right: page});
        });
        doc.getElementById("buttonSplitRight").addEventListener("click", () => {
            search({left: page, right: {top: page, bottom: page}});
        });
        doc.getElementById("buttonSplitBottom").addEventListener("click", () => {
            search({top: page, bottom: {left: page, right: page}});
        });
    }
});