class FloatView {
    /**
     * @return {boolean}
     */
    static isBigEndian() {
        const array32 = Uint32Array.of(0x12345678);
        const array8 = new Uint8Array(array32.buffer);
        return array8[0] == 0x12;
    }
    /**
     * @param {number} bits
     * @return {number}
     * DataView accessors provide explicit control of how data is accessed, regardless of the executing computer's endianness.
     */
    static encodeFloat32(bits) {
        const view = new DataView(new ArrayBuffer(4));
        view.setUint32(0, bits);
        return view.getFloat32(0);
    }
    /**
     * @param {number} high
     * @param {number} low
     * @return {number}
     */
    static encodeFloat64(high, low) {
        const view = new DataView(new ArrayBuffer(8));
        view.setUint32(0, high); // littleEndian default to false
        view.setUint32(4, low);
        return view.getFloat64(0);
    }
    /**
     * @return {number}
     */
    static randomFloat64() {
        return this.encodeFloat64(
            Math.floor(0x100000000 * Math.random()),
            Math.floor(0x100000000 * Math.random())
        );
    }
    /**
     * @param {number} value
     * @return {number[]} length = 32, content = 0 or 1
     */
    static decodeInt32(value) {
        const view = new DataView(new ArrayBuffer(4));
        view.setInt32(0, value);
        const bits = [];
        for (let i = 0; i < 4; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    /**
     * @param {number} value
     * @return {number[]} length = 32, content = 0 or 1
     */
    static decodeUint32(value) {
        const view = new DataView(new ArrayBuffer(4));
        view.setInt32(0, value);
        const bits = [];
        for (let i = 0; i < 4; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    /**
     * @param {number} value
     * @return {number[]} length = 64, content = 0 or 1
     */
    static decodeInt64(value) {
        const view = new DataView(new ArrayBuffer(8));
        view.setBigInt64(0, BigInt(value));
        const bits = [];
        for (let i = 0; i < 8; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    /**
     * @param {number} value
     * @return {number[]} length = 64, content = 0 or 1
     */
    static decodeUint64(value) {
        const view = new DataView(new ArrayBuffer(8));
        view.setBigUint64(0, BigInt(value));
        const bits = [];
        for (let i = 0; i < 8; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    /**
     * @param {number} value
     * @return {number[]} length = 32, content = 0 or 1
     */
    static decodeFloat32(value) {
        const view = new DataView(new ArrayBuffer(4));
        view.setFloat32(0, value);
        const bits = [];
        for (let i = 0; i < 4; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    /**
     * @param {number} value
     * @return {number[]} length = 64, content = 0 or 1
     */
    static decodeFloat64(value) {
        const view = new DataView(new ArrayBuffer(8));
        view.setFloat64(0, value);
        const bits = [];
        for (let i = 0; i < 8; i++) {
            let byte = view.getUint8(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((byte >> j) & 1);
            }
        }
        return bits;
    }
    static JAVA = {
        lang: {
            Character: {
                "MIN_HIGH_SURROGATE": 0xd800,
                "MAX_HIGH_SURROGATE": 0xdbff,
                "MIN_LOW_SURROGATE": 0xdc00,
                "MAX_LOW_SURROGATE": 0xdfff,
                "MIN_SURROGATE": 0xd800,
                "MAX_SURROGATE": 0xdfff,
                "MIN_SUPPLEMENTARY_CODE_POINT": 0x010000,
                "MIN_CODE_POINT": 0x000000,
                "MAX_CODE_POINT": 0x10ffff,
                "SIZE": 16,
                "BYTES": 2
            },
            Integer: {
                "MAX_VALUE": 2 ** 31 - 1,
                "MIN_VALUE": -(2 ** 31),
                "SIZE": 32,
                "BYTES": 4
            },
            Long: {
                "MAX_VALUE": 2 ** 63 - 1,
                "MIN_VALUE": -(2 ** 63),
                "SIZE": 64,
                "BYTES": 8
            },
            Float: {
                "POSITIVE_INFINITY": Number.POSITIVE_INFINITY,
                "NEGATIVE_INFINITY": Number.NEGATIVE_INFINITY,
                "NaN": Number.NaN,
                "MAX_VALUE": FloatView.encodeFloat32(0x7f7fffff),
                "MIN_NORMAL": FloatView.encodeFloat32(0x00800000),
                "MIN_VALUE": FloatView.encodeFloat32(0x1),
                "MAX_EXPONENT": 127,
                "MIN_EXPONENT": -126,
                "SIZE": 32,
                "BYTES": 4
            },
            Double: {
                "POSITIVE_INFINITY": Number.POSITIVE_INFINITY,
                "NEGATIVE_INFINITY": Number.NEGATIVE_INFINITY,
                "NaN": Number.NaN,
                "MAX_VALUE": FloatView.encodeFloat64(0x7fefffff, 0xffffffff),
                "MIN_NORMAL": FloatView.encodeFloat64(0x00100000, 0x0),
                "MIN_VALUE": FloatView.encodeFloat64(0x1),
                "MAX_EXPONENT": 1023,
                "MIN_EXPONENT": -1022,
                "SIZE": 64,
                "BYTES": 8
            }
        }
    };
    static STD = {
        "numeric_limits": {
            "quiet_NaN": FloatView.encodeFloat64(0x7ff80000, 0x0),
            "signaling_NaN": FloatView.encodeFloat64(0x7ff00001, 0x0)
        }
    }
    static EXPRESSIONS = [
        "0.1 + 0.2",
        "0.3",
        "-0.0",
        "Math.random()",
        "Number.NaN",
        "Number.POSITIVE_INFINITY",
        "Number.NEGATIVE_INFINITY",
        "Number.MAX_VALUE",
        "Number.MIN_VALUE",
        "Number.MAX_SAFE_INTEGER",
        "Number.MIN_SAFE_INTEGER",
        "Number.EPSILON",
        "java.lang.Integer.MAX_VALUE",
        "java.lang.Integer.MIN_VALUE",
        "java.lang.Long.MAX_VALUE",
        "java.lang.Long.MIN_VALUE",
        "java.lang.Float.MAX_VALUE",
        "java.lang.Float.MIN_NORMAL",
        "java.lang.Float.MIN_VALUE",
        "java.lang.Double.MIN_NORMAL",
        "std.numeric_limits.quiet_NaN",
        "std.numeric_limits.signaling_NaN"
    ];
    /**
     * @param {string | undefined} className
     * @param {string[] | HTMLElement[]} contents
     * @return {HTMLDivElement}
     */
    static div(className, ...content) {
        const div = document.createElement("div");
        if (className != null) {
            div.className = className;
        }
        div.append(...content);
        return div;
    }
    /**
     * @param {HTMLElement} element
     * @param {function} callback
     * @return {HTMLElement}
     */
    static click(element, callback) {
        element.addEventListener("click", callback);
        return element;
    }
    /**
     * @param {string | undefined} className
     * @param {string | undefined} legendText
     * @param {string[] | HTMLElement[]} contents
     * @return {HTMLFieldSetElement}
     */
    static fieldset(className, legendText, ...content) {
        const fieldset = document.createElement("fieldset");
        if (className != null) {
            fieldset.className = className;
        }
        if (legendText != null) {
            const legend = document.createElement("legend");
            legend.textContent = legendText;
            fieldset.append(legend);
        }
        fieldset.append(...content);
        return fieldset;
    }
    /**
     * @param {string | number | undefined} expression
     * @param {HTMLElement | undefined} before
     */
    constructor(expression, before) {
        if (expression == null) {
            expression = FloatView.randomFloat64();
        }
        expression = String(expression);
        /** @type {HTMLElement} */
        this.root = this.card(expression);
        /** @type {HTMLInputElement} */
        this.input;
        /** @type {HTMLElement} */
        this.output;
        /** @type {HTMLElement} */
        this.dataTypes;
        if (before != null) {
            if (before.nextElementSibling != null) {
                before.parentNode.insertBefore(this.root, before.nextElementSibling);
            } else {
                before.parentNode.append(this.root);
            }
        } else {
            document.body.append(this.root);
        }
        /** @type {number | undefined} */
        this.value;
        this.evaluate(expression);
        setTimeout(() => this.root.classList.add("opaque"));
    }
    /**
     * @param {string} expression
     * @return {HTMLElement}
     */
    card(expression) {
        return FloatView.div("split card",
            FloatView.div("row io-actions",
                FloatView.div("input",
                    FloatView.click(FloatView.div("presets button", "…"), this.popup.bind(this)),
                    this.input = this.textInput(expression)
                ),
                this.output = FloatView.div("output"),
                FloatView.click(FloatView.div("duplicate button", "+"), this.duplicate.bind(this)),
                FloatView.click(FloatView.div("remove button", "-"), this.remove.bind(this))
            ),
            this.dataTypes = FloatView.div("row data-types")
        );
    }
    /**
     * @param {string} expression
     * @return {HTMLElement}
     */
    textInput(expression) {
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("autocomplete", "off");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("autocorrect", "false");
        input.setAttribute("value", expression);
        input.addEventListener("change", () => this.evaluate(input.value));
        return input;
    }
    /**
     * @param {string} expression
     */
    evaluate(expression) {
        this.output.className = "output";
        this.output.innerHTML = "";
        this.dataTypes.innerHTML = "";
        delete this.value;
        try {
            const value = (new Function("java", "std", "return " + expression)).call(window, FloatView.JAVA, FloatView.STD);
            const type = typeof value;
            if (type === "number") {
                this.value = value;
                const string = String(value);
                if (expression != string) {
                    this.output.textContent = " = " + string;
                }
                if (Number.isInteger(value)) {
                    if (-(2**31) <= value && value < 2**31) {
                        this.dataTypes.append(FloatView.fieldset("int32", "带符号32位整数",
                            ...FloatView.decodeInt32(value).map(bit => FloatView.div("bit", bit))
                        ));
                    }
                    if (0 <= value && value < 2**32) {
                        this.dataTypes.append(FloatView.fieldset("uint32", "无符号32位整数",
                            ...FloatView.decodeUint32(value).map(bit => FloatView.div("bit", bit))
                        ));
                    }
                    if (-(2**63) <= value && value < 2**63) {
                        this.dataTypes.append(FloatView.fieldset("int64", "带符号64位整数",
                            ...FloatView.decodeInt64(value).map(bit => FloatView.div("bit", bit))
                        ));
                    }
                    if (0 <= value && value < 2**64) {
                        this.dataTypes.append(FloatView.fieldset("uint64", "无符号64位整数",
                            ...FloatView.decodeUint64(value).map(bit => FloatView.div("bit", bit))
                        ));
                    }
                }
                this.dataTypes.append(FloatView.fieldset("float32", "32位浮点数",
                    ...FloatView.decodeFloat32(value).map(bit => FloatView.div("bit", bit))
                ));
                this.dataTypes.append(FloatView.fieldset("float64", "64位浮点数",
                    ...FloatView.decodeFloat64(value).map(bit => FloatView.div("bit", bit))
                ));
            } else {
                this.output.className = "output warn";
                this.output.textContent = "type mismatch: " + type;
            }
        } catch (e) {
            this.output.className = "output error";
            this.output.textContent = e;
        }
    }
    /**
     * @param {Event} event
     */
    popup(event) {
        const popupMenu = FloatView.div("popup-menu",
            ...FloatView.EXPRESSIONS.map(exp => FloatView.click(
                FloatView.div("menu-item", exp),
                () => this.evaluate(this.input.value = exp)
            ))
        );
        this.input.parentNode.insertBefore(popupMenu, this.input);
        event.stopPropagation();
    }
    /**
     * @return {FloatView} copy
     */
    duplicate() {
        return new FloatView(this.input.value, this.root);
    }
    remove() {
        return this.root.remove();
    }
}
window.addEventListener("load", () => {
    const style = document.createElement("style");
    const checkboxes = document.querySelectorAll("input[token]");
    function change() {
        let styleSheet = ".none";
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                styleSheet = styleSheet + ",." + checkbox.getAttribute("token");
            }
        });
        style.textContent = styleSheet + "{display:none;}";
    }
    document.head.append(style);
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", change);
    });
    change();
    window.addEventListener("click", event => {
        popupMenu = document.querySelector(".popup-menu");
        if (popupMenu != null) {
            popupMenu.remove();
            event.stopPropagation();
        }
    });
});
window.addEventListener("load", () => new FloatView());
