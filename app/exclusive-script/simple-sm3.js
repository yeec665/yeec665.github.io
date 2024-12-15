class SM3 {
    static #INITIAL_VECTOR = [
        0x7380166f,
        0x4914b2b9,
        0x172442d7,
        0xda8a0600,
        0xa96f30bc,
        0x163138aa,
        0xe38dee4d,
        0xb0fb0e4e
    ];
    /**
     * @param {number} value int32
     * @param {number} distance
     * @return {number} int32
     */
    static #rotateLeft(value, distance) {
        distance &= 0x1f; // mod Integer.SIZE
        if (distance != 0) {
            value = (value << distance) | (value >>> (32 - distance));
        }
        return value;
    }
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static #select(x, y, z) {
        return (x & y) ^ (~x & z);
    }
    /**
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static #vote(x, y, z) {
        return (x & y) ^ (x & z) ^ (y & z);
    }
    /**
     * @type {DataView} 64 bytes, 16 words
     */
    #cumulation;
    /**
     * @type {number} between 0 and 64
     */
    #position;
    /**
     * @type {number[]} int32, length = 8
     */
    #output;
    /**
     * @type {number}
     */
    #byteCount;
    constructor() {
        this.#cumulation = new DataView(new ArrayBuffer(64));
    }
    #start() {
        this.#output = SM3.#INITIAL_VECTOR.slice(); // clone array
        this.#position = 0;
        this.#byteCount = 0;
    }
    #step() {
        /** @type {number[]} int32, length = 68 */
        const input = [];
        for (let offset = 0; offset < 64; offset += 4) {
            input.push(this.#cumulation.getInt32(offset));
        }
        for (let i = 16; i < 68; i++) {
            let v3 = input[i - 3];
            v3 = (v3 << 15) | (v3 >>> 17);
            v3 = input[i - 16] ^ input[i - 9] ^ v3;
            v3 = v3 ^ ((v3 << 15) | (v3 >>> 17)) ^ ((v3 << 23) | (v3 >>> 9));
            let v13 = input[i - 13];
            v13 = (v13 << 7) | (v13 >>> 25);
            input[i] = v3 ^ v13 ^ input[i - 6];
        }
        let a = this.#output[0];
        let b = this.#output[1];
        let c = this.#output[2];
        let d = this.#output[3];
        let e = this.#output[4];
        let f = this.#output[5];
        let g = this.#output[6];
        let h = this.#output[7];
        for (let i = 0; i < 16; i++) {
            const ss1 = SM3.#rotateLeft(
                SM3.#rotateLeft(a, 12) + e + SM3.#rotateLeft(0x79cc4519, i), 7
            );
            const ss2 = ss1 ^ SM3.#rotateLeft(a, 12);
            const tt1 = (a ^ b ^ c) + d + ss2 + (input[i] ^ input[i + 4]);
            const tt2 = (e ^ f ^ g) + h + ss1 + input[i];
            d = c;
            c = SM3.#rotateLeft(b, 9);
            b = a;
            a = tt1;
            h = g;
            g = SM3.#rotateLeft(f, 19);
            f = e;
            e = tt2 ^ SM3.#rotateLeft(tt2, 9) ^ SM3.#rotateLeft(tt2, 17);
        }
        for (let i = 16; i < 64; i++) {
            const ss1 = SM3.#rotateLeft(
                SM3.#rotateLeft(a, 12) + e + SM3.#rotateLeft(0x7a879d8a, i), 7
            );
            const ss2 = ss1 ^ SM3.#rotateLeft(a, 12);
            const tt1 = SM3.#vote(a, b, c) + d + ss2 + (input[i] ^ input[i + 4]);
            const tt2 = SM3.#select(e, f, g) + h + ss1 + input[i];
            d = c;
            c = SM3.#rotateLeft(b, 9);
            b = a;
            a = tt1;
            h = g;
            g = SM3.#rotateLeft(f, 19);
            f = e;
            e = tt2 ^ SM3.#rotateLeft(tt2, 9) ^ SM3.#rotateLeft(tt2, 17);
        }
        this.#output[0] ^= a;
        this.#output[1] ^= b;
        this.#output[2] ^= c;
        this.#output[3] ^= d;
        this.#output[4] ^= e;
        this.#output[5] ^= f;
        this.#output[6] ^= g;
        this.#output[7] ^= h;
        this.#position = 0;
    }
    /**
     * @param {Uint8Array} data
     */
    #update(data) {
        const length = data.byteLength;
        this.#byteCount += length;
        for (let offset = 0; offset < length;) {
            const count = Math.min(64 - this.#position, length - offset);
            for (let index = 0; index < count; index++) {
                this.#cumulation.setUint8(this.#position++, data[offset++]);
            }
            if (this.#position == 64) {
                this.#step();
            }
        }
    }
    #finish() {
        let onePadded = false;
        if (this.#position > 55) { // need one more block
            if (this.#position < 64) {
                this.#cumulation.setUint8(this.#position++, 0x80);
                onePadded = true;
            }
            while (this.position < 64) {
                this.#cumulation.setUint8(this.#position++, 0);
            }
            this.#step();
        }
        if (!onePadded) {
            this.#cumulation.setUint8(this.#position++, 0x80);
        }
        while (this.#position < 56) {
            this.#cumulation.setUint8(this.#position++, 0);
        }
        this.#cumulation.setBigUint64(56, BigInt(this.#byteCount) << 3n);
        this.#step();
    }
    /**
     * @param {string} text
     */
    digestText(text) {
        const tr = document.createElement("tr");
        {
            const nameCell = document.createElement("td");
            nameCell.textContent = "text " + (text.length > 12 ? text.substring(0, 10) + "..." : text);
            tr.append(nameCell);
        }
        const sizeCell = document.createElement("td");
        sizeCell.textContent = text.length + " char(s)";
        tr.append(sizeCell);
        const resultCell = document.createElement("td");
        tr.append(resultCell);
        document.querySelector("tbody").append(tr);
        try {
            const data = (new TextEncoder()).encode(text);
            sizeCell.textContent = data.length + " byte(s)";
            this.#start();
            this.#update(data);
            this.#finish();
            resultCell.className = "hex";
            resultCell.textContent = this.toString();
        } catch (cause) {
            console.error(cause);
            resultCell.className = "error";
            resultCell.textContent = cause;
        }
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
                nameCell.textContent = "file " + file.name;
                tr.append(nameCell);
            }
            {
                const sizeCell = document.createElement("td");
                sizeCell.textContent = file.size + " byte(s)";
                tr.append(sizeCell);
            }
            const resultCell = document.createElement("td");
            tr.append(resultCell);
            document.querySelector("tbody").append(tr);
            try {
                this.#start();
                for await (const chunk of file.stream()) {
                    this.#update(chunk);
                }
                this.#finish();
                resultCell.className = "hex";
                resultCell.textContent = this.toString();
            } catch (cause) {
                console.error(cause);
                resultCell.className = "error";
                resultCell.textContent = cause;
            }
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const INT32 = 2 ** 32;
        const words = [];
        for (let word of this.#output) {
            if (word < 0) {
                word += INT32;
            }
            words.push(word.toString(16).padStart(8, '0'));
        }
        return words.join('');
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
(sm3 => {
    window.app = sm3;
    window.addEventListener("drop", event => {
        event.preventDefault();
        sm3.openFiles(event.dataTransfer.files);
    });
    document.addEventListener("readystatechange", () => {
        if (document.readyState !== "interactive") {
            return;
        }
        sm3.digestText("abc");
        sm3.digestText("abcd".repeat(16));
        document.getElementById("fileInput").addEventListener("change", event => {
            sm3.openFiles(event.target.files);
        });
    });
})(new SM3());