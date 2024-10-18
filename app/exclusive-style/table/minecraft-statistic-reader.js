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
    openFiles(event.dataTransfer.files);
});
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    if (navigator.userAgent.includes("Windows")) {
        document.querySelectorAll(".file-path").forEach(pathParagraph => {
            pathParagraph.textContent = pathParagraph.textContent.replaceAll("/", "\\");
        });
    }
    // add a close button for each section
    const chooseFileInput = document.getElementById("chooseFileInput");
    chooseFileInput.addEventListener("input", () => {
        openFiles(chooseFileInput.files);
    });
});
/**
 * @param {File[]} files
 */
function openFiles(files) {
    openNext(files, 0);
}
/**
 * @param {File[]} files
 * @param {number} index
 */
function openNext(files, index) {
    if (index >= files.length) {
        return;
    }
    files[index].text().then(
        parseFile,
        console.error
    ).finally(() => {
        openNext(files, index + 1)
    });
}
/**
 * @param {string} string
 */
function parseFile(string) {
    try {
        const stats = JSON.parse(string).stats;
        for (const columnKey of Object.keys(stats)) {
            const columnHead = document.querySelector("th#" + columnKey.replace(':', '_'));
            const table = columnHead?.parentNode?.parentNode?.parentNode;
            if (table == null || table.tagName != "TABLE") {
                continue;
            }
            let tbody = table.querySelector("tbody");
            if (tbody == null) {
                tbody = document.createElement("tbody");
                table.append(tbody);
            }
            const columnCount = parseInt(table.dataset?.columnCount);
            const columnIndex = elementIndex(columnHead);
            if (columnIndex <= 0) {
                continue;
            }
            const columnObject = stats[columnKey];
            for (const rowKey of Object.keys(columnObject)) {
                const normalizedRowKey = rowKey.replace(':', '_');
                let rowHead = tbody.querySelector("th#" + normalizedRowKey);
                if (rowHead == null) {
                    const tr = document.createElement("tr");
                    rowHead = document.createElement("th");
                    rowHead.setAttribute("id", normalizedRowKey);
                    rowHead.textContent = rowKey;
                    tr.append(rowHead);
                    for (let index = 0; index < columnCount; index++) {
                        tr.append(document.createElement("td"));
                    }
                    tbody.append(tr);
                }
                let cell = rowHead;
                for (let index = 0; index < columnIndex; index++) {
                    cell = cell.nextElementSibling;
                    if (cell == null) {
                        cell = document.createElement("td");
                        rowHead.parentNode.append(cell);
                    }
                }
                cell.textContent = columnObject[rowKey];
            }
        }
    } catch (e) {
        console.error(e);
    }
}
/**
 * @param {HTMLElement} element
 * @return {number}
 */
function elementIndex(element) {
    let index = -1;
    while (element != null) {
        element = element.previousElementSibling;
        index++;
    }
    return index;
}