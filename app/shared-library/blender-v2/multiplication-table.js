class MultiplicationTable {
    static FONTS = [
        "monospace",
        "'宋体',monospace",
        "'黑体',monospace"
    ];
    static PRESETS = [
        [['0', 10], ['A', 26], ['a', 26], '?'],
        [['0', 10], ['a', 26], ['A', 26], '?'],
        ['\u25ef', ['\u2460', 20], ['\u3251', 15], ['\u32b1', 15], ['\u24b6', 26], ['\u24d0', 26], '?'],
        "零一二三四五六七八九？",
        "零壹贰叁肆伍陆柒捌玖？",
    ];
    static MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    static STORAGE_KEY = "/app/shared-library/blender/multiplication-table";
    static CONFIG = Object.freeze({
        operator: 3,
        numeralSystem: 0,
        preset: 0,
        radix: 10,
        noSeparator: false,
        textColor: "#ffffff",
        fontSize: 22,
        fontWeight: 400,
        fontFamily: MultiplicationTable.FONTS[2],
        direction: "ltr",
        writingMode: "horizontal-tb",
        textOrientation: "mixed",
        content: "calendar",
        caption: "乘法表",
        borderColor: "#cccccc",
        shape: 1,
        textAlign: 0,
        borderCollapse: true,
        vacantResult: false,
        underlineResult: false,
    });
    static {
        const presets = MultiplicationTable.PRESETS;
        const length = presets.length;
        let index, item, segment, text;
        for (index = 0; index < length; index++) {
            item = presets[index];
            if (!(item instanceof Array)) {
                continue;
            }
            text = "";
            for (segment of item) {
                if (segment instanceof Array) {
                    let ch = segment[0];
                    if ((typeof ch) === "string") {
                        ch = ch.charCodeAt(0);
                    }
                    let count = segment[1];
                    while (count > 0) {
                        text += String.fromCharCode(ch);
                        ch++;
                        count--;
                    }
                } else if ((typeof segment) === "string") {
                    text += segment;
                }
            }
            presets[index] = text;
        }
        Object.freeze(MultiplicationTable);
    }
    constructor() {
        /** @type {object} */
        let config = null;
        try {
            config = JSON.parse(localStorage.getItem(MultiplicationTable.STORAGE_KEY));
        } catch (e) {}
        if (config == null) {
            config = {};
        }
        for (const key in MultiplicationTable.CONFIG) {
            if ((typeof MultiplicationTable.CONFIG[key]) === (typeof config[key])) {
                this[key] = config[key];
            } else {
                this[key] = MultiplicationTable.CONFIG[key];
            }
        }
        window.addEventListener("pagehide", () => {
            localStorage.setItem(MultiplicationTable.STORAGE_KEY, JSON.stringify(this, Object.keys(MultiplicationTable.CONFIG)));
        });
        window.setTimeout(this.init.bind(this), 0);
    }
    init() {
        window.addEventListener("keydown", event => {
            if (event.ctrlKey && event.key == "F11") {
                if (document.fullscreenElement != null) {
                    event.preventDefault();
                    document.exitFullscreen();
                    return;
                }
                const tablePanel = document.getElementById("tablePanel");
                if (tablePanel != null) {
                    event.preventDefault();
                    tablePanel.requestFullscreen();
                }
            }
        });
        for (const id of ["mainTable", "mainCaption", "mainTbody", "attributePanel"]) {
            this[id] = document.getElementById(id);
        }
        for (const part of ["Sign", "Text", "Table", "Animation"]) {
            this.attributePanel.appendChild(this["build" + part + "Attribute"]());
        }
        this.changeStyle();
        this.changePreset();
    }
    /**
     * @returns {HTMLElement} same as Control.disclosure(node, label, open)
     */
    buildSignAttribute() {
        const operator = Control.enum(this, "operator", this.changeTable, ["+", "＋", "*", "×"]);
        const numeralSystem = Control.enum(this, "numeralSystem", this.changeSystem, ["进制", "罗马", "格雷"]);
        const preset = Control.enum(this, "preset", this.changePreset, ["123ABCabc", "123abcABC", "\u2460\u2461\u2462", "一二三", "壹贰叁"]);
        preset.classList.add("vertical");
        const radix = Control.discrete(null, this, "radix", this.changeRadix, null, 2, 100);
        const signs = Control.text(null, this, "signs", this.changeTable, "");
        const noSeparator = Control.check("无分隔符", this, "noSeparator", this.changeTable);
        return Control.disclosure([
            Utility.div("label pad", "运算符"),
            operator,
            Utility.div("label pad", "计数系统"),
            numeralSystem,
            Utility.div("label pad", "数字预设"),
            preset,
            Utility.div("label pad", "进制"),
            radix,
            Utility.div("label pad", "符号表"),
            signs,
            noSeparator
        ], "符号", true);
    }
    /**
     * @returns {HTMLElement} same as Control.disclosure(node, label, open)
     */
    buildTextAttribute() {
        const textColor = Control.color(this, "textColor", this.changeStyle, null);
        const fontSize = Control.discrete("字号", this, "fontSize", this.changeStyle, null, 5, 100);
        const fontFamily = Control.select("字体", this, "fontFamily", this.changeStyle, new Set(MultiplicationTable.FONTS));
        const fontWeight = Control.discrete("加粗", this, "fontWeight", this.changeStyle, null, 100, 900);
        const direction = Control.select("文字方向", this, "direction", this.changeStyle, {
            "从左到右": "ltr",
            "从右到左": "rtl"
        });
        const writingMode = Control.select("书写模式", this, "writingMode", this.changeStyle, {
            "横向": "horizontal-tb",
            "纵向从右到左": "vertical-rl",
            "纵向从左到右": "vertical-lr"
        });
        const textOrientation = Control.select("文字方位", this, "textOrientation", this.changeStyle, {
            "混合": "mixed",
            "正立": "upright",
            "侧向右": "sideways-right",
            "侧向": "sideways",
            "字形方向": "use-glyph-orientation"
        });
        return Control.disclosure([
            Utility.div("label pad", "文字颜色"),
            textColor,
            fontSize, fontFamily, fontWeight, direction, writingMode, textOrientation
        ], "文字", false);
    }
    /**
     * @returns {HTMLElement} same as Control.disclosure(node, label, open)
     */
    buildTableAttribute() {
        const content = Control.enum(this, "content", this.changeTable, {
            "乘法表": "multiplication",
            "日历": "calendar"
        });
        const caption = Control.text(null, this, "caption", this.changeStyle, null);
        const borderColor = Control.color(this, "borderColor", this.changeStyle, null);
        const shape = Control.enum(this, "shape", this.changeTable, ["矩形", "上三角", "下三角"]);
        const textAlign = Control.enum(this, "textAlign", this.changeStyle, ["左", "中", "右"]);
        const borderCollapse = Control.check("边框合并", this, "borderCollapse", this.changeStyle, null);
        const vacantResult = Control.check("结果空缺", this, "vacantResult", this.changeTable, null);
        const underlineResult = Control.check("结果加下划线", this, "underlineResult", this.changeTable, null);
        return Control.disclosure([
            Utility.div("label pad", "内容"),
            content,
            Utility.div("label pad", "标题"),
            caption,
            Utility.div("label pad", "边框颜色"),
            borderColor,
            Utility.div("label pad", "形状"),
            shape,
            Utility.div("label pad", "文字对齐"),
            textAlign,
            borderCollapse,
            vacantResult,
            underlineResult
        ], "表格", true);
    }
    buildAnimationAttribute() {
        return Control.disclosure([], "动画", false);
    }
    changeStyle() {
        console.trace("changeStyle");
        const style = this.mainTable.style;
        style.color = this.textColor;
        style.fontSize = this.fontSize + "px";
        style.fontFamily = this.fontFamily;
        style.fontWeight = this.fontWeight;
        style.direction = this.direction;
        style.writingMode = this.writingMode;
        style.textOrientation = this.textOrientation;
        style.borderColor = this.borderColor;
        style.textAlign = ["left", "center", "right"][this.textAlign];
        style.borderCollapse = this.borderCollapse ? "collapse" : "separate";
        this.mainCaption.innerText = this.caption;
    }
    changeSystem() {
        console.trace("changeSystem");
    }
    changePreset() {
        console.trace("changePreset");
        let signs = "";
        for (let index = 0; index < this.radix; index++) {
            signs += this.charAt(index);
        }
        this.signs = signs;
        this.changeTable();
    }
    changeRadix() {
        console.trace("changeRadix");
        let signs = this.signs;
        if (signs == null) {
            signs = "";
        }
        let index = signs.length;
        if (index > this.radix) {
            signs = signs.substring(0, this.radix);
        } else {
            while (index < this.radix) {
                signs += this.charAt(index++);
            }
        }
        if (this.signs != signs) {
            this.signs = signs;
            this.changeTable();
        }
    }
    changeTable() {
        console.trace("changeTable");
        this.mainTbody.innerHTML = "";
        if (this.content == "calendar") {
            this.buildCalendar();
        } else {
            this.buildMultiplication();
        }
    }
    buildMultiplication() {
        const radix = this.signs.length;
        let x, y, x1, x2, td, tr;
        for (y = 1; y < radix; y++) {
            x1 = 0;
            x2 = radix;
            if (this.shape == 1) {
                x1 = y;
            } else if (this.shape == 2) {
                x2 = y;
            }
            tr = Utility.element("tr");
            for (x = 1; x < radix; x++) {
                td = Utility.element("td");
                if (x1 <= x && x <= x2) {
                    td.className = "content";
                    td.innerText = this.equationToString(x, y);
                }
                tr.appendChild(td);
            }
            this.mainTbody.appendChild(tr);
        }
    }
    buildCalendar() {
        const date = new Date();
        let x, y, td, tr;
        for (y = 0; y < 3; y++) {
            tr = Utility.element("tr");
            for (x = 0; x < 4; x++) {
                date.setMonth(4 * y + x, 1);
                td = Utility.element("td");
                td.className = "month";
                td.appendChild(this.buildCalendarMonth(date));
                tr.appendChild(td);
            }
            this.mainTbody.appendChild(tr);
        }
    }
    /**
     * @param {Date} date
     * @returns {HTMLElement}
     */
    buildCalendarMonth(date) {
        const name = MultiplicationTable.MONTHS[date.getMonth()];
        const tbody = Utility.element("tbody");
        const start = date.getDay();
        date.setMonth(date.getMonth() + 1, 0);
        const end = date.getDate();
        let x, y, i, td, tr;
        i = -start;
        for (y = 0; y < 6; y++) {
            tr = Utility.element("tr");
            tr.className = "week";
            for (x = 0; x < 7; x++) {
                td = Utility.element("td");
                if (0 <= i && i < end) {
                    td.className = "date content";
                    td.innerText = (i + 1);
                } else {
                    td.className = "date";
                }
                tr.appendChild(td);
                i++;
            }
            tbody.appendChild(tr);
            if (i >= end) {
                break;
            }
        }
        const table = Utility.element("table");
        table.innerHTML = '<caption>' + name + '</caption><thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thr</th><th>Fri</th><th>Sat</th></tr></thead>';
        table.appendChild(tbody);
        return table;
    }
    /**
     * @param {number} index
     * @returns {string}
     */
    charAt(index) {
        const preset = MultiplicationTable.PRESETS[this.preset] || MultiplicationTable.PRESETS[0];
        return preset[index] || preset[preset.length - 1];
    }
    /**
     * @param {number} x column index starts from 1
     * @param {number} y row index starts from 1
     * @returns {string}
     */
    equationToString(x, y) {
        const signs = this.signs;
        switch (this.operator) {
            case 0:
                return signs[x] + "+" + signs[y] + "=" + this.numberToString(signs, x + y);
            case 1:
                return signs[x] + "＋" + signs[y] + "＝" + this.numberToString(signs, x + y);
            default:
            case 2:
                return signs[x] + "*" + signs[y] + "=" + this.numberToString(signs, x * y);
            case 3:
                return signs[x] + "×" + signs[y] + "＝" + this.numberToString(signs, x * y);
        }
    }
    /**
     * @param {string} signs
     * @param {number} value
     * @returns {string}
     */
    numberToString(signs, value) {
        const radix = Math.max(2, signs.length);
        let text = "";
        while (value != 0) {
            text = signs[value % radix] + text;
            value = Math.floor(value / radix);
        }
        return text;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    Control.install();
    Split.install();
    window.app = new MultiplicationTable();
});