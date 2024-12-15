class MD5 {
    /** @type {number[]} */
    static #REMAP = Object.freeze([0, 3, 2, 1]);
    /** @type {number[]} */
    static #ROTATE_F = Object.freeze([7, 12, 17, 22]);
    /** @type {number[]} */
    static #ROTATE_G = Object.freeze([5, 9, 14, 20]);
    /** @type {number[]} */
    static #ROTATE_H = Object.freeze([4, 11, 16, 23]);
    /** @type {number[]} */
    static #ROTATE_I = Object.freeze([6, 10, 15, 21]);
    /** @type {number[]} unsigned int32, length = 16 */
    static #TABLE = (() => {
        const INT32 = 2 ** 32;
        const table = [];
        for (let i = 0; i < 64; i++) {
            table.push(Math.floor(INT32 * Math.abs(Math.sin(i + 1))));
        }
        return Object.freeze(table);
    })();
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
            this.#stepF(MD5.#REMAP[i & 3], MD5.#ROTATE_F[i & 3], i, i);
        }
        for (let i = 0; i < 16; i++) {
            this.#stepG(MD5.#REMAP[i & 3], MD5.#ROTATE_G[i & 3], (i * 5 + 1) & 15, 16 + i);
        }
        for (let i = 0; i < 16; i++) {
            this.#stepH(MD5.#REMAP[i & 3], MD5.#ROTATE_H[i & 3], (i * 3 + 5) & 15, 32 + i);
        }
        for (let i = 0; i < 16; i++) {
            this.#stepI(MD5.#REMAP[i & 3], MD5.#ROTATE_I[i & 3], (i * 7) & 15, 48 + i);
        }
        for (let i = 0; i < 4; i++) {
            this.#output[i] = (this.#output[i] + this.#output[i + 4]) & -1;
        }
        return offset;
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} rotate from 0 to 32 (usually between)
     * @param {number} inputIndex from 0 to 15
     * @param {number} tableIndex from 0 to 63
     * @return {number} int32
     */
    #stepF(remap, rotate, inputIndex, tableIndex) {
        // console.log(remap, inputIndex, rotate, (tableIndex + 1));
        let value = this.#output[(remap + 1) & 3];
        value = (value & this.#output[(remap + 2) & 3]) | (~value & this.#output[(remap + 3) & 3]);
        value = this.#output[remap] + value + this.#input[inputIndex] + MD5.#TABLE[tableIndex];
        value = this.#output[(remap + 1) & 3] + ((value << rotate) | (value >>> (32 - rotate)));
        this.#output[remap] = value & -1;
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} rotate from 0 to 32 (usually between)
     * @param {number} inputIndex from 0 to 15
     * @param {number} tableIndex from 0 to 63
     * @return {number} int32
     */
    #stepG(remap, rotate, inputIndex, tableIndex) {
        let value = this.#output[(remap + 3) & 3];
        value = (value & this.#output[(remap + 1) & 3]) | (~value & this.#output[(remap + 2) & 3]);
        value = this.#output[remap] + value + this.#input[inputIndex] + MD5.#TABLE[tableIndex];
        value = this.#output[(remap + 1) & 3] + ((value << rotate) | (value >>> (32 - rotate)));
        this.#output[remap] = value & -1;
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} rotate from 0 to 32 (usually between)
     * @param {number} inputIndex from 0 to 15
     * @param {number} tableIndex from 0 to 63
     * @return {number} int32
     */
    #stepH(remap, rotate, inputIndex, tableIndex) {
        let value = this.#output[(remap + 1) & 3] ^ this.#output[(remap + 2) & 3] ^ this.#output[(remap + 3) & 3];
        value = this.#output[remap] + value + this.#input[inputIndex] + MD5.#TABLE[tableIndex];
        value = this.#output[(remap + 1) & 3] + ((value << rotate) | (value >>> (32 - rotate)));
        this.#output[remap] = value & -1;
    }
    /**
     * @param {number} remap from 0 to 3
     * @param {number} rotate from 0 to 32 (usually between)
     * @param {number} inputIndex from 0 to 15
     * @param {number} tableIndex from 0 to 63
     * @return {number} int32
     */
    #stepI(remap, rotate, inputIndex, tableIndex) {
        let value = this.#output[(remap + 2) & 3] ^ (this.#output[(remap + 1) & 3] | ~this.#output[(remap + 3) & 3]);
        value = this.#output[remap] + value + this.#input[inputIndex] + MD5.#TABLE[tableIndex];
        value = this.#output[(remap + 1) & 3] + ((value << rotate) | (value >>> (32 - rotate)));
        this.#output[remap] = value & -1;
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
     * @param {FileList} fileList
     * @param {boolean} upperCase
     */
    digestFileList(fileList, upperCase = false) {
        for (const file of fileList) {
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
                appendKV("Hex MD5", this.hexResult(upperCase));
                appendKV("Base64 MD5", this.base64Result());
            }, cause => {
                appendKV("Error", cause);
            });
        }
    }
}
window.addEventListener("load", () => {
    const handler = function (event) {
        event.dataTransfer.dropEffect = "copy";
        event.preventDefault();
        event.stopPropagation();
    }
    window.addEventListener("dragenter", handler);
    window.addEventListener("dragover", handler);
});
window.addEventListener("load", () => {
    const open = function(files, upperCase) {
        (new MD5()).digestFileList(files, upperCase);
    };
    document.getElementById("fileInput").addEventListener("change", event => {
        open(event.target.files);
    });
    window.addEventListener("drop", dragEvent => {
        dragEvent.preventDefault();
        open(dragEvent.dataTransfer.files, dragEvent.shiftKey);
    });
});