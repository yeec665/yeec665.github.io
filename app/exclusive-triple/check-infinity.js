document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    document.body.addEventListener("click", event => {
        if (event.target == null || !("closest" in event.target)) {
            return;
        }
        const checkInfinity = event.target.closest(".check-infinity");
        if (checkInfinity == null) {
            return;
        }
        event.preventDefault();
        function toggleChecked() {
            if (checkInfinity.hasAttribute("checked")) {
                checkInfinity.removeAttribute("checked");
            } else {
                checkInfinity.setAttribute("checked", "");
            }
        }
        if (checkInfinity.hasAttribute("indeterminate")) {
            if (event.shiftKey) {
                toggleChecked();
            } else {
                checkInfinity.removeAttribute("indeterminate");
            }
        } else {
            if (event.shiftKey) {
                checkInfinity.setAttribute("indeterminate", "");
            } else {
                toggleChecked();
            }
        }
    });
    const canvas = new OffscreenCanvas(32, 32);
    const context = canvas.getContext("2d");
    context.lineCap = "butt";
    context.lineJoin = "miter";
    async function paintYes() {
        context.clearRect(0, 0, 32, 32);
        context.lineWidth = 1.5;
        context.strokeStyle = "#b4ffa2";
        context.beginPath();
        context.moveTo(25, 11);
        context.lineTo(30, 16);
        context.lineTo(23, 23);
        context.lineTo(18, 18);
        context.moveTo(14, 14);
        context.lineTo(9, 9);
        context.lineTo(4, 14);
        context.stroke();
        context.lineWidth = 2.5;
        context.strokeStyle = "#51dc2f";
        context.beginPath();
        context.moveTo(2, 16);
        context.lineTo(9, 23);
        context.lineTo(23, 9);
        context.stroke();
        const blob = await canvas.convertToBlob();
        return URL.createObjectURL(blob);
    }
    async function paintNo() {
        context.clearRect(0, 0, 32, 32);
        context.lineWidth = 1.5;
        context.strokeStyle = "#f8b2aa";
        context.beginPath();
        context.moveTo(25, 11);
        context.lineTo(30, 16);
        context.lineTo(25, 21);
        context.moveTo(7, 11);
        context.lineTo(2, 16);
        context.lineTo(7, 21);
        context.stroke();
        context.lineWidth = 2.5;
        context.strokeStyle = "#eb4330";
        context.beginPath();
        context.moveTo(23, 9);
        context.lineTo(9, 23);
        context.moveTo(9, 9);
        context.lineTo(23, 23);
        context.stroke();
        const blob = await canvas.convertToBlob();
        return URL.createObjectURL(blob);
    }
    async function paintIndeterminate() {
        context.clearRect(0, 0, 32, 32);
        context.lineWidth = 1.5;
        context.strokeStyle = "#f5d59d";
        context.beginPath();
        context.moveTo(28, 14);
        context.lineTo(23, 9);
        context.lineTo(18, 14);
        context.moveTo(14, 14);
        context.lineTo(9, 9);
        context.lineTo(4, 14);
        context.stroke();
        context.lineWidth = 2.5;
        context.strokeStyle = "#ffaa2e";
        context.beginPath();
        context.moveTo(30, 16);
        context.lineTo(23, 23);
        context.lineTo(16, 16);
        context.lineTo(9, 23);
        context.lineTo(2, 16);
        context.stroke();
        const blob = await canvas.convertToBlob();
        return URL.createObjectURL(blob);
    }
    async function configStyle() {
        const yesURL = await paintYes();
        const noURL = await paintNo();
        const indeterminateURL = await paintIndeterminate();
        const style = document.createElement("style");
        style.textContent = `.check-infinity::before{content:url("${noURL}")}.check-infinity[checked]::before{content:url("${yesURL}")}.check-infinity[indeterminate]::before{content:url("${indeterminateURL}")}`;
        document.head.append(style);
    }
    configStyle().catch(console.error);
});