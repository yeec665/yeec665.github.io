class StringComparision {
    constructor() {
        const doc = document;
        this.main = doc.querySelector("main");
        this.tbody = doc.querySelector("tbody");
        this.update0B = this.update0.bind(this);
        this.update1B = this.update1.bind(this);
        this.lcs = doc.getElementById("inputRadioLCS");
        this.lcs.addEventListener("change", this.update0B);
        doc.getElementById("inputRadioED").addEventListener("change", this.update0B);
        this.textA = doc.getElementById("inputTextA");
        this.textB = doc.getElementById("inputTextB");
        this.textA.addEventListener("input", this.update0B);
        this.textB.addEventListener("input", this.update0B);
        this.update0();
    }
    update0() {
        this.pending = true;
        this.main.className = "loading";
        window.setTimeout(this.update1B, 400);
    }
    update1() {
        if (this.pending) {
            this.pending = false;
        } else {
            return;
        }
        this.tbody.innerHTML = "";
        const a = this.textA.value;
        const b = this.textB.value;
        if (a.length * b.length > 5000 || Math.max(a.length, b.length) > 250) {
            return;
        }
        if (this.lcs.checked) {
            this.longestCommonSubsequence(a, b);
        } else {
            this.editDistance(a, b);
        }
        this.main.className = "loaded";
    }
    longestCommonSubsequence(a, b) {
        const self = this;
        const doc = document;
        const al = a.length;
        const bl = b.length;
        let ai;
        (function() {
            let tr = doc.createElement("tr");
            let td = doc.createElement("td");
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerText = "*";
            tr.appendChild(td);
            for (ai = 0; ai < al; ai++) {
                td = document.createElement("td");
                td.innerText = a.charAt(ai);
                tr.appendChild(td);
            }
            self.tbody.appendChild(tr);
        })();
        let src = new Array(al + 1);
        for (ai = 0; ai <= al; ai++) {
            src[ai] = 0;
        }
        function addRow(c) {
            let tr = doc.createElement("tr");
            let td = doc.createElement("td");
            td.innerText = c;
            tr.appendChild(td);
            for (ai = 0; ai <= al; ai++) {
                td = document.createElement("td");
                td.innerText = src[ai];
                tr.appendChild(td);
            }
            self.tbody.appendChild(tr);
        }
        addRow("*");
        let dst = new Array(al + 1);
        let bi, bx, temp;
        for (bi = 0; bi < bl; bi++) {
            bx = b.charCodeAt(bi);
            dst[0] = 0;
            for (ai = 0; ai <= al; ai++) {
                if (bx == a.charCodeAt(ai)) {
                    dst[ai + 1] = src[ai] + 1;
                } else {
                    dst[ai + 1] = Math.max(src[ai + 1], dst[ai]);
                }
            }
            temp = src;
            src = dst;
            dst = temp;
            addRow(b.charAt(bi));
        }
    }
    editDistance(a, b) {
        const self = this;
        const doc = document;
        const al = a.length;
        const bl = b.length;
        let ai;
        (function() {
            let tr = doc.createElement("tr");
            let td = doc.createElement("td");
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerText = "*";
            tr.appendChild(td);
            for (ai = 0; ai < al; ai++) {
                td = document.createElement("td");
                td.innerText = a.charAt(ai);
                tr.appendChild(td);
            }
            self.tbody.appendChild(tr);
        })();
        let src = new Array(al + 1);
        for (ai = 0; ai <= al; ai++) {
            src[ai] = ai;
        }
        function addRow(c) {
            let tr = doc.createElement("tr");
            let td = doc.createElement("td");
            td.innerText = c;
            tr.appendChild(td);
            for (ai = 0; ai <= al; ai++) {
                td = document.createElement("td");
                td.innerText = src[ai];
                tr.appendChild(td);
            }
            self.tbody.appendChild(tr);
        }
        addRow("*");
        let dst = new Array(al + 1);
        let bi, bx, temp;
        for (bi = 0; bi < bl; bi++) {
            bx = b.charCodeAt(bi);
            dst[0] = bi + 1;
            for (ai = 0; ai <= al; ai++) {
                if (bx == a.charCodeAt(ai)) {
                    dst[ai + 1] = src[ai];
                } else {
                    dst[ai + 1] = Math.min(src[ai], src[ai + 1], dst[ai]) + 1;
                }
            }
            temp = src;
            src = dst;
            dst = temp;
            addRow(b.charAt(bi));
        }
    }
}
window.addEventListener("load", () => {
    window.app = new StringComparision();
});