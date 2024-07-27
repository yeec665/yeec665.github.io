class Strings {
    static WHITESPACE = /\s/g;
    static DIGITS = /\d+/g;
    static DOMAIN = /:\/\/\/?([^\/#?&=]+)(\/|$)/;
    /**
     * @param {string} ch
     * @return {boolean}
     */
    static isHexDigit(ch) {
        return "ABCDEFabcdef".includes(ch);
    }
    /**
     * @param {string} string
     * @return {number}
     */
    static hashCode(string) {
        const length = string.length;
        let index, hash;
        hash = 0x50dab36f;
        for (index = 0; index < length; index++) {
            hash = 0x7fffffff & (hash * 31 + string.charCodeAt(index));
        }
        return hash;
    }
    static #COLOR_LOOP = [
        [0xf0, 0xb5, 0xb5],
        [0xe2, 0xeb, 0x95],
        [0x8e, 0xe4, 0x8e],
        [0xa5, 0xe9, 0xe3],
        [0xb5, 0xbd, 0xeb],
        [0xec, 0xba, 0xee]
    ];
    /**
     * @param {string} string
     * @return {string}
     */
    static hashColor(string) {
        const result = string.match(Strings.DOMAIN);
        if (result != null) {
            string = result[1];
        }
        // console.log(string);
        let value = Strings.hashCode(string) / 0x80000000 * Strings.#COLOR_LOOP.length;
        const index = Math.floor(value);
        const color0 = Strings.#COLOR_LOOP[index];
        const color1 = Strings.#COLOR_LOOP[(index + 1) % Strings.#COLOR_LOOP.length];
        value -= index;
        function lerp(x0, x1) {
            return Math.max(0, Math.min(Math.round(x0 + value * (x1 - x1)), 0xff));
        }
        const color = (lerp(color0[0], color1[0]) << 16) | (lerp(color0[1], color1[1]) << 8) | lerp(color0[2], color1[2]);
        return '#' + (0x7f000000 | color).toString(16).substring(2);
    }
}
class Calendar {
    static GATE = 5000000000; // from 1970/2/28 to 2128/6/11
    static SECOND = 1000; // ms
    static MINUTE = 60 * Calendar.SECOND;
    static HOUR = 60 * Calendar.MINUTE;
    static DAY = 24 * Calendar.HOUR;
    /**
     * @param {number | Date} value
     * @return {string}
     */
    static absolute(value) {
        if ((typeof value) === "number") {
            if (value < Calendar.GATE) {
                value *= 1000;
            }
            value = new Date(value);
        }
        return value.toLocaleString("chinese", {hour12: false}).replace(" 24:", " 00:");;
    }
    /**
     * @param {number} value
     * @param {number} origin
     * @return {string}
     */
    static relative(value, origin) {
        let diff = value - origin;
        let abs = Math.abs(diff);
        if (abs < Calendar.HOUR) {
            if (abs < Calendar.MINUTE) {
                return diff < 0 ? "刚才" : "稍后";
            } else {
                return Math.floor(abs / Calendar.MINUTE) + "分钟" + (diff < 0 ? "前" : "后");
            }
        } else {
            const date = new Date(origin);
            date.setHours(0, 0, 0, 0);
            origin = date.getTime();
            date.setTime(value);
            // date.setHours(0, 0, 0, 0);
            diff = Math.floor((date.getTime() - origin) / Calendar.DAY);
            abs = Math.abs(diff);
            if (abs <= 2) {
                date.setTime(value);
                return ["前天", "昨天", "今天", "明天", "后天"][2 + diff] + date.toLocaleTimeString("chinese", {hour12: false, hour: "2-digit", minute: "2-digit"}).replace("24:", "00:");
            } else if (abs <= 32) {
                return abs + (diff < 0 ? "天前" : "天后");
            } else {
                const year = date.getFullYear();
                const month = date.getMonth();
                date.setTime(origin);
                if (year == date.getFullYear()) {
                    diff = month - date.getMonth();
                    abs = Math.abs(diff);
                    return abs + (diff < 0 ? "个月前" : "个月后");
                } else {
                    diff = year - date.getFullYear();
                    abs = Math.abs(diff);
                    if (abs <= 2) {
                        return ["前年", "去年", "今年", "明年", "后年"][2 + diff] + ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"][month];
                    } else {
                        return abs + (diff < 0 ? "年前" : "年后");
                    }
                }
            }
        }
    }
}
class Browser {
    static #STORAGE_KEY = "/tool/browser";
    static #MAX_HISTORY = 50;
    constructor() {
        /** @type {string} */
        this.name = document.title;
        /** @type {Map} */
        this.history = this.load();
        window.addEventListener("pagehide", this.save.bind(this));
        this.initHeader();
        /** @type {HTMLElement} */
        this.buttonDissolve = document.getElementById("buttonDissolve");
        /** @type {HTMLElement} */
        this.addressBar = document.getElementById("addressBar");
        /** @type {HTMLElement} */
        this.historyPanel = document.createElement("main");
        /** @type {HTMLIFrameElement} */
        this.iframe = document.createElement("iframe");
        this.addressBar.addEventListener("click", event => {
            if (this.click != null) {
                this.click.call(this, event);
            }
        }, true);
        /** @type {boolean | undefined} */
        this.mute;
        document.getElementById("buttonSelectAll").addEventListener("click", this.editMode.bind(this));
        document.getElementById("buttonHistory").addEventListener("click", event => {
            if (event.ctrlKey) {
                this.export();
            } else {
                this.historyMode();
            }
        });
        const boundHashchange = this.hashchange.bind(this);
        window.addEventListener("hashchange", boundHashchange);
        setTimeout(boundHashchange);
    }
    initHeader() {
        const header = document.querySelector("header");
        header.addEventListener("dragenter", event => {
            event.dataTransfer.dropEffect = "copy";
            event.stopPropagation();
            event.preventDefault();
        });
        header.addEventListener("dragover", event => {
            event.dataTransfer.dropEffect = "copy";
            event.stopPropagation();
            event.preventDefault();
        });
        header.addEventListener("drop", event => {
            event.preventDefault();
            for (const item of event.dataTransfer.items) {
                if (item.kind == "file") {
                    this.adjustmentMode(URL.createObjectURL(item.getAsFile()), true);
                    return;
                }
            }
            for (const item of event.dataTransfer.items) {
                if (item.type == "text/uri-list") {
                    item.getAsString(text => {
                        this.adjustmentMode(text);
                        return;
                    });
                }
            }
            for (const item of event.dataTransfer.items) {
                if (item.type == "text/plain") {
                    item.getAsString(text => {
                        this.editMode(text);
                        return;
                    });
                }
            }
        });
    }
    /**
     * @return {Map}
     */
    load() {
        let list;
        try {
            list = JSON.parse(localStorage.getItem(Browser.#STORAGE_KEY));
        } catch (ignore) {}
        if (list instanceof Array) {
            const map = new Map();
            let item;
            for (item of list) {
                map.set(item.url, item);
            }
            return map;
        } else {
            return new Map();
        }
    }
    save() {
        this.addHistory();
        const list = Array.from(this.history.values());
        list.sort((a, b) => b.time - a.time); // last modify time desc
        while (list.length > Browser.#MAX_HISTORY) {
            list.pop();
        }
        localStorage.setItem(Browser.#STORAGE_KEY, JSON.stringify(list));
    }
    export() {
        const list = Array.from(this.history.values());
        list.sort((a, b) => b.time - a.time); // last modify time desc
        const blob = new Blob([JSON.stringify(list)], {type: "text/plain"});
        window.open(URL.createObjectURL(blob));
    }
    addHistory() {
        const url = this.buttonDissolve.href;
        const time = this.time;
        this.time = null;
        if (url.length > 0 && time != null) {
            const item = this.history.get(url);
            if (item != null) {
                item.time = time;
                item.count++;
            } else {
                this.history.set(url, {url, time, count: 1});
            }
        }
    }
    /**
     * @param {function | undefined} resolve
     */
    hashchange(resolve) {
        if (this.mute) {
            return;
        }
        let hash = location.hash.substring(1);
        if (hash.length > 0) {
            this.adjustmentMode(decodeURIComponent(hash));
        } else {
            this.historyMode();
        }
        if ((typeof resolve) === "function") {
            resolve();
        }
    }
    historyMode() {
        this.historyPanel.innerHTML = "";
        const list = Array.from(this.history.values());
        list.sort((a, b) => b.count - a.count); // count desc
        const now = Date.now();
        list.forEach(item => {
            const historyEntry = document.createElement("a");
            historyEntry.className = "entry";
            historyEntry.href = item.url;
            historyEntry.style.backgroundColor = Strings.hashColor(item.url);
            let segment = document.createElement("div");
            segment.className = "segment-url";
            segment.innerText = item.url;
            historyEntry.append(segment);
            segment = document.createElement("div");
            segment.className = "segment-grow";
            historyEntry.append(segment);
            segment = document.createElement("div");
            segment.className = "segment-count";
            segment.title = "累计访问次数";
            segment.innerText = item.count;
            historyEntry.append(segment);
            segment = document.createElement("div");
            segment.className = "segment-time";
            segment.title = "上次访问时间：" + Calendar.absolute(item.time);
            segment.innerText = Calendar.relative(item.time, now);
            historyEntry.append(segment);
            historyEntry.addEventListener("click", event => {
                event.preventDefault();
                this.adjustmentMode(item.url);
            });
            this.historyPanel.append(historyEntry);
        });
        if (!this.historyPanel.isConnected) {
            if (this.iframe.isConnected) {
                document.body.removeChild(this.iframe);
            }
            document.body.append(this.historyPanel);
        }
    }
    showFrame() {
        if (!this.iframe.isConnected) {
            if (this.historyPanel.isConnected) {
                document.body.removeChild(this.historyPanel);
            }
            document.body.append(this.iframe);
        }
    }
    /**
     * @param {string} address
     * @param {boolean | undefined} temporary
     */
    adjustmentMode(address, temporary) {
        const self = this;
        self.setAddress(address, temporary);
        self.showFrame();
        self.addressBar.innerHTML = "";
        const segments = [];
        function adjustmentUpdate() {
            let string = "";
            let segment;
            for (segment of segments) {
                string += segment.textContent; // no reflow
            }
            self.setAddress(string, temporary);
        }
        function click(event) {
            if (event.defaultPrevented) {
                return;
            }
            const target = event.target;
            if (target.classList.contains("segment-adjustment")) {
                return;
            }
            event.preventDefault();
            let string = "";
            let selectionStart = null;
            let selectionEnd = null;
            let segment;
            for (segment of segments) {
                if (segment == target) {
                    selectionStart = string.length;
                }
                string += segment.textContent; // no reflow
                if (segment == target) {
                    selectionEnd = string.length;
                }
            }
            self.click = null;
            self.editMode(string, selectionStart, selectionEnd);
        }
        self.click = click;
        function appendText(text) {
            const div = document.createElement("div");
            div.className = "segment-text";
            div.innerText = text;
            div.addEventListener("click", click);
            segments.push(div);
            self.addressBar.append(div);
        }
        let auto;
        function createAdjustment(segment, delta) {
            const div = document.createElement("div");
            div.className = "segment-adjustment";
            if (delta == -1) {
                div.innerText = '\u25c0';
            } else if (delta == +1) {
                div.innerText = '\u25b6';
            }
            div.addEventListener("click", event => {
                event.preventDefault();
                if (event.ctrlKey) {
                    if (auto != null) {
                        window.clearInterval(parseInt(auto.getAttribute("task")));
                        auto.classList.remove("auto");
                    }
                    if (auto != div) {
                        auto = div;
                        div.classList.add("auto");
                        let interval = new URLSearchParams(location.search);
                        interval = parseInt(interval.get("interval"));
                        interval = Math.max(100, interval || 3000);
                        div.setAttribute("task", window.setInterval(() => {
                            segment.textContent = parseInt(segment.textContent) + delta;
                            adjustmentUpdate();
                        }, interval));
                    } else {
                        auto = null;
                    }
                } else {
                    segment.textContent = parseInt(segment.textContent) + delta;
                    adjustmentUpdate();
                }
            });
            return div;
        }
        function appendAdjustment(value) {
            const divNumber = document.createElement("div");
            divNumber.className = "segment-number";
            divNumber.innerText = value;
            divNumber.addEventListener("click", click);
            segments.push(divNumber);
            const divGroup = document.createElement("div");
            divGroup.className = "segment-group";
            divGroup.append(createAdjustment(divNumber, -1), divNumber, createAdjustment(divNumber, +1));
            self.addressBar.append(divGroup);
        }
        if (temporary) {
            self.addressBar.append(address);
        } else {
            let last = 0;
            for (const segment of address.matchAll(Strings.DIGITS)) {
                if (segment.index > 0 && Strings.isHexDigit(address[segment.index - 1])) {
                    continue;
                }
                segment.end = segment.index + segment[0].length;
                if (segment.end < address.length && Strings.isHexDigit(address[segment.end])) {
                    continue;
                }
                if (last < segment.index) {
                    appendText(address.substring(last, segment.index));
                }
                appendAdjustment(parseInt(segment[0]));
                last = segment.end;
            }
            if (last < address.length) {
                appendText(address.substring(last));
            }
        }
    }
    /**
     * @param {string} address
     * @param {number | undefined} selectionStart
     * @param {number | undefined} selectionEnd
     */
    editMode(address, selectionStart, selectionEnd) {
        const self = this;
        if ((typeof address) !== "string") {
            address = self.iframe.src;
            selectionStart = null;
        }
        if (selectionStart == null || selectionEnd == null) {
            selectionStart = 0;
            selectionEnd = address.length;
        }
        self.showFrame();
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("placeholder", "about:blank");
        input.value = address;
        input.selectionStart = selectionStart;
        input.selectionEnd = selectionEnd;
        input.addEventListener("blur", submit);
        input.addEventListener("keydown", submit);
        self.addressBar.innerHTML = "";
        self.addressBar.append(input);
        input.focus();
        function submit(event) {
            if (event != null) {
                if (event.key != null && event.key != "Enter") {
                    return;
                }
                event.preventDefault();
            }
            let newAddress = input.value;
            newAddress = newAddress.replace(Strings.WHITESPACE, ''); // no whitespace in URL
            if (!(newAddress.length > 0)) {
                newAddress = "about:blank";
            }
            if (address != newAddress) {
                self.addHistory();
            }
            self.adjustmentMode(newAddress);
        }
        return submit;
    }
    /**
     * @param {string} address
     * @param {boolean | undefined} invisible
     */
    setAddress(address, invisible) {
        this.mute = true; // mute hashchange event
        if (invisible) {
            this.time = null;
        } else {
            this.time = Date.now();
        }
        this.iframe.src = address;
        this.buttonDissolve.href = address;
        location.hash = '#' + encodeURIComponent(address);
        let div = address.lastIndexOf('/');
        if (div != -1 && address.length - 16 < div && div < address.length) { // char count: min 1, max 15
            document.title = address.substring(div + 1) + " - " + this.name;
            address = null;
        }
        if (address != null) {
            document.title = this.name;
        }
        window.setTimeout(() => {
            this.mute = false; // recover hashchange event
        }, 0);
    }
    toString() {
        return this.name;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState == "interactive") {
        window.app = new Browser();
    }
});