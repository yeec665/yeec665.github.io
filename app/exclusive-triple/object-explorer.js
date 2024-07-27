(() => { // no additional property added to window
    /**
     * @param {string | null} className
     * @param {string | null} text
     * @return {HTMLElement}
     */
    function newDiv(className, text) {
        const div = document.createElement("div");
        if (className != null) {
            div.className = className;
        }
        if (text != null) {
            div.innerText = text;
        }
        return div;
    }
    /**
     * @param {string | null} text
     * @return {HTMLElement}
     */
    function newTd(text) {
        const td = document.createElement("td");
        if (text != null) {
            td.innerText = text;
        }
        return td;
    }
    function buildObject() {
        const params = new URLSearchParams(location.search);
        let form = params.get("form");
        if (form != "tree") {
            form = "table";
        }
        let path = params.get("path");
        if (path == null) {
            path = "";
        }
        let object = window;
        let shownPath = "window";
        let key;
        for (key of path.split("/")) {
            key = decodeURIComponent(key);
            if (key == null || key.length == 0) {
                continue;
            }
            object = object[key];
            shownPath = shownPath + "." + key;
            if (object == null) {
                break;
            }
        }
        buildHeader(object, shownPath);
        const prefix = "?form=" + form + "&path=" + path + "/";
        buildTable(object, prefix);
    }
    /**
     * @param {any} object
     * @param {string} shownPath
     */
    function buildHeader(object, shownPath) {
        const header = document.querySelector("header");
        header.innerHTML = "";
        const type = typeof object;
        header.append(
            newDiv("key", "path"),
            newDiv("value", shownPath),
            newDiv("key", "typeof"),
            newDiv("value", type)
        );
        if (object != null) {
            header.appendChild(newDiv(object.hasOwnProperty("valueOf") ? "key own" : "key", "valueOf"));
            header.appendChild(newDiv("value string", object.valueOf()));
            header.appendChild(newDiv(object.hasOwnProperty("toString") ? "key own" : "key", "toString"));
            header.appendChild(newDiv("value string", object.toString()));
            if (type === "object" || type === "function") {
                header.appendChild(newDiv("key", "isExtensible"));
                header.appendChild(newDiv("value boolean", Object.isExtensible(object)));
                header.appendChild(newDiv("key", "isSealed"));
                header.appendChild(newDiv("value boolean", Object.isSealed(object)));
                header.appendChild(newDiv("key", "isFrozen"));
                header.appendChild(newDiv("value boolean", Object.isFrozen(object)));
                if (object instanceof HTMLElement) {
                    header.appendChild(newDiv("key", "tagName"));
                    header.appendChild(newDiv("value string", object.tagName));
                    header.appendChild(newDiv("key", "id"));
                    header.appendChild(newDiv("value string", object.id));
                    header.appendChild(newDiv("key", "className"));
                    header.appendChild(newDiv("value string", object.className));
                    header.appendChild(newDiv("key", "childElementCount"));
                    header.appendChild(newDiv("value number", object.childElementCount));
                    header.appendChild(newDiv("key", "style"));
                    header.appendChild(newDiv("value string", object.style.cssText));
                }
            }
        }
    }
    /**
     * @param {object | null} object
     * @param {string} prefix
     */
    function buildTable(object, prefix) {
        const tbody = document.querySelector("tbody");
        tbody.innerHTML = "";
        if (object == null) {
            return;
        }
        const ownProperties = Object.getOwnPropertyDescriptors(object);
        let key, property, value, tr, td;
        for (key in ownProperties) {
            property = ownProperties[key];
            value = object[key];
            tr = document.createElement("tr");
            tr.id = key;
            td = document.createElement("td");
            if ((typeof key) === "string") {
                td.className = "string";
                const anchor = document.createElement("a");
                anchor.href = prefix + encodeURIComponent(key);
                anchor.innerText = key;
                td.appendChild(anchor);
            } else {
                td.className = "symbol";
                td.innerText = key;
            }
            tr.appendChild(td);
            tr.appendChild(newTd("true"));
            tr.appendChild(newTd(property.writable));
            tr.appendChild(newTd(property.enumerable));
            tr.appendChild(newTd(property.configurable));
            tr.appendChild(newTd(typeof(value)));
            tr.appendChild(newTd(property.set?.name));
            tr.appendChild(newTd(property.get?.name));
            tr.appendChild(newTd(value?.constructor?.name));
            tbody.appendChild(tr);
        }
        for (key in object) {
            if (ownProperties[key] != null) {
                continue;
            }
            value = object[key];
            tr = document.createElement("tr");
            tr.id = key;
            td = document.createElement("td");
            if ((typeof key) === "string") {
                td.className = "string";
                const anchor = document.createElement("a");
                anchor.href = prefix + encodeURIComponent(key);
                anchor.innerText = key;
                td.appendChild(anchor);
            } else {
                td.className = "symbol";
                td.innerText = key;
            }
            tr.appendChild(td);
            tr.appendChild(newTd("false"));
            tr.appendChild(newTd());
            tr.appendChild(newTd());
            tr.appendChild(newTd());
            tr.appendChild(newTd(typeof(value)));
            tr.appendChild(newTd());
            tr.appendChild(newTd());
            tr.appendChild(newTd(value?.constructor?.name));
            tbody.appendChild(tr);
        }
    }
    function buildTree() {
        // tree functions to be removed; another tool will contain it
    }
    function treeBody(tree, object) {
        const body = newDiv("body");
        return body;
    }
    function treeItem(tree, key, value) {
        return null;
    }
    function treeHead(tree, object) {
        return null;
    }
    function scrollToTarget() {
        const hash = location.hash;
        if (hash.startsWith("#")) {
            const target = document.getElementById(hash.substring(1));
            if (target != null) {
                target.scrollIntoView({behavior: "smooth", block: "center"});
            }
        }
    }
    document.addEventListener("readystatechange", () => {
        if (document.readyState !== "interactive") {
            return;
        }
        { // listen scroll
            const scroll = document.scrollingElement;
            const table = document.querySelector("table");
            const thead = document.querySelector("thead");
            window.addEventListener("scroll", () => {
                thead.style.top = Math.max(0, scroll.scrollTop - table.offsetTop) + "px";
            }, {passive: true});
        }
        { // listen anchor
            const tbody = document.querySelector("tbody");
            tbody.addEventListener("click", event => {
                const anchor = event.target;
                if (anchor != null && anchor.tagName == "A") {
                    event.preventDefault();
                    if (event.shiftKey) {
                        history.pushState({}, "", "#" + anchor.innerText);
                        anchor.scrollIntoView({behavior: "smooth", block: "center"});
                    } else {
                        history.pushState({}, "", anchor.href);
                        buildObject();
                    }
                }
            });
            window.addEventListener("popstate", () => {
                buildObject();
            });
        }
        /**
         * @param {boolean} index
         * @param {boolean} desc
         */
        function sort(index, desc) {
            const tbody = document.querySelector("tbody");
            const array = [];
            let order = 0;
            for (const tr of tbody.children) {
                array.push({
                    text: tr.children[index]?.innerText || "",
                    order: order++,
                    node: tr
                });
            }
            array.sort((a, b) => {
                if (a.text > b.text) {
                    return 1;
                }
                if (a.text < b.text) {
                    return -1;
                }
                return a.order - b.order;
            });
            if (desc) {
                array.reverse();
            }
            tbody.innerHTML = "";
            tbody.append(...array.map(item => item.node));
        }
        document.querySelectorAll("th").forEach((th, index) => { // listen sort
            th.addEventListener("click", event => {
                let desc;
                th.parentElement.querySelectorAll(".sort").forEach(sort => {
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
                    } else {
                        sort.classList.remove("asc");
                        sort.classList.remove("desc");
                        sort.innerText = "\u25ac";
                    }
                });
                if (desc != null) {
                    event.preventDefault();
                    sort(index, desc);
                }
            });
        });
        buildObject();
        window.setTimeout(scrollToTarget, 0);
    });
})();
