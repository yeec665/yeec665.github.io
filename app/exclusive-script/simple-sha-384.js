class SHA384 {
    static MASK64 = 0xffffffffffffffffn;
    /**
     * @param {bigint} x int64
     * @param {bigint} y int64
     * @param {bigint} z int64
     * @return {bigint} int64
     */
    static choose(x, y, z) {
        return SHA384.MASK64 & ((x & y) ^ (~x & z));
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
        return SHA384.MASK64 & (
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
        return SHA384.MASK64 & (
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
        return SHA384.MASK64 & (
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
        return SHA384.MASK64 & (
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
        for (let index = 8; index < 16; index++) {
            const target = BigInt(primes[index]) << 128n; // 2 * 64
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
            SHA384.INITIAL.push(low & SHA384.MASK64);
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
            SHA384.ADDEND.push(low & SHA384.MASK64);
        }
    }
    static BLOCK_SIZE = 128;
    constructor() {
        const cumulation = new ArrayBuffer(SHA384.BLOCK_SIZE);
        /** @type {DataView} */
        this.view = new DataView(cumulation);
        /** @type {bigint[]} int64, length = 8, inner state between steps */
        this.out;
        /** @type {number} between 0 and 128, normally not 128 */
        this.position;
        /** @type {number} */
        this.byteCount;
    }
    start() {
        this.position = 0;
        this.byteCount = 0;
        this.out = SHA384.INITIAL.slice();
    }
    step() {
        const mid = [];
        for (let i = 0; i < 16; i++) {
            mid.push(this.view.getBigUint64(8 * i));
        }
        for (let i = 16; i < 80; i++) {
            mid.push(SHA384.MASK64 & (
                SHA384.sigma1(mid[i - 2])
                + mid[i - 7]
                + SHA384.sigma0(mid[i - 15])
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
            const t1 = h
                    + SHA384.bigSigma1(e)
                    + SHA384.choose(e, f, g)
                    + SHA384.ADDEND[i]
                    + mid[i];
            const t2 = SHA384.bigSigma0(a)
                    + SHA384.majority(a, b, c);
            h = g;
            g = f;
            f = e;
            e = SHA384.MASK64 & (d + t1);
            d = c;
            c = b;
            b = a;
            a = SHA384.MASK64 & (t1 + t2);
        }
        this.out[0] = SHA384.MASK64 & (this.out[0] + a);
        this.out[1] = SHA384.MASK64 & (this.out[1] + b);
        this.out[2] = SHA384.MASK64 & (this.out[2] + c);
        this.out[3] = SHA384.MASK64 & (this.out[3] + d);
        this.out[4] = SHA384.MASK64 & (this.out[4] + e);
        this.out[5] = SHA384.MASK64 & (this.out[5] + f);
        this.out[6] = SHA384.MASK64 & (this.out[6] + g);
        this.out[7] = SHA384.MASK64 & (this.out[7] + h);
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
        if (this.position + 17 > SHA384.BLOCK_SIZE) {
            if (this.position < SHA384.BLOCK_SIZE) {
                this.view.setUint8(this.position++, 0x80);
                onePadded = true;
            }
            while (this.position < SHA384.BLOCK_SIZE) {
                this.view.setUint8(this.position++, 0);
            }
            this.step();
            this.position = 0;
        }
        if (!onePadded) {
            this.view.setUint8(this.position++, 0x80);
        }
        while (this.position < SHA384.BLOCK_SIZE - 8) {
            this.view.setUint8(this.position++, 0);
        }
        this.view.setBigUint64(SHA384.BLOCK_SIZE - 8, BigInt(this.byteCount) << 3n);
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
                for await (const chunk of file.stream()) {
                    console.log(chunk[0], chunk[1]);
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
        for (let index = 0; index < 6; index++) {
            parts.push(this.out[index].toString(16).padStart(16, ''));
        }
        return parts.join('');
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
(sha384 => {
    window.app = sha384;
    window.addEventListener("drop", event => {
        event.preventDefault();
        sha384.openFiles(event.dataTransfer.files);
    });
    document.addEventListener("readystatechange", () => {
        if (document.readyState !== "interactive") {
            return;
        }
        document.getElementById("fileInput").addEventListener("change", event => {
            sha384.openFiles(event.target.files);
        });
    });
})(new SHA384());