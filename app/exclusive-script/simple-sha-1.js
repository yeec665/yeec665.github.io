class SHA1 {
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static choose(x, y, z) {
        return (x & y) ^ (~x & z);
    }
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static majority(x, y, z) {
        return (x & y) ^ (x & z) ^ (y & z);
    }
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static parity(x = 0, y = 0, z = 0) {
        return x ^ y ^ z;
    }
    constructor() {
        /** @type {number[]} int32, length = 5 */
        this.out;
    }
    start() {
        this.out = [
            0x67452301,
            0xefcdab89,
            0x98badcfe,
            0x10325476,
            0xc3d2e1f0
        ];
    }
    /**
     * @param {DataView} view
     * @param {number} offset of bytes
     */
    step(view, offset = 0) {
        const w = [];
        for (let i = 0; i < 16; i++) {
            w.push(view.getInt32(offset));
            offset += 4;
        }
        for (let i = 16; i < 80; i++) {
            const xor = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            w.push((xor << 1) | (xor >>> 31));
        }
        let a = this.out[0];
        let b = this.out[1];
        let c = this.out[2];
        let d = this.out[3];
        let e = this.out[4];
        for (let i = 0; i < 20; i++) {
            let t = w[i] + ((a << 5) | (a >>> 27)) + e + SHA1.choose(b, c, d) + 0x5a827999;
            e = d;
            d = c;
            c = (b << 30) | (b >>> 2);
            b = a;
            a = t;
        }
        for (let i = 20; i < 40; i++) {
            let t = w[i] + ((a << 5) | (a >>> 27)) + e + SHA1.parity(b, c, d) + 0x6ed9eba1;
            e = d;
            d = c;
            c = (b << 30) | (b >>> 2);
            b = a;
            a = t;
        }
        for (let i = 40; i < 60; i++) {
            let t = w[i] + ((a << 5) | (a >>> 27)) + e + SHA1.majority(b, c, d) + 0x8f1bbcdc;
            e = d;
            d = c;
            c = (b << 30) | (b >>> 2);
            b = a;
            a = t;
        }
        for (let i = 60; i < 80; i++) {
            let t = w[i] + ((a << 5) | (a >>> 27)) + e + SHA1.parity(b, c, d) + 0xca62c1d6;
            e = d;
            d = c;
            c = (b << 30) | (b >>> 2);
            b = a;
            a = t;
        }
        this.out[0] = (this.out[0] + a) & -1;
        this.out[1] = (this.out[1] + b) & -1;
        this.out[2] = (this.out[2] + c) & -1;
        this.out[3] = (this.out[3] + d) & -1;
        this.out[4] = (this.out[4] + e) & -1;
    }
    /**
     * @param {File} file
     * @return {Promise<string>}
     */
    digestFile(file) {
        const byteLength = file.size;
        const blockCount = (byteLength + 72) >>> 6;
        const padding = new ArrayBuffer((blockCount << 6) - byteLength);
        const paddingView = new DataView(padding);
        paddingView.setUint8(0, 0x80);
        paddingView.setUint32(padding.byteLength - 4, byteLength << 3);
        const data = new Blob([file, padding]);
        return data.arrayBuffer().then(buffer => {
            const view = new DataView(buffer);
            this.start();
            for (let i = 0; i < blockCount; i++) {
                this.step(view, i << 6);
            }
            return this.toString();
        });
    }
    /**
     * @param {FileList} fileList
     * @param {boolean} upperCase
     */
    digestFileList(fileList, upperCase) {
        for (const file of fileList) {
            const tr = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.textContent = file.name;
            tr.append(nameCell);
            const hashCell = document.createElement("td");
            hashCell.textContent = "Calculating...";
            tr.append(hashCell);
            document.querySelector("tbody").append(tr);
            if (file.size >= 0x100000) {
                hashCell.className = "error";
                hashCell.textContent = "File is too large";
                continue;
            }
            this.digestFile(file).then(hash => {
                hashCell.className = "hex";
                if (upperCase) {
                    hash = hash.toUpperCase();
                }
                hashCell.textContent = hash;
            }, cause => {
                hashCell.className = "error";
                hashCell.textContent = cause;
            });
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const segments = [];
        for (const value of this.out) {
            segments.push((0x200000000 + value).toString(16).substring(1));
        }
        return segments.join("");
    }
}
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
    (new SHA1()).digestFileList(event.dataTransfer.files, event.shiftKey);
});
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        document.getElementById("fileInput").addEventListener("change", event => {
            (new SHA1()).digestFileList(event.target.files);
        });
    }
});