class Compare {
    static INTERVAL_MEASURE = 20; // ms
    static INTERVAL_PAINT = 100; // ms
    constructor() {
        /** @type {HTMLCanvasElement} */
        this.canvas = document.createElement("canvas");
        /** @type {CanvasRenderingContext2D} */
        this.context;
        this.createContext(1, 1);
    }
    createContext(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext("2d", {
            alpha: true,
            willReadFrequently: true
        });
        this.context.fillStyle = "#000000";
    }
    nextVersion() {
        /** @type {number} */
        let version = parseInt(document.body.getAttribute("version"));
        if (!(version > 0)) {
            version = 0;
        }
        version = (version + 1).toString();
        document.body.setAttribute("version", version);
        return version;
    }
    versionExpired(version) {
        if (document.body.getAttribute("version") != version) {
            this.stop();
            return true;
        } else {
            return false;
        }
    }
    stop() {
        if (this.task != null) {
            clearInterval(this.task);
            this.task = null;
        }
    }
    update() {
        this.stop();
    }
}
class FontCompare extends Compare {
    constructor() {
        super();
        /** @type {number} */
        this.maxWidth;
        /** @type {number} */
        this.maxHeight;
    }
    update(text, fill) {
        this.stop();
        /** @type {number} */
        const version = this.nextVersion();
        /** @type {HTMLElement} */
        const tbody = document.getElementById("fontCompareTbody");
        let tr;
        for (tr = tbody.firstChild; tr != null; tr = tr.nextSibling) {
            if (tr.tagName == "TR") {
                tr.setAttribute("version", "0");
                let td;
                let index = 0;
                for (td = tr.firstChild; td != null; td = td.nextSibling) {
                    if (td.tagName == "TD") {
                        index++;
                        if (index > 2) {
                            td.textContent = "";
                        }
                    }
                }
            }
        }
        TextMetricsApp.toggleClass("glyphCompareTable", "none", true);
        TextMetricsApp.toggleClass("fontCompareTable", "none", false);
        this.maxWidth = 1;
        this.maxHeight = 1;
        this.task = setInterval(() => {
            if (this.versionExpired(version)) {
                return;
            }
            const nullStart = tr == null;
            for (tr = nullStart ? tbody.firstChild : tr.nextSibling; tr != null; tr = tr.nextSibling) {
                if (tr.tagName == "TR" && tr.getAttribute("version") == "0") {
                    tr.setAttribute("version", "1");
                    this.updateTR0(tr, text);
                    return;
                }
            }
            if (nullStart) {
                clearInterval(this.task);
                if (fill) {
                    this.createContext(Math.ceil(this.maxWidth), Math.ceil(this.maxHeight));
                    this.task = setInterval(() => {
                        if (this.versionExpired(version)) {
                            return;
                        }
                        const nullStart = tr == null;
                        for (tr = nullStart ? tbody.firstChild : tr.nextSibling; tr != null; tr = tr.nextSibling) {
                            if (tr.tagName == "TR" && tr.getAttribute("version") == "1") {
                                tr.setAttribute("version", "2");
                                this.updateTR1(tr, text);
                                return;
                            }
                        }
                        if (nullStart) {
                            clearInterval(this.task);
                            this.task = null;
                        }
                    }, Compare.INTERVAL_PAINT);
                } else {
                    this.task = null;
                }
            }
        }, Compare.INTERVAL_MEASURE);
    }
    /**
     * @param {HTMLElement} tr 
     * @param {string} text 
     */
    updateTR0(tr, text) {
        try {
            let td = tr.firstElementChild; // column 1
            let font = td.textContent.trim();
            if (font.indexOf(' ') != -1) {
                font = '"' + font + '"';
            }
            font = "20px " + font;
            td = td.nextElementSibling; // column 2
            td = td.nextElementSibling; // column 3
            td.style.font = font;
            td.textContent = text;
            this.context.font = font;
            const metrics = this.context.measureText(text);
            this.maxWidth = Math.max(this.maxWidth, metrics.width);
            this.maxHeight = Math.max(this.maxHeight, metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent);
            td = td.nextElementSibling; // column 4
            td.textContent = metrics.width;
            td = td.nextElementSibling; // column 5
            td.textContent = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            td = td.nextElementSibling; // column 6
            td.textContent = metrics.fontBoundingBoxAscent;
            td = td.nextElementSibling; // column 7
            td.textContent = metrics.fontBoundingBoxDescent;
            td = td.nextElementSibling; // column 8
            td.textContent = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
            td = td.nextElementSibling; // column 9
            td.textContent = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        } catch (e) {
            console.error(e);
        }
    }
    /**
     * @param {HTMLElement} tr 
     * @param {string} text 
     */
    updateTR1(tr, text) {
        try {
            let td = tr.firstElementChild;
            let font = td.textContent.trim();
            if (font.indexOf(' ') != -1) {
                font = '"' + font + '"';
            }
            font = "20px " + font;
            this.context.font = font;
            const metrics = this.context.measureText(text);
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillText(text, 0, metrics.fontBoundingBoxAscent);
            const image = this.context.getImageData(0, 0, Math.ceil(metrics.width), Math.ceil(metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent));
            const data = image.data;
            let s = 0;
            let i = 3; // alpha
            let x, y;
            for (y = 0; y < image.height; y++) {
                for (x = 0; x < image.width; x++) {
                    s += data[i];
                    i += 4; // RGBA
                }
            }
            s = s / 255;
            td = tr.lastElementChild;
            td.textContent = (100 * s / (image.width * image.height)).toFixed(2);
            td = td.previousElementSibling;
            td.textContent = s.toFixed(2);
        } catch (e) {
            console.error(e);
        }
    }
}
class GlyphCompare extends Compare {
    constructor(fontFamily) {
        super();
        this.fontFamily = fontFamily;
        let font = fontFamily.trim();
        if (font.indexOf(' ') != -1) {
            font = '"' + font + '"';
        }
        font = "20px " + font;
        this.context.font = font;
    }
    update(text, fill) {
        this.stop();
        const version = this.nextVersion();
        const tbody = document.getElementById("glyphCompareTbody");
        const averageRow = document.getElementById("averageRow");
        tbody.clear();
        TextMetricsApp.toggleClass("fontCompareTable", "none", true);
        TextMetricsApp.toggleClass("glyphCompareTable", "none", false);
        this.maxWidth = 1;
        this.maxHeight = 1;
        this.averages = (new Array(7)).fill(0);
        const length = text.length;
        let index = 0;
        this.task = setInterval(() => {
            if (this.versionExpired(version)) {
                return;
            }
            if (index < length) {
                tbody.append(this.createTR(text[index++], fill));
            } else {
                for (let index = 2; index < 7; index++) {
                    let average = this.averages[index];
                    let td = averageRow.children[index];
                    if ((typeof average) === "number" && average >= 0) {
                        td.textContent = (average / length).toFixed(3);
                    } else {
                        td.textContent = "";
                    }
                }
                tbody.append(averageRow);
                clearInterval(this.task);
            }
        }, Compare.INTERVAL_PAINT);
    }
    createTR(char, fill) {
        const metrics = this.context.measureText(char);
        const values = [
            char.codePointAt(0).toString(16),
            char,
            metrics.width,
            metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
            "",
            ""
        ];
        for (let index = 2; index < 7; index++) {
            this.averages[index] += values[index];
        }
        if (fill) {
            values[5] = ""; // TODO
            values[6] = "";
        }
        const tr = document.createElement("tr");
        tr.append(...values.map(value => {
            const td = document.createElement("td");
            td.textContent = value;
            return td;
        }));
        return tr;
    }
}
class TextMetricsApp {
    /**
     * @param {string} tagName
     * @param {string | undefined} className
     * @param {string[] | HTMLElement[]} contents
     * @return {HTMLElement}
     */
    static createElement(tagName, className, ...contents) {
        const node = document.createElement(tagName);
        if (className != null) {
            node.className = className;
        }
        node.append(...contents);
        return node;
    }
    /**
     * @param {HTMLElement | string} element
     * @param {string} token
     * @param {boolean | null} force
     * @return {Element | null} element
     */
    static toggleClass(element, token, force) {
        if ((typeof element) === "string") {
            element = document.getElementById(element);
        }
        if (element == null) {
            return null;
        }
        element.classList.toggle(token, force);
        return element;
    }
    constructor() {
        this.fontSet = new Set();
        for (const id of ["contentTextInput", "fillAnalysisCheckboxInput", "backButton", "fontCompareTbody"]) {
            this[id] = document.getElementById(id);
        }
        this.contentTextInput.addEventListener("keydown", event => {
            if (event.key == "Enter") {
                event.preventDefault();
                this.update();
            }
        });
        document.getElementById("updateButton").addEventListener("click", this.update.bind(this));
        this.backButton.addEventListener("click", this.start.bind(this));
        this.addFont("SimSun", "宋体");
        this.addFont("FangSong", "仿宋");
        this.addFont("NSimSun", "新宋体");
        this.addFont("SimHei", "黑体");
        this.addFont("MicrosoftYaHei", "微软雅黑");
        this.addFont("DengXian", "等线");
        this.addFont("KaiTi", "楷体");
        this.fontCompareTbody.addEventListener("click", event => {
            if (!(event.target instanceof HTMLElement)) {
                return;
            }
            const td = event.target.closest("td.family");
            if (td == null) {
                return;
            }
            TextMetricsApp.toggleClass(this.backButton, "disabled", false);
            this.open(new GlyphCompare(td.textContent));
        });
        document.getElementById("addFontButton").addEventListener("click", () => {
            this.addFont(document.getElementById("fontFamilyInput").value, "");
            this.update();
        });
        this.start();
    }
    start() {
        TextMetricsApp.toggleClass(this.backButton, "disabled", true);
        this.open(new FontCompare());
    }
    open(content) {
        if (this.content != null) {
            this.content.stop();
        }
        this.content = content;
        new Promise(this.update.bind(this));
    }
    update() {
        this.content.update(
            contentTextInput.value,
            fillAnalysisCheckboxInput.checked
        );
    }
    /**
     * @param {string} family 
     * @param {string} alias 
     */
    addFont(family, alias) {
        const tr = TextMetricsApp.createElement("tr", null,
            TextMetricsApp.createElement("td", "family", family),
            TextMetricsApp.createElement("td", "alias", alias)
        );
        for (let i = 0; i < 9; i++) {
            tr.append(document.createElement("td"));
        }
        this.fontCompareTbody.append(tr);
        return tr;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    window.app = new TextMetricsApp();
    document.querySelectorAll("th").forEach(th => {
        th.addEventListener("click", event => {
            const thead = th.parentElement?.parentElement;
            const tbody = thead?.nextElementSibling;
            if (tbody == null) {
                return;
            }
            let func = text => text;
            let desc;
            thead.querySelectorAll(".sort").forEach(sort => {
                if (sort.parentNode == th) {
                    if (sort.classList.contains("asc")) {
                        sort.classList.remove("asc");
                        sort.classList.add("desc");
                        sort.innerText = "\u25bc";
                        desc = true;
                    } else {
                        sort.classList.remove("desc");
                        sort.classList.add("asc");
                        sort.innerText = "\u25b2";
                        desc = false;
                    }
                    switch (sort.getAttribute("as") || "text") {
                        case "int":
                            func = parseInt;
                            break;
                        case "float":
                            func = parseFloat;
                            break;
                        case "hex":
                            func = text => parseInt(text, 16);
                            break;
                    }
                } else {
                    sort.classList.remove("asc");
                    sort.classList.remove("desc");
                    sort.innerText = "\u25ac";
                }
            });
            if (desc != null) {
                event.preventDefault();
                sort(tbody, Array.prototype.indexOf.call(th.parentElement.children, th), func, desc);
            }
        });
    });
    function sort(tbody, index, func, desc) {
        const array = [];
        Array.prototype.forEach.call(tbody.children, (tr, order) => {
            let value = tr.children[index];
            if (value == null) {
                return;
            }
            value = func(value.textContent);
            array.push({value, order, tr});
        });
        array.sort((a, b) => {
            if (a.value > b.value) {
                return 1;
            }
            if (a.value < b.value) {
                return -1;
            }
            return a.order - b.order;
        });
        if (desc) {
            array.reverse();
        }
        console.log(tbody, index, array);
        tbody.innerHTML = "";
        tbody.append(...array.map(item => item.tr));
    }
});
window.addEventListener("dragenter", event => {
    event.dataTransfer.dropEffect = "copy";
    event.stopPropagation();
    event.preventDefault();
});
window.addEventListener("dragover", event => {
    event.dataTransfer.dropEffect = "copy";
    event.stopPropagation();
    event.preventDefault();
});
window.addEventListener("drop", event => {
    event.preventDefault();
    let files = event.dataTransfer.files;
    if (files.length == 0) {
        return;
    }
    function removeSuffix(name) {
        const pos = name.lastIndexOf('.');
        if (pos != -1) {
            return name.substring(0, pos);
        } else {
            return name;
        }
    }
    function sizeToString(size) {
        if (size > 0) {
            const units = ["B", "KB", "MB", "GB", "TB", "PB", "ZB"];
            const index = Math.max(0, Math.min(Math.floor(Math.log2(size) / 10), units.length));
            return (size / (2**(10 * index))).toPrecision(4) + units[index];
        } else {
            return size + "B";
        }
    }
    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    const dialog = document.createElement("div");
    dialog.className = "dialog";
    const h2 = document.createElement("h2");
    h2.textContent = "打开字体文件";
    dialog.append(h2);
    for (const file of files) {
        const section = document.createElement("div");
        section.className = "section";
        const info = document.createElement("div");
        info.className = "info";
        let infoSegment = document.createElement("span");
        infoSegment.className = "name";
        infoSegment.textContent = file.name;
        info.append(infoSegment);
        infoSegment = document.createElement("span");
        infoSegment.className = "mime";
        infoSegment.textContent = file.type;
        info.append(infoSegment);
        infoSegment = document.createElement("span");
        infoSegment.className = "size";
        infoSegment.textContent = sizeToString(file.size);
        info.append(infoSegment);
        infoSegment = document.createElement("span");
        infoSegment.className = "time";
        infoSegment.textContent = (new Date(file.lastModified)).toLocaleString("chinese", {hour12: false}).replace(" 24:", " 00:");
        info.append(infoSegment);
        section.append(info);
        let line = document.createElement("div");
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        input.id = "inputTextName" + Math.random();
        input.value = removeSuffix(file.name);
        let label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.textContent = "字体名称：";
        file.inputFamily = input;
        line.append(label, input);
        section.append(line);
        line = document.createElement("div");
        input = document.createElement("input");
        input.setAttribute("type", "text");
        input.id = "inputTextName" + Math.random();
        label = document.createElement("label");
        label.setAttribute("for", input.id);
        label.textContent = "别名：";
        file.inputAlias = input;
        line.append(label, input);
        section.append(line);
        dialog.append(section);
    }
    const openFontsActions = document.createElement("div");
    const inputButtonOK = document.createElement("input");
    inputButtonOK.setAttribute("type", "button");
    inputButtonOK.value = "确定";
    inputButtonOK.addEventListener("click", event => {
        event.preventDefault();
        const tbodyFontCompare = document.getElementById("tbodyFontCompare");
        for (const file of files) {
            const tr = document.createElement("tr");
            let td = document.createElement("td");
            td.textContent = file.inputFamily.value;
            tr.append(td);
            td = document.createElement("td");
            td.textContent = file.inputAlias.value;
            tr.append(td);
            for (let index = 0; index < 7; index++) {
                td = document.createElement("td");
                tr.append(td);
            }
            tbodyFontCompare.append(tr);
        }
        backdrop.remove();
    });
    openFontsActions.append(inputButtonOK);
    const inputButtonCancel = document.createElement("input");
    inputButtonCancel.setAttribute("type", "button");
    inputButtonCancel.value = "取消";
    inputButtonCancel.addEventListener("click", event => {
        event.preventDefault();
        backdrop.remove();
    });
    openFontsActions.append(inputButtonCancel);
    backdrop.append(dialog);
    document.body.append(dialog);
});