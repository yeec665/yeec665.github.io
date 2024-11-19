class SHA224 {
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
    static INITIAL = [
        0xc1059ed8,
        0x367cd507,
        0x3070dd17,
        0xf70e5939,
        0xffc00b31,
        0x68581511,
        0x64f98fa7,
        0xbefa4fa4
    ];
    static ADDEND = [];
    static { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks
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
        for (let i = 0; i < 64; i++) {
            const r = Math.cbrt(primes[i]);
            SHA224.ADDEND.push(Math.floor(INT32 * (r - Math.floor(r))));
        }
    }
    constructor() {
        /** @type {number[]} int32, length = 8 */
        this.out;
    }
    /**
     * @param {DataView} view
     * @param {number} offset of bytes
     */
    step(view, offset) {
        const mid = [];
        for (let i = 0; i < 16; i++) {
            mid.push(view.getInt32(offset));
            offset += 4;
        }
        for (let i = 16; i < 64; i++) {
            mid.push((
                SHA224.sigma1(mid[i - 2])
                + mid[i - 7]
                + SHA224.sigma0(mid[i - 15])
                + mid[i - 16]
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
                    + SHA224.bigSigma1(e)
                    + SHA224.choose(e, f, g)
                    + SHA224.ADDEND[i]
                    + mid[i]
                ) & -1;
            const t2 = (
                    SHA224.bigSigma0(a)
                    + SHA224.majority(a, b, c)
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
            this.out = SHA224.INITIAL.slice();
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
            const resultCell = document.createElement("td");
            resultCell.textContent = "Calculating...";
            tr.append(resultCell);
            document.querySelector("tbody").append(tr);
            if (file.size >= 0x100000) { // 1MiB
                resultCell.className = "error";
                resultCell.textContent = "File is too large";
                continue;
            }
            this.digestFile(file).then(hash => {
                resultCell.className = "hex";
                if (upperCase) {
                    hash = hash.toUpperCase();
                }
                resultCell.textContent = hash;
            }, cause => {
                resultCell.className = "error";
                resultCell.textContent = cause;
            });
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const words = [];
        for (let i = 0; i < 7; i++) {
            words.push((0x200000000 + this.out[i]).toString(16).substring(1));
        }
        return words.join("");
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
    (new SHA224()).digestFileList(event.dataTransfer.files, event.shiftKey);
});
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        document.getElementById("fileInput").addEventListener("change", event => {
            (new SHA224()).digestFileList(event.target.files);
        });
    }
});
