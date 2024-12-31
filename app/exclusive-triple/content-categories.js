document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    document.querySelectorAll("ul").forEach(ul => {
        const all = ul.dataset.all;
        if (all != null) {
            ul.querySelectorAll("li").forEach(li => {
                li.classList.add(all);
            });
        }
    });
    document.querySelectorAll("li").forEach(li => {
        makeAnchor(li, li.textContent.trim());
    });
    function makeAnchor(li, text) {
        const anchor = document.createElement("a");
        if (li.classList.contains("svg")) {
            anchor.setAttribute("href", "https://developer.mozilla.org/en-US/docs/Web/SVG/Element/" + text);
        } else {
            anchor.setAttribute("href", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/" + text);
        }
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noreferrer");
        anchor.setAttribute("referrerpolicy", "no-referrer");
        anchor.textContent = text;
        li.innerHTML = "";
        li.append(anchor);
    }
    function clearHierarchy() {
        document.querySelectorAll("li.show-hierarchy").forEach(li => {
            const anchor = li.querySelector("a");
            if (anchor == null) {
                return;
            }
            const tagName = anchor.textContent;
            li.classList.remove("show-hierarchy");
            li.innerHTML = "";
            makeAnchor(li, tagName);
        });
    }
    document.body.addEventListener("mouseover", event => {
        const li = event.target?.closest("li");
        if (li == null || li.classList.contains("show-hierarchy")) {
            return;
        }
        const anchor = li.querySelector("a");
        if (anchor == null) {
            return;
        }
        const tagName = anchor.textContent;
        let testNode;
        if (li.classList.contains("svg")) {
            testNode = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        } else {
            testNode = document.querySelector(tagName);
            if (testNode == null) {
                testNode = document.createElement(tagName);
            }
        }
        clearHierarchy();
        li.classList.add("show-hierarchy");
        while (true) {
            testNode = Object.getPrototypeOf(testNode);
            if (testNode == null) {
                break;
            }
            const constructorName = testNode.constructor.name;
            if (constructorName == "Object") {
                break;
            }
            const span = document.createElement("span");
            span.className = "constructor-name";
            span.textContent = constructorName;
            li.append(span);
        }
    });
    document.body.addEventListener("mouseout", event => {
        const li = event.target;
        if (li != null && li.matches("li.show-hierarchy")) {
            clearHierarchy();
        }
    });
});
