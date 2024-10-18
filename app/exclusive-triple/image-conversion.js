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
    convertFiles(event.dataTransfer.files);
});
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    setupToggles(document.querySelectorAll(".toggle.format"));
    setupToggles(document.querySelectorAll(".toggle.mark-position"));
    setupToggles(document.querySelectorAll(".toggle.mark-content"));
    setupToggles(document.querySelectorAll(".toggle.background"));
    const sizes = document.querySelectorAll(".toggle.size");
    const inputSizes = document.querySelectorAll(".input-size");
    function gcd(a, b) {
        a = a % b;
        if (a == 0) {
            return b;
        }
        return gcd(b, a);
    }
    for (const node1 of sizes) {
        const width = parseInt(node1.dataset.width);
        const height = parseInt(node1.dataset.height);
        if (width > 0 && height > 0) {
            let div = document.createElement("div");
            div.textContent = `${width}x${height}`;
            node1.append(div);
            div = document.createElement("div");
            const g = gcd(width, height);
            div.textContent = `${width / g}:${height / g}`;
            node1.append(div);
        }
        node1.addEventListener("click", () => {
            for (const node2 of sizes) {
                node2.classList.toggle("selected", node1 == node2);
            }
            for (const node2 of inputSizes) {
                node2.classList.toggle("visible", node1.classList.contains("other"));
            }
        });
    }
    document.getElementById("buttonPickColor").addEventListener("click", () => {
        (new EyeDropper()).open().then(color => {
            document.getElementById("pickedColor").textContent = color.sRGBHex;
        });
    });
    const inputChooseFile = document.getElementById("inputChooseFile");
    window.addEventListener("keydown", event => { // press Ctrl+O to open
        if (event.ctrlKey && event.key.toUpperCase() == "O") {
            event.preventDefault(); // the default open action of browser (open a webpage file)
            inputChooseFile.showPicker();
        }
    });
    document.getElementById("buttonChooseFile").addEventListener("click", () => {
        inputChooseFile.showPicker();
    });
    inputChooseFile.addEventListener("input", () => {
        convertFiles(inputChooseFile.files);
    });
});
/**
 * @param {NodeList} toggles
 */
function setupToggles(toggles) {
    for (const toggle1 of toggles) {
        toggle1.addEventListener("click", () => {
            for (const toggle2 of toggles) {
                toggle2.classList.toggle("selected", toggle1 == toggle2);
            }
        });
    }
}
/**
 * @param {File[]} files
 */
function convertFiles(files) {
    convertNext(files, 0);
}
/**
 * @param {File[]} files
 * @param {number} index
 */
function convertNext(files, index) {
    if (index >= files.length) {
        return;
    }
    const src = document.createElement("img");
    src.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        setSize(src, canvas);
        const context = canvas.getContext("2d");
        if (!document.getElementById("buttonTransparent")?.classList?.contains("selected")) {
            context.fillStyle = document.getElementById("pickedColor")?.textContent;
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (document.getElementById("buttonUseBlur")?.classList?.contains("selected")) {
            const blur = Math.min(canvas.width, canvas.height) / 16;
            context.filter = `blur(${blur}px)`;
            drawImage(src, canvas, context, Math.max((canvas.width + blur) / src.naturalWidth, (canvas.height + blur) / src.naturalHeight));
            context.filter = "none";
        }
        drawImage(src, canvas, context, Math.min(canvas.width / src.naturalWidth, canvas.height / src.naturalHeight));
        URL.revokeObjectURL(src.src);
        drawMark(files[index], src, canvas, context);
        canvas.toBlob(blob => {
            const dst = document.createElement("img");
            dst.addEventListener("load", () => {
                URL.revokeObjectURL(dst.src);
            });
            dst.addEventListener("dblclick", () => {
                dst.remove();
            });
            dst.src = URL.createObjectURL(blob);
            document.body.appendChild(dst);
        }, getFormat());
    });
    src.addEventListener("load", () => {
        convertNext(files, index + 1);
    });
    src.addEventListener("error", event => {
        console.log(event);
        convertNext(files, index + 1);
    });
    src.src = URL.createObjectURL(files[index]);
}
/**
 * @return {string}
 */
function getFormat() {
    return document.querySelector(".toggle.format.selected")?.dataset?.mime || "image/png";
}
/**
 * @param {HTMLImageElement} src
 * @param {HTMLCanvasElement} canvas
 * @return {HTMLCanvasElement}
 */
function setSize(src, canvas) {
    const selectedSize = document.querySelector(".toggle.size.selected");
    let width = 0;
    let height = 0;
    if (selectedSize != null) {
        width = parseInt(selectedSize.dataset.width);
        height = parseInt(selectedSize.dataset.height);
        if (!(width > 0 && height > 0)) {
            if (selectedSize.classList.contains("other")) {
                width = parseInt(document.getElementById("inputNumberWidth")?.value);
                height = parseInt(document.getElementById("inputNumberHeight")?.value);
            }
        }
    }
    if (!(width > 0 && height > 0)) {
        width = src.naturalWidth;
        height = src.naturalHeight;
    }
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
/**
 * @param {HTMLImageElement} src
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {number} factor
 * @return {CanvasRenderingContext2D}
 */
function drawImage(src, canvas, context, factor) {
    context.drawImage(src,
        0.5 * (canvas.width - factor * src.width),
        0.5 * (canvas.height - factor * src.height),
        factor * src.width,
        factor * src.height
    );
    return context;
}
/**
 * @param {File} file
 * @param {HTMLImageElement} src
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @return {CanvasRenderingContext2D}
 */
function drawMark(file, src, canvas, context) {
    const selectedContent = document.querySelector(".toggle.mark-content.selected")?.dataset?.content;
    if (selectedContent == null) {
        return;
    }
    let text;
    switch (selectedContent) {
        case "timestamp":
            text = (new Date()).toLocaleString("chinese", {hour12: false}).replace(" 24:", " 00:");
            break;
        case "name":
            text = file.name;
            break;
        case "src-size":
            text = `${src.naturalWidth}x${src.naturalHeight}`;
            break;
        case "dst-size":
            text = `${canvas.width}x${canvas.height}`;
            break;
        case "other":
            text = document.getElementById("inputTextMarkContent").value;
            break;
    }
    if (text == null || text.length == 0) {
        return;
    }
    const selectedPosition = document.querySelector(".toggle.mark-position.selected");
    if (selectedPosition == null) {
        return;
    }
    context.font = "16px sans-serif";
    context.fillStyle = "#404040";
    const metrics = context.measureText(text);
    const margin = 6;
    let x, y;
    switch (selectedPosition.dataset.horizontal) {
        case "start":
            x = margin;
            break;
        case "center":
            x = 0.5 * (canvas.width - metrics.width);
            break;
        case "end":
            x = canvas.width - metrics.width - margin;
            break;
    }
    switch (selectedPosition.dataset.vertical) {
        case "start":
            y = margin + metrics.actualBoundingBoxAscent;
            break;
        case "center":
            y = 0.5 * (canvas.height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent);
            break;
        case "end":
            y = canvas.height - metrics.actualBoundingBoxDescent - margin;
            break;
    }
    if (x != null && y != null) {
        context.fillText(text, x, y);
    }
    return context;
}
