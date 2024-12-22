class MD4 {
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
     * @param {number} x int32
     * @param {number} y int32
     * @param {number} z int32
     * @return {number} int32
     */
    static #parity(x, y, z) {
        return x ^ y ^ z;
    }
    /** @type {number[]} length = 16 */
    static #REMAP = (new Array(4)).fill([0, 3, 2, 1]).flat();
    /** @type {number[]} */
    static #INPUT_G = [
        0, 4, 8, 12,
        1, 5, 9, 13,
        2, 6, 10, 14,
        3, 7, 11, 15
    ];
    /** @type {number[]} */
    static #INPUT_H = [
        0, 8, 4, 12,
        2, 10, 6, 14,
        1, 9, 5, 13,
        3, 11, 7, 15
    ];
    /** @type {number[]} */
    static #ROTATE_F = [3, 7, 11, 19];
    /** @type {number[]} */
    static #ROTATE_G = [3, 5, 9, 13];
    /** @type {number[]} */
    static #ROTATE_H = [3, 9, 11, 15];
    /** @type {number[]} int32, length = 16 */
    #input;
    /** @type {number[]} int32, length = 8; a, b, c, d, aa, bb, cc, dd */
    #output;
    #start() {
        this.#output = [
            0x67452301,
            0xefcdab89,
            0x98badcfe,
            0x10325476,
            0,
            0,
            0,
            0
        ];
    }
    /**
     * @param {DataView} view padded input
     * @param {number} offset of bytes
     * @return {number} offset afterwards
     */
    #step(view, offset) {
        this.#input = [];
        for (let i = 0; i < 16; i++) {
            this.#input.push(view.getInt32(offset, true));
            offset += 4;
        }
        for (let i = 0; i < 4; i++) {
            this.#output[i + 4] = this.#output[i];
        }
        for (let i = 0; i < 16; i++) {
            this.#stepF(MD4.#REMAP[i], i, MD4.#ROTATE_F[i & 3]);
        }
        for (let i = 0; i < 16; i++) {
            this.#stepG(MD4.#REMAP[i], MD4.#INPUT_G[i], MD4.#ROTATE_G[i & 3]);
        }
        for (let i = 0; i < 16; i++) {
            this.#stepH(MD4.#REMAP[i], MD4.#INPUT_H[i], MD4.#ROTATE_H[i & 3]);
        }
        for (let i = 0; i < 4; i++) {
            this.#output[i] = (this.#output[i] + this.#output[i + 4]) & -1;
        }
        return offset;
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} inputIndex from 0 to 15
     * @param {number} rotate from 0 to 32 (usually between)
     * @return {number} int32
     */
    #stepF(remap, inputIndex, rotate) {
        const value = this.#output[remap] + MD4.#select(
                this.#output[(remap + 1) & 0x3],
                this.#output[(remap + 2) & 0x3],
                this.#output[(remap + 3) & 0x3]
            ) + this.#input[inputIndex];
        this.#output[remap] = ((value << rotate) | (value >>> (32 - rotate)));
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} inputIndex from 0 to 15
     * @param {number} rotate from 0 to 32 (usually between)
     * @return {number} int32
     */
    #stepG(remap, inputIndex, rotate) {
        const value = this.#output[remap] + MD4.#vote(
                this.#output[(remap + 1) & 0x3],
                this.#output[(remap + 2) & 0x3],
                this.#output[(remap + 3) & 0x3]
            ) + this.#input[inputIndex] + 0x5a827999;
        this.#output[remap] = ((value << rotate) | (value >>> (32 - rotate)));
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} inputIndex from 0 to 15
     * @param {number} rotate from 0 to 32 (usually between)
     * @return {number} int32
     */
    #stepH(remap, inputIndex, rotate) {
        const value = this.#output[remap] + MD4.#parity(
                this.#output[(remap + 1) & 0x3],
                this.#output[(remap + 2) & 0x3],
                this.#output[(remap + 3) & 0x3]
            ) + this.#input[inputIndex] + 0x6ed9eba1;
        this.#output[remap] = ((value << rotate) | (value >>> (32 - rotate)));
    }
    /**
     * @param {boolean} upperCase
     * @return {string}
     */
    hexResult(upperCase) {
        const words = [];
        for (let i = 0; i < 4; i++) {
            let word = this.#output[i];
            word = 0xff000000 & (word << 24) | 0x00ff0000 & (word << 8) | 0x0000ff00 & (word >> 8) | 0x000000ff & (word >> 24);
            if (word < 0) {
                word += 2 ** 32;
            }
            word = word.toString(16);
            if (upperCase) {
                word = word.toUpperCase();
            }
            word = word.padStart(8, '00000000');
            words.push(word);
        }
        return words.join('');
    }
    /**
     * @return {string}
     */
    base64Result() {
        const view = new DataView(new ArrayBuffer(16));
        for (let i = 0; i < 4; i++) {
            view.setInt32(i * 4, this.#output[i], true);
        }
        const bytes = [];
        for (let i = 0; i < 16; i++) {
            bytes.push(view.getUint8(i));
        }
        return btoa(String.fromCodePoint(...bytes));
    }
    /**
     * @param {File} file
     * @return {Promise}
     */
    digestFile(file) {
        const byteLength = file.size;
        const blockCount = (byteLength + 72) >>> 6;
        const padding = new ArrayBuffer((blockCount << 6) - byteLength);
        const paddingView = new DataView(padding);
        paddingView.setUint8(0, 0x80);
        paddingView.setBigUint64(padding.byteLength - 8, BigInt(byteLength) << 3n, true);
        const data = new Blob([file, padding]);
        return data.arrayBuffer().then(buffer => {
            const view = new DataView(buffer);
            this.#start();
            let offset = 0;
            for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
                offset = this.#step(view, offset);
            }
            return this;
        });
    }
    /**
     * @param {string} string
     * @return {Promise}
     */
    digestString(string) {
        const bytes = (new TextEncoder()).encode(string);
        const byteLength = bytes.length;
        const blockCount = (byteLength + 72) >>> 6;
        const padding = new ArrayBuffer((blockCount << 6) - byteLength);
        const paddingView = new DataView(padding);
        paddingView.setUint8(0, 0x80);
        paddingView.setBigUint64(padding.byteLength - 8, BigInt(byteLength) << 3n, true);
        const data = new Blob([bytes, padding]);
        return data.arrayBuffer().then(buffer => {
            const view = new DataView(buffer);
            this.#start();
            let offset = 0;
            for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
                offset = this.#step(view, offset);
            }
            return this;
        });
    }
    /**
     * @param {File} file
     * @param {boolean} upperCase of the hex result
     */
    processFile(file, upperCase = false) {
        const section = document.createElement("div");
        section.className = "section";
        const appendKV = (key, value) => {
            const keySpan = document.createElement("span");
            keySpan.textContent = key + ": ";
            keySpan.className = "key";
            const valueSpan = document.createElement("span");
            valueSpan.textContent = value;
            valueSpan.className = key.toLowerCase().replaceAll(' ', '-');
            const line = document.createElement("div");
            line.className = "kv";
            line.append(keySpan, valueSpan);
            section.append(line);
        };
        appendKV("File name", file.name);
        appendKV("File size", file.size + " byte(s)");
        document.body.append(section);
        this.digestFile(file).then(() => {
            appendKV("Hex MD4", this.hexResult(upperCase));
            appendKV("Base64 MD4", this.base64Result());
        }, cause => {
            appendKV("Error", cause);
        });
    }
    /**
     * @param {string} string
     * @param {boolean} upperCase of the hex result
     */
    processString(string, upperCase = false) {
        const section = document.createElement("div");
        section.className = "section";
        const appendKV = (key, value) => {
            const keySpan = document.createElement("span");
            keySpan.textContent = key + ": ";
            keySpan.className = "key";
            const valueSpan = document.createElement("span");
            valueSpan.textContent = value;
            valueSpan.className = key.toLowerCase().replaceAll(' ', '-');
            const line = document.createElement("div");
            line.className = "kv";
            line.append(keySpan, valueSpan);
            section.append(line);
        };
        appendKV("String", string.length >= 64 ? string.substring(0, 60) + "..." : string);
        appendKV("String length", string.length + " char(s)");
        document.body.append(section);
        this.digestString(string).then(() => {
            appendKV("Hex MD4", this.hexResult(upperCase));
            appendKV("Base64 MD4", this.base64Result());
        }, cause => {
            appendKV("Error", cause);
        });
    }
    /**
     * @param {FileList} fileList
     * @param {boolean} upperCase of the hex result
     */
    processFileList(fileList, upperCase = false) {
        for (const file of fileList) {
            this.processFile(file, upperCase);
        }
    }
    /**
     * @param {DataTransferItemList} list
     * @param {boolean} upperCase of the hex result
     */
    processDataTransferItemList(list, upperCase = false) {
        for (const item of list) {
            if (item.kind === "file") {
                this.processFile(item.getAsFile(), upperCase);
            } else if (item.kind === "string") {
                item.getAsString(string => {
                    this.processString(string, upperCase);
                });
            }
        }
    }
}
window.addEventListener("load", () => {
    function handle(event) {
        event.dataTransfer.dropEffect = "copy";
        event.preventDefault();
        event.stopPropagation();
    }
    window.addEventListener("dragover", handle);
    window.addEventListener("dragenter", handle);
});
window.addEventListener("load", () => {
    const md4 = new MD4();
    document.getElementById("fileInput").addEventListener("change", event => {
        md4.processFileList(event.target.files);
    });
    window.addEventListener("drop", event => {
        event.preventDefault();
        md4.processDataTransferItemList(event.dataTransfer.items, event.shiftKey);
    });
});