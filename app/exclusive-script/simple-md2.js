class MD2 {
    static #PERMUTATION = [
        41, 46, 67, 201, 162, 216, 124, 1, 61, 54, 84, 161, 236, 240, 6,
        19, 98, 167, 5, 243, 192, 199, 115, 140, 152, 147, 43, 217, 188,
        76, 130, 202, 30, 155, 87, 60, 253, 212, 224, 22, 103, 66, 111, 24,
        138, 23, 229, 18, 190, 78, 196, 214, 218, 158, 222, 73, 160, 251,
        245, 142, 187, 47, 238, 122, 169, 104, 121, 145, 21, 178, 7, 63,
        148, 194, 16, 137, 11, 34, 95, 33, 128, 127, 93, 154, 90, 144, 50,
        39, 53, 62, 204, 231, 191, 247, 151, 3, 255, 25, 48, 179, 72, 165,
        181, 209, 215, 94, 146, 42, 172, 86, 170, 198, 79, 184, 56, 210,
        150, 164, 125, 182, 118, 252, 107, 226, 156, 116, 4, 241, 69, 157,
        112, 89, 100, 113, 135, 32, 134, 91, 207, 101, 230, 45, 168, 2, 27,
        96, 37, 173, 174, 176, 185, 246, 28, 70, 97, 105, 52, 64, 126, 15,
        85, 71, 163, 35, 221, 81, 175, 58, 195, 92, 249, 206, 186, 197,
        234, 38, 44, 83, 13, 110, 133, 40, 132, 9, 211, 223, 205, 244, 65,
        129, 77, 82, 106, 220, 55, 200, 108, 193, 171, 250, 36, 225, 123,
        8, 12, 189, 177, 74, 120, 136, 149, 139, 227, 99, 232, 109, 233,
        203, 213, 254, 59, 0, 29, 57, 242, 239, 183, 14, 102, 88, 208, 228,
        166, 119, 114, 248, 235, 117, 75, 10, 49, 68, 80, 180, 143, 237,
        31, 26, 219, 153, 141, 51, 159, 17, 131, 20
    ];
    /** @type {Uint8Array} */
    #checksum;
    /** @type {Uint8Array} */
    #out;
    constructor() {
        this.#checksum = new Uint8Array(new ArrayBuffer(16));
        this.#out = new Uint8Array(new ArrayBuffer(48));
    }
    #reset() {
        for (let i = 0; i < 16; i++) {
            this.#checksum[i] = 0;
            this.#out[i] = 0;
        }
    }
    /**
     * @param {Uint8Array} inputBytes
     * @param {number} offset of bytes
     */
    #step(inputBytes, offset = 0) {
        this.#step2(inputBytes, offset);
        this.#step4(inputBytes, offset);
    }
    /**
     * Append Checksum.
     * @param {Uint8Array} inputBytes
     * @param {number} offset of bytes
     */
    #step2(inputBytes, offset = 0) {
        let previous = this.#checksum[15];
        for (let i = 0; i < 16; i++) {
            const value = inputBytes[offset++];
            previous = this.#checksum[i] ^ MD2.#PERMUTATION[previous ^ value];
            this.#checksum[i] = previous;
        }
    }
    /**
     * Process Message in 16-Byte Blocks.
     * @param {Uint8Array} inputBytes
     * @param {number} offset of bytes
     */
    #step4(inputBytes, offset = 0) {
        for (let i = 0; i < 16; i++) {
            const value = inputBytes[offset++];
            this.#out[16 + i] = value;
            this.#out[32 + i] = value ^ this.#out[i];
        }
        let previous = 0;
        for (let i = 0; i < 18; i++) {
            for (let j = 0; j < 48; j++) {
                previous = this.#out[j] ^ MD2.#PERMUTATION[previous];
                this.#out[j] = previous;
            }
            previous = 0xff & (previous + i);
        }
    }
    #finish() {
        this.#step4(this.#checksum);
    }
    /**
     * @param {File} file
     * @return {Promise}
     */
    digestFile(file) {
        const byteLength = file.size;
        const blockCount = (byteLength + 15) >>> 4;
        const paddingLength = (blockCount << 4) - byteLength;
        const padding = new ArrayBuffer(paddingLength);
        const paddingBytes = new Uint8Array(padding);
        for (let i = 0; i < paddingLength; i++) {
            paddingBytes[i] = paddingLength;
        }
        const data = new Blob([file, padding]);
        return data.arrayBuffer().then(buffer => {
            const bytes = new Uint8Array(buffer);
            this.#reset();
            for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
                this.#step(bytes, blockIndex << 4);
            }
            this.#finish();
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
        const blockCount = (byteLength + 15) >>> 4;
        const paddingLength = (blockCount << 4) - byteLength;
        const padding = new ArrayBuffer(paddingLength);
        const paddingBytes = new Uint8Array(padding);
        for (let i = 0; i < paddingLength; i++) {
            paddingBytes[i] = paddingLength;
        }
        const data = new Blob([bytes, padding]);
        return data.arrayBuffer().then(buffer => {
            const bytes = new Uint8Array(buffer);
            this.#reset();
            for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
                this.#step(bytes, blockIndex << 4);
            }
            this.#finish();
            return this;
        });
    }
    /**
     * @param {File} file
     */
    processFile(file) {
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
            appendKV("Hex MD2", this.toString());
        }, cause => {
            appendKV("Error", cause);
        });
    }
    /**
     * @param {string} string
     */
    processString(string) {
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
            appendKV("Hex MD2", this.toString());
        }, cause => {
            appendKV("Error", cause);
        });
    }
    /**
     * @param {FileList} fileList
     */
    processFileList(fileList) {
        for (const file of fileList) {
            this.processFile(file);
        }
    }
    /**
     * @param {DataTransferItemList} list
     */
    processDataTransferItemList(list) {
        for (const item of list) {
            if (item.kind === "file") {
                this.processFile(item.getAsFile());
            } else if (item.kind === "string") {
                item.getAsString(string => {
                    this.processString(string);
                });
            }
        }
    }
    /**
     * @return {string}
     */
    toString() {
        const parts = [];
        for (let index = 0; index < 16; index++) {
            parts.push(this.#out[index].toString(16).padStart(2, '0'));
        }
        return parts.join('');
    }
}
window.addEventListener("load", () => {
    const handler = (dragEvent) => {
        dragEvent.dataTransfer.dropEffect = "copy";
        dragEvent.preventDefault();
        dragEvent.stopPropagation();
    }
    window.addEventListener("dragenter", handler);
    window.addEventListener("dragover", handler);
});
window.addEventListener("load", () => {
    const md2 = new MD2();
    document.getElementById("fileInput").addEventListener("change", event => {
        md2.processFileList(event.target.files);
    });
    window.addEventListener("drop", event => {
        event.preventDefault();
        md2.processDataTransferItemList(event.dataTransfer.items);
    });
});