class DefaultStyle {
    static tags = [
        "div", "p", "h1", "h2", "h3", "h4", "h5", "h6", 
        "main", "header", "footer", "nav", "aside", "article", "section","code", "pre",
        "span", "q", "i", "s", "strong", "em", "cite", "abbr", "address", "time", "dfn", "kbd", "var", "mark", "del", "ins", "sub", "sup",
        "html", "head", "body",
        "table", "table>caption", "table>thead", "table>tbody", "table>thead>tr", "table>tbody>tr", "table>thead>tr>th", "table>tbody>tr>td",
        "menu", "ul", "ul>li", "ol", "ol>li",
        "fieldset", "legend", "label", "output", "button", "textarea",
        "input.text", "input.password", "input.number", "input.range", "input.checkbox", "input.radio", "input.button", "input.hidden", "input.color", "input.date", "input.url", "input.email", "input.file",
        "select", "progress", "meter", "figure", "img", "audio", "video", "canvas", "iframe",
        "svg", "svg>g", "svg>path", "svg>rect", "svg>circle", "svg>ellipse", "svg>line", "svg>polyline", "svg>polygon"
    ];
    constructor() {
        const doc = document;
        /** @type {HTMLInputElement} */
        this.inputTextFilter = doc.getElementById("inputTextFilter");
        this.inputTextFilter.value = "";
        /** @type {HTMLElement} */
        this.actionRefresh = doc.getElementById("actionRefresh");
        /** @type {HTMLElement} */
        this.tbodyMain = doc.getElementById("tbodyMain");
        /** @type {string} */
        this.filter = "";
        /** @type {boolean} */
        this.caseSensitive = false;
        /** @type {boolean} */
        this.revert = false;
        this.init(doc);
        this.refresh();
    }
    /**
     * @param {Document} doc
     */
    init(doc) {
        this.inputTextFilter.addEventListener("input", this.throttle.bind(this));
        const toggleCaseSensitive = doc.getElementById("toggleCaseSensitive");
        toggleCaseSensitive.addEventListener("click", () => {
            this.revert = toggleCaseSensitive.classList.toggle("selected");
            this.change();
        });
        const toggleRevert = doc.getElementById("toggleRevert");
        toggleRevert.addEventListener("click", () => {
            this.revert = toggleRevert.classList.toggle("selected");
            this.change();
        });
        doc.getElementById("actionClear").addEventListener("click", () => {
            this.inputTextFilter.value = "";
            this.change();
        });
        const chooseThemeLight = doc.getElementById("chooseThemeLight");
        const chooseThemeDark = doc.getElementById("chooseThemeDark");
        chooseThemeLight.addEventListener("click", () => {
            chooseThemeLight.classList.add("selected");
            chooseThemeDark.classList.remove("selected");
            doc.body.className = "light";
        });
        chooseThemeDark.addEventListener("click", () => {
            chooseThemeDark.classList.add("selected");
            chooseThemeLight.classList.remove("selected");
            doc.body.className = "dark";
        });
        this.actionRefresh.addEventListener("click", this.refresh.bind(this));
        doc.getElementById("actionTop").addEventListener("click", () => {
            doc.documentElement.scrollTop = 0;
        });
    }
    refresh() {
        if (this.refreshTask != null) {
            return;
        }
        this.inputTextFilter.disabled = "disabled";
        this.actionRefresh.classList.add("selected");
        while (this.tbodyMain.lastChild) {
            this.tbodyMain.removeChild(this.tbodyMain.lastChild);
        }
        this.tagIndex = 0;
        this.baseStyle = null;
        this.refreshTask = window.setInterval(this.step.bind(this), 20);
    }
    step() {
        if (this.tagIndex >= DefaultStyle.tags.length) {
            window.clearInterval(this.refreshTask);
            this.refreshTask = null;
            this.actionRefresh.classList.remove("selected");
            this.inputTextFilter.disabled = "";
            return;
        }
        const tag = DefaultStyle.tags[this.tagIndex++];
        const doc = document;
        const trNode = doc.createElement("tr");
        const tagTdNode = doc.createElement("td");
        const styleTdNode = doc.createElement("td");
        let displayTdNode = doc.createElement("td");
        tagTdNode.className = "tag";
        tagTdNode.innerText = tag;
        styleTdNode.className = "style";
        displayTdNode.className = "display";
        let node = null;
        switch (tag) {
            case "html":
                node = doc.documentElement;
                displayTdNode.innerText = "none";
                break;
            case "head":
                node = doc.head;
                displayTdNode.innerText = "none";
                break;
            case "body":
                node = doc.body;
                displayTdNode.innerText = "none";
                break;
            case "fieldset":
                displayTdNode.setAttribute("rowspan", 2);
                node = doc.createElement("fieldset");
                node.innerHTML = '<legend id="legend">title</legend><div>content</div>';
                displayTdNode.appendChild(node);
                break;
            case "legend":
                node = doc.getElementById("legend");
                displayTdNode = null;
                break;
            case "ul":
            case "ol":
                displayTdNode.setAttribute("rowspan", 2);
                node = doc.createElement(tag);
                for (let i = 0; i < 3; i++) {
                    const child = doc.createElement("li");
                    child.setAttribute("id", tag + "Li" + i);
                    child.innerText = tag + " item " + i;
                    node.appendChild(child);
                }
                displayTdNode.appendChild(node);
                break;
            case "ul>li":
                node = doc.getElementById("ulLi0");
                displayTdNode = null;
                break;
            case "ol>li":
                node = doc.getElementById("olLi0");
                displayTdNode = null;
                break;
            case "table":
                displayTdNode.setAttribute("rowspan", 8);
                node = doc.createElement("table");
                node.innerHTML = '<caption id="tableCaption">caption</caption><thead id="tableThead"><tr id="tableTheadTr"><th id="tableTheadTrTh">text</th><th>text</th></tr></thead><tbody id="tableTbody"><tr id="tableTbodyTr"><td id="tableTbodyTrTd">text</td><td>text</td></tr><tr><td>text</td><td>text</td></tr></tbody>';
                displayTdNode.appendChild(node);
                break;
            case "table>caption":
                node = doc.getElementById("tableCaption");
                displayTdNode = null;
                break;
            case "table>thead":
                node = doc.getElementById("tableThead");
                displayTdNode = null;
                break;
            case "table>tbody":
                node = doc.getElementById("tableTbody");
                displayTdNode = null;
                break;
            case "table>thead>tr":
                node = doc.getElementById("tableTheadTr");
                displayTdNode = null;
                break;
            case "table>tbody>tr":
                node = doc.getElementById("tableTbodyTr");
                displayTdNode = null;
                break;
            case "table>thead>tr>th":
                node = doc.getElementById("tableTheadTrTh");
                displayTdNode = null;
                break;
            case "table>tbody>tr>td":
                node = doc.getElementById("tableTbodyTrTd");
                displayTdNode = null;
                break;
            case "svg":
                displayTdNode.setAttribute("rowspan", 9);
                node = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
                node.setAttribute("width", "100%");
                node.setAttribute("height", "100%");
                node.setAttribute("viewBox", "0 0 12 72")
                node.innerHTML = '<g id="svgG" fill="turquoise" stroke="slateblue" stroke-width="0.1"><path id="svgPath" d="M2,23L10,23L6,17Z"></path><rect id="svgRect" x="2" y="25" width="8" height="6"></rect><circle id="svgCircle" cx="6" cy="36" r="3"></circle><ellipse id="svgEllipse" cx="6" cy="44" rx="5" ry="3"></ellipse><line id="svgLine" x1="1" y1="49" x2="11" y2="55"></line><polyline id="svgPolyline" points="1,57 11,57 11,63 7,63"></polyline><polygon id="svgPolygon" points="1,65 11,65 11,71 7,71"></polygon></g>';
                displayTdNode.appendChild(node);
                break;
            case "svg>g":
                node = doc.getElementById("svgG");
                displayTdNode = null;
                break;
            case "svg>path":
                node = doc.getElementById("svgPath");
                displayTdNode = null;
                break;
            case "svg>rect":
                node = doc.getElementById("svgRect");
                displayTdNode = null;
                break;
            case "svg>circle":
                node = doc.getElementById("svgCircle");
                displayTdNode = null;
                break;
            case "svg>ellipse":
                node = doc.getElementById("svgEllipse");
                displayTdNode = null;
                break;
            case "svg>line":
                node = doc.getElementById("svgLine");
                displayTdNode = null;
                break;
            case "svg>polyline":
                node = doc.getElementById("svgPolyline");
                displayTdNode = null;
                break;
            case "svg>polygon":
                node = doc.getElementById("svgPolygon");
                displayTdNode = null;
                break;
            default:
                let div = tag.indexOf(".");
                if (div > 0) {
                    node = doc.createElement(tag.substring(0, div));
                    node.setAttribute("type", tag.substring(div + 1));
                } else {
                    node = doc.createElement(tag);
                    node.innerText = "text";
                }
                displayTdNode.appendChild(node);
        }
        if (node == null) {
            return;
        }
        trNode.appendChild(tagTdNode);
        trNode.appendChild(styleTdNode);
        if (displayTdNode != null) {
            trNode.appendChild(displayTdNode);
        }
        this.tbodyMain.appendChild(trNode);
        const ulNode = doc.createElement("ul");
        ulNode.className = "style";
        function addLi(text) {
            const liNode = doc.createElement("li");
            liNode.className = "style";
            liNode.innerText = text;
            ulNode.appendChild(liNode);
        }
        const style = window.getComputedStyle(node);
        let compare = {};
        if (this.baseStyle == null) {
            this.baseStyle = style;
        } else {
            compare = this.baseStyle;
        }
        let key;
        for (key of style) {
            if (key.toLowerCase() == key && !key.startsWith("-") && compare[key] != style[key]) {
                addLi(key + ": " + style[key]);
            }
        }
        styleTdNode.appendChild(ulNode);
    }
    throttle() {
        const filter = this.inputTextFilter.value;
        window.setTimeout(() => {
            if (this.filter != filter && filter == inputTextFilter.value) {
                this.filter = filter;
                this.change();
            }
        }, 300);
    }
    change() {
        let filter = this.filter;
        if (filter == "") {
            document.querySelectorAll("li.style").forEach(node => {
                node.style = "";
            });
        } else {
            let styleTrue, styleFalse;
            if (this.revert) {
                styleTrue = "display: none";
                styleFalse = "";
            } else {
                styleTrue = "";
                styleFalse = "display: none";
            }
            const caseInsensitive = !this.caseSensitive;
            if (caseInsensitive) {
                filter = filter.toLowerCase();
            }
            let text;
            document.querySelectorAll("li.style").forEach(node => {
                text = node.innerText;
                if (caseInsensitive) {
                    text = text.toLowerCase();
                }
                if (text.includes(filter)) {
                    node.style = styleTrue;
                } else {
                    node.style = styleFalse;
                }
            });
        }
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        window.app = new DefaultStyle();
    }
});