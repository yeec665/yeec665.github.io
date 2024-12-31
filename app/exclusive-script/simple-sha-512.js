class SHA512 {
    static MASK64 = 0xffffffffffffffffn;
    static TO_STRING = 0x10000000000000000n;
    /**
     * @param {bigint} x int64
     * @param {bigint} y int64
     * @param {bigint} z int64
     * @return {bigint} int64
     */
    static choose(x, y, z) {
        return SHA512.MASK64 & ((x & y) ^ (~x & z));
    }
    /**
     * @param {bigint} x int64
     * @param {bigint} y int64
     * @param {bigint} z int64
     * @return {bigint} int64
     */
    static majority(x, y, z) {
        return (x & y) ^ (x & z) ^ (y & z);
    }
    /**
     * @param {bigint} x int64
     * @return {bigint} int64
     */
    static bigSigma0(x) {
        return SHA512.MASK64 & (
                ((x >> 28n) | (x << 36n))
                ^ ((x >> 34n) | (x << 30n))
                ^ ((x >> 39n) | (x << 25n))
            );
    }
    /**
     * @param {bigint} x int64
     * @return {bigint} int64
     */
    static bigSigma1(x) {
        return SHA512.MASK64 & (
                ((x >> 14n) | (x << 50n))
                ^ ((x >> 18n) | (x << 46n))
                ^ ((x >> 41n) | (x << 23n))
            );
    }
    /**
     * @param {bigint} x int64
     * @return {bigint} int64
     */
    static sigma0(x) {
        return SHA512.MASK64 & (
                ((x >> 1n) | (x << 63n))
                ^ ((x >> 8n) | (x << 56n))
                ^ (x >> 7n)
            );
    }
    /**
     * @param {bigint} x int64
     * @return {bigint} int64
     */
    static sigma1(x) {
        return SHA512.MASK64 & (
                ((x >> 19n) | (x << 45n))
                ^ ((x >> 61n) | (x << 3n))
                ^ (x >> 6n)
            );
    }
    /** @type {bigint[]} int64, length = 8 */
    static INITIAL = [];
    /** @type {bigint[]} int64, length = 80 */
    static ADDEND = [];
    static {
        const primes = [];
        {
            let value = 1;
            FIND_PRIME:
            while (primes.length < 80) {
                value++;
                for (const prime of primes) {
                    if (value % prime == 0) {
                        continue FIND_PRIME;
                    }
                }
                primes.push(value);
            }
        }
        const low0 = 10n ** 19n;
        const high0 = 10n ** 21n;
        for (let i = 0; i < 8; i++) {
            const target = BigInt(primes[i]) << 128n; // 2 * 64
            let low = low0;
            let high = high0;
            while (high - low > 1n) {
                const mid = (low + high) >> 1n;
                const square = mid * mid;
                if (square > target) {
                    high = mid;
                } else {
                    low = mid;
                }
            }
            SHA512.INITIAL.push(low & SHA512.MASK64);
        }
        for (let index = 0; index < 80; index++) {
            const target = BigInt(primes[index]) << 192n; // 3 * 64
            let low = low0;
            let high = high0;
            while (high - low > 1n) {
                const mid = (low + high) >> 1n;
                const cube = mid * mid * mid;
                if (cube > target) {
                    high = mid;
                } else {
                    low = mid;
                }
            }
            SHA512.ADDEND.push(low & SHA512.MASK64);
        }
    }
    static BLOCK_SIZE = 128;
    constructor() {
        const cumulation = new ArrayBuffer(SHA512.BLOCK_SIZE);
        /** @type {number} between 0 and 128, normally not 128 */
        this.position;
        /** @type {DataView} */
        this.view = new DataView(cumulation);
        /** @type {bigint[]} int64, length = 8, inner state between steps */
        this.out;
        /** @type {number} */
        this.byteCount;
    }
    start() {
        this.out = SHA512.INITIAL.slice();
        this.position = 0;
        this.byteCount = 0;
    }
    step() {
        console.log(this.viewToString());
        const mid = [];
        for (let i = 0; i < 16; i++) {
            mid.push(this.view.getBigUint64(8 * i));
        }
        for (let i = 16; i < 80; i++) {
            mid.push(SHA512.MASK64 & (
                SHA512.sigma1(mid[i - 2])
                + mid[i - 7]
                + SHA512.sigma0(mid[i - 15])
                + mid[i - 16]
            ));
        }
        let a = this.out[0];
        let b = this.out[1];
        let c = this.out[2];
        let d = this.out[3];
        let e = this.out[4];
        let f = this.out[5];
        let g = this.out[6];
        let h = this.out[7];
        for (let i = 0; i < 80; i++) {
            const t1 = SHA512.MASK64 & (h
                    + SHA512.bigSigma1(e)
                    + SHA512.choose(e, f, g)
                    + SHA512.ADDEND[i]
                    + mid[i]
                );
            const t2 = SHA512.MASK64 & (
                    SHA512.bigSigma0(a)
                    + SHA512.majority(a, b, c)
                );
            h = g;
            g = f;
            f = e;
            e = SHA512.MASK64 & (d + t1);
            d = c;
            c = b;
            b = a;
            a = SHA512.MASK64 & (t1 + t2);
        }
        this.out[0] = SHA512.MASK64 & (this.out[0] + a);
        this.out[1] = SHA512.MASK64 & (this.out[1] + b);
        this.out[2] = SHA512.MASK64 & (this.out[2] + c);
        this.out[3] = SHA512.MASK64 & (this.out[3] + d);
        this.out[4] = SHA512.MASK64 & (this.out[4] + e);
        this.out[5] = SHA512.MASK64 & (this.out[5] + f);
        this.out[6] = SHA512.MASK64 & (this.out[6] + g);
        this.out[7] = SHA512.MASK64 & (this.out[7] + h);
    }
    /**
     * @param {Uint8Array} bytes
     * @param {number} offset
     */
    update(bytes, offset = 0) {
        const length = bytes.byteLength;
        this.byteCount += length - offset;
        while (offset < length) {
            const count = Math.min(128 - this.position, length - offset);
            for (let index = 0; index < count; index++) {
                this.view.setUint8(this.position++, bytes[offset++]);
            }
            if (this.position == 128) {
                this.step();
                this.position = 0;
            }
        }
    }
    finish() {
        let onePadded = false;
        if (this.position + 17 > SHA512.BLOCK_SIZE) { // need one more block
            if (this.position < SHA512.BLOCK_SIZE) {
                this.view.setUint8(this.position++, 0x80);
                onePadded = true;
            }
            while (this.position < SHA512.BLOCK_SIZE) {
                this.view.setUint8(this.position++, 0);
            }
            this.step();
            this.position = 0;
        }
        if (!onePadded) {
            this.view.setUint8(this.position++, 0x80);
        }
        while (this.position < SHA512.BLOCK_SIZE - 8) {
            this.view.setUint8(this.position++, 0);
        }
        this.view.setBigUint64(SHA512.BLOCK_SIZE - 8, BigInt(this.byteCount) << 3n);
        this.step();
        this.position = 0;
    }
    /**
     * @param {File[]} files
     * @return {Promise}
     */
    async openFiles(files) {
        for (const file of files) {
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
            tr.append(resultCell);
            document.getElementById("tbody").append(tr);
            try {
                this.start();
                for await (const chunk of file.stream()) { // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
                    this.update(chunk);
                }
                this.finish();
                resultCell.className = "hex";
                resultCell.textContent = this.toString();
            } catch (cause) {
                resultCell.className = "error";
                resultCell.textContent = cause;
            }
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const parts = [];
        for (const value of this.out) {
            parts.push((SHA512.TO_STRING | value).toString(16).substring(1));
        }
        return parts.join("");
    }
    /**
     * @return {string}
     */
    viewToString() {
        const parts = [];
        for (let index = 0; index < SHA512.BLOCK_SIZE; index++) {
            parts.push((0x100 | this.view.getUint8(index)).toString(16).substring(1));
        }
        return parts.join(" ");
    }
}
(handler => {
    window.addEventListener("dragenter", handler);
    window.addEventListener("dragover", handler);
})(function(event) {
    event.dataTransfer.dropEffect = "copy";
    event.stopPropagation();
    event.preventDefault();
});
(sha512 => {
    window.app = sha512;
    window.addEventListener("drop", event => {
        event.preventDefault();
        sha512.openFiles(event.dataTransfer.files);
    });
    document.addEventListener("readystatechange", () => {
        if (document.readyState !== "interactive") {
            return;
        }
        document.getElementById("fileInput").addEventListener("change", event => {
            sha512.openFiles(event.target.files);
        });
    });
})(new SHA512());