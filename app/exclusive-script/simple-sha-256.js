class SHA256 {
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static ch(x, y, z) {
        return (x & y) ^ (~x & z);
    }
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static maj(x, y, z) {
        return (x & y) ^ (x & z) ^ (y & z);
    }
    /**
     * @param {number} x int32
     * @return {number} int32
     */
    static bigSigma0(x) {
        return ((x >>> 2) | (x << 30))
                ^ ((x >>> 13) | (x << 19))
                ^ ((x >>> 22) | (x << 10));
    }
    /**
     * @param {number} x int32
     * @return {number} int32
     */
    static bigSigma1(x) {
        return ((x >>> 6) | (x << 26))
                ^ ((x >>> 11) | (x << 21))
                ^ ((x >>> 25) | (x << 7));
    }
    /**
     * @param {number} x int32
     * @return {number} int32
     */
    static sigma0(x) {
        return ((x >>> 7) | (x << 25))
                ^ ((x >>> 18) | (x << 14))
                ^ (x >>> 3);
    }
    /**
     * @param {number} x int32
     * @return {number} int32
     */
    static sigma1(x) {
        return ((x >>> 17) | (x << 15))
                ^ ((x >>> 19) | (x << 13))
                ^ (x >>> 10);
    }
    constructor() {
        /** @type {number[]} int32, length = 8 */
        this.initial = [];
        /** @type {number[]} int32, length = 64 */
        this.addend = [];
        {
            const primes = [];
            let x = 1;
            XPP:
            while (primes.length < 64) {
                x++;
                for (const p of primes) {
                    if (x % p == 0) {
                        continue XPP;
                    }
                }
                primes.push(x);
            }
            const INT32 = 2 ** 32;
            for (let i = 0; i < 8; i++) {
                const r = Math.sqrt(primes[i]);
                this.initial.push(Math.floor(INT32 * (r - Math.floor(r))));
            }
            for (let i = 0; i < 64; i++) {
                const r = Math.cbrt(primes[i]);
                this.addend.push(Math.floor(INT32 * (r - Math.floor(r))));
            }
        }
        /** @type {number[]} int32, length = 8 */
        this.out;
        /** @type {File[]} FIFO */
        this.queue = [];
        /** @type {boolean} */
        this.running = false;
    }
    /**
     * @param {DataView} view
     * @param {number} offset of bytes
     */
    step(view, offset) {
        const w = [];
        for (let i = 0; i < 16; i++) {
            w.push(view.getInt32(offset));
            offset += 4;
        }
        for (let i = 16; i < 64; i++) {
            w.push((
                SHA256.sigma1(w[i - 2])
                + w[i - 7]
                + SHA256.sigma0(w[i - 15])
                + w[i - 16]
            ) & -1);
        }
        let a = this.out[0];
        let b = this.out[1];
        let c = this.out[2];
        let d = this.out[3];
        let e = this.out[4];
        let f = this.out[5];
        let g = this.out[6];
        let h = this.out[7];
        for (let i = 0; i < 64; i++) {
            const t1 = (
                    h
                    + SHA256.bigSigma1(e)
                    + SHA256.ch(e, f, g)
                    + this.addend[i]
                    + w[i]
                ) & -1;
            const t2 = (
                    SHA256.bigSigma0(a)
                    + SHA256.maj(a, b, c)
                ) & -1;
            h = g;
            g = f;
            f = e;
            e = (d + t1) & -1;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) & -1;
        }
        this.out[0] = (this.out[0] + a) & -1;
        this.out[1] = (this.out[1] + b) & -1;
        this.out[2] = (this.out[2] + c) & -1;
        this.out[3] = (this.out[3] + d) & -1;
        this.out[4] = (this.out[4] + e) & -1;
        this.out[5] = (this.out[5] + f) & -1;
        this.out[6] = (this.out[6] + g) & -1;
        this.out[7] = (this.out[7] + h) & -1;
    }
    /**
     * @param {File} file
     * @return {Promise<string>}
     */
    async digestFile(file) {
        const byteLength = file.size;
        const blockCount = (byteLength + 72) >>> 6;
        const padding = new ArrayBuffer((blockCount << 6) - byteLength);
        const paddingView = new DataView(padding);
        paddingView.setUint8(0, 0x80);
        paddingView.setUint32(padding.byteLength - 4, byteLength << 3);
        const data = new Blob([file, padding]);
        const buffer = await data.arrayBuffer();
        const view = new DataView(buffer);
        this.out = this.initial.slice(); // copy array
        for (let i = 0; i < blockCount; i++) {
            this.step(view, i << 6);
        }
        return this.toString();
    }
    /**
     * @param {File[]} files
     * @return {Promise}
     */
    async digestFiles(...files) {
        this.queue.push(...files);
        if (this.running) {
            return;
        }
        this.running = true;
        try {
            while (true) {
                const file = this.queue.shift();
                if (file != null) {
                    const tr = document.createElement("tr");
                    {
                        const nameCell = document.createElement("td");
                        nameCell.textContent = file.name;
                        tr.append(nameCell);
                    }
                    {
                        const sizeCell = document.createElement("td");
                        sizeCell.textContent = file.size;
                        tr.append(sizeCell);
                    }
                    {
                        const resultCell = document.createElement("td");
                        try {
                            if (file.size >= 1 << 20) { // 1MiB
                                throw new Error("File is too large");
                            }
                            resultCell.textContent = await this.digestFile(file);
                            resultCell.className = "hex";
                        } catch (cause) {
                            resultCell.textContent = cause;
                            resultCell.className = "error";
                        }
                        tr.append(resultCell);
                    }
                    document.getElementById("tbody").append(tr);
                } else {
                    break;
                }
            }
        } finally {
            this.running = false;
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const parts = [];
        for (const value of this.out) {
            parts.push((0x800000000 + value).toString(16).substring(1));
        }
        return parts.join("");
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
(() => {
    const sha256 = new SHA256();
    window.app = sha256;
    window.addEventListener("drop", event => {
        event.preventDefault();
        sha256.digestFiles(...event.dataTransfer.files);
    });
    window.addEventListener("load", () => {
        document.getElementById("fileInput").addEventListener("change", event => {
            sha256.digestFiles(...event.target.files);
        });
    });
})();
