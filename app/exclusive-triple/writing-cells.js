document.addEventListener("readystatechange", () => {
    const doc = document;
    if (doc.readyState !== "interactive") {
        return;
    }
    const params = new URLSearchParams(location.search);
    const colspan = Math.max(2, Math.min(parseInt(params.get("colspan")), 100)) || 23;
    const mark = Math.max(colspan, Math.min(parseInt(params.get("colspan")), 10000)) || 100;
    const tbody = doc.createElement("tbody");
    let count = 0;
    function addRows() {
        let tr, td;
        for (let i = 0; i < 50; i++) {
            tr = doc.createElement("tr");
            for (let j = 0; j < colspan; j++) {
                td = doc.createElement("td");
                td.className = "cell";
                tr.append(td);
            }
            tbody.append(tr);
            tr = doc.createElement("tr");
            td = doc.createElement("td");
            td.setAttribute("colspan", colspan);
            td.className = "gap";
            if (Math.floor(count / mark) != Math.floor((count + colspan) / mark)) {
                td.style.paddingLeft = (33 * (mark - count % mark - 1) + 3) + "px";
                td.textContent = (Math.floor(count / mark) + 1) * mark;
            }
            count += colspan;
            tr.append(td);
            tbody.append(tr);
        }
        console.log("count = " + count);
    }
    addRows();
    const scroll = document.scrollingElement;
    window.addEventListener("scroll", () => {
        if (2 * scroll.clientHeight + scroll.scrollTop > scroll.scrollHeight) {
            addRows();
        }
    }, {passive: true});
    tbody.addEventListener("click", event => {
        if (event.target == null || event.target.tagName != "TD" || !event.target.classList.contains("cell")) {
            return;
        }
        event.preventDefault();
        event.target.classList.add("selected");
        doc.getElementById("dialog").showModal();
        doc.getElementById("textarea").setSelectionRange(0, Number.MAX_SAFE_INTEGER);
    });
    function close() {
        doc.getElementById("dialog").close();
        const selected = doc.querySelector("td.selected");
        if (selected != null) {
            selected.classList.remove("selected");
        }
    }
    doc.getElementById("submit").addEventListener("click", event => {
        event.preventDefault();
        const value = doc.getElementById("textarea").value;
        let td0 = doc.querySelector("td.selected");
        if (value.length > 0 && td0 != null) {
            let td1;
            for (const ch of value) {
                if (ch == '\r') {
                    continue;
                }
                if (ch != '\n') {
                    td0.textContent = ch;
                    td1 = td0.nextElementSibling;
                    if (td1 != null && td1.tagName == "TD") {
                        td0 = td1;
                        continue;
                    }
                }
                td1 = td0.parentElement.nextElementSibling?.nextElementSibling?.firstElementChild;
                if (td1 != null && td1.tagName == "TD") {
                    td0 = td1;
                    continue;
                }
                addRows(); // add rows and try again
                td1 = td0.parentElement.nextElementSibling?.nextElementSibling?.firstElementChild;
                if (td1 != null && td1.tagName == "TD") {
                    td0 = td1;
                    continue;
                }
                break;
            }
        }
        close();
    });
    doc.getElementById("cancel").addEventListener("click", event => {
        event.preventDefault();
        close();
    });
    const table = doc.createElement("table");
    table.append(tbody);
    doc.body.prepend(table);
});
