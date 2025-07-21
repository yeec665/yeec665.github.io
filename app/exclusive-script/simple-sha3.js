class SHA3 {
    static NR = 24; // number of rounds
    static RC = [
        1, 26, 94, 112, 31, 33, 121, 85, 14, 12, 53, 38, 63, 79, 93, 83, 82, 72, 22, 102, 121, 88, 33, 116
    ]; // round constants
    static S = 5; // width and height
    static L = 6; // log lane size
    static W = 64; // lane size
    static printRC() {
        const rcs = this.RC.map(byte => {
            let long = 0n;
            for (let i = 0; i <= this.L; i++) {
                let bit = 1 << i;
                if ((byte & bit) != 0) {
                    bit--;
                    long |= 1n << BigInt(bit);
                }
            }
            return '0x' + long.toString(16) + 'L';
        });
        console.log('[' + rcs.join(', ') + ']'); // for test
    }
    /**
     * @return {boolean[][][]} [x][y][z] whre 0 <= x < 5, 0 <= y < 5, 0 <= z < 64
     */
    static createState() {
        const state = [];
        for (let x = 0; x < SHA3.S; x++) {
            const sheet = [];
            for (let y = 0; y < SHA3.S; y++) {
                const lane = [];
                for (let z = 0; z < SHA3.W; z++) {
                    lane.push(false);
                }
                sheet.push(lane);
            }
            state.push(sheet);
        }
        return state;
    }
    /**
     * @return {boolean[][]} [x][z] whre 0 <= x < 5, 0 <= z < 64
     */
    static createPlane() {
        const plane = [];
        for (let x = 0; x < SHA3.S; x++) {
            const lane = [];
            for (let z = 0; z < SHA3.W; z++) {
                lane.push(false);
            }
            plane.push(lane);
        }
        return plane;
    }
    /**
     * @param {boolean[][][]} state
     * @param {function} callback given state value, return boolean to set, null to terminate, other to continue
     */
    static forEach(state, callback) {
        for (let y = 0; y < SHA3.S; y++) {
            for (let x = 0; x < SHA3.S; x++) {
                const lane = state[x][y];
                for (let z = 0; z < SHA3.W; z++) {
                    const oldValue = lane[z];
                    const newValue = callback(oldValue);
                    if ((typeof newValue) === "boolean") {
                        if (oldValue !== newValue) {
                            lane[z] = newValue;
                        }
                    } else if (newValue === null) {
                        return; // iterate no more
                    }
                }
            }
        }
    }
    /**
     * @param {boolean[][][]} srcState
     * @param {boolean[][][]} dstState
     * @param {boolean[][]} srcPlane
     * @param {boolean[][]} dstPlane
     */
    static theta(srcState, dstState, srcPlane, dstPlane) {
        for (let x = 0; x < SHA3.S; x++) {
            const sheet = srcState[x];
            for (let z = 0; z < SHA3.W; z++) {
                let value = false;
                for (let y = 0; y < SHA3.S; y++) {
                    if (sheet[y][z]) {
                        value = !value; // boolean xor
                    }
                }
                srcPlane[x][z] = value;
            }
        }
        for (let x = 0; x < SHA3.S; x++) {
            for (let z = 0; z < SHA3.W; z++) {
                let value = srcPlane[(x + SHA3.S - 1) % SHA3.S][z];
                if (srcPlane[(x + 1) % SHA3.S][(z + SHA3.W - 1) % SHA3.W]) {
                    value = !value; // boolean xor
                }
                dstPlane[x][z] = value;
            }
        }
        for (let x = 0; x < SHA3.S; x++) {
            const srcSheet = srcState[x];
            const dstSheet = dstState[x];
            for (let z = 0; z < SHA3.W; z++) {
                const flip = dstPlane[x][z];
                for (let y = 0; y < SHA3.S; y++) {
                    let value = srcSheet[y][z];
                    if (flip) {
                        value = !value; // boolean xor
                    }
                    dstSheet[y][z] = value;
                }
            }
        }
    }
    /**
     * @param {boolean[][][]} srcState
     * @param {boolean[][][]} dstState
     */
    static rho(srcState, dstState) {
        {
            const srcLane = srcState[0][0];
            const dstLane = dstState[0][0];
            for (let z = 0; z < SHA3.W; z++) {
                dstLane[z] = srcLane[z];
            }
        }
        const nt = SHA3.S * SHA3.S - 1;
        const base = nt * (nt + 1) / 2 * SHA3.W;
        let x = 1;
        let y = 0;
        for (let t = 0; t < nt; t++) {
            const baseT = base - (t + 1) * (t + 2) / 2;
            for (let z = 0; z < SHA3.W; z++) {
                dstState[x][y][z] = srcState[x][y][(baseT + z) % SHA3.W];
            }
            [x, y] = [y, (2 * x + 3 * y) % SHA3.S];
        }
    }
    /**
     * @param {boolean[][][]} srcState
     * @param {boolean[][][]} dstState
     */
    static pi(srcState, dstState) {
        for (let x = 0; x < SHA3.S; x++) {
            for (let y = 0; y < SHA3.S; y++) {
                const srcLane = srcState[(x + 3 * y) % SHA3.S][x];
                const dstLane = dstState[x][y];
                for (let z = 0; z < SHA3.W; z++) {
                    dstLane[z] = srcLane[z];
                }
            }
        }
    }
    /**
     * @param {boolean[][][]} srcState
     * @param {boolean[][][]} dstState
     */
    static chi(srcState, dstState) {
        for (let x = 0; x < SHA3.S; x++) {
            const srcSheet0 = srcState[x];
            const srcSheet1 = srcState[(x + 1) % SHA3.S];
            const srcSheet2 = srcState[(x + 2) % SHA3.S];
            const dstSheet = dstState[x];
            for (let y = 0; y < SHA3.S; y++) {
                const srcLane0 = srcSheet0[y];
                const srcLane1 = srcSheet1[y];
                const srcLane2 = srcSheet2[y];
                const dstLane = dstSheet[y];
                for (let z = 0; z < SHA3.W; z++) {
                    let value = !srcLane1[z] && srcLane2[z];
                    if (srcLane0[z]) {
                        value = !value; // boolean xor
                    }
                    dstLane[z] = value;
                }
            }
        }
    }
    
    /**
     * @param {number} ri round index
     * @param {boolean[][][]} state
     */
    static iota(ri, state) {
        const rc = SHA3.RC[ri];
        const lane = state[0][0];
        for (let j = 0; j <= this.L; j++) {
            let bit = 1 << j;
            if ((rc & bit) != 0) {
                bit--;
                lane[bit] = !lane[bit]; // boolean self xor
            }
        }
    }
    /**
     * @param {number} digestBits output size in bits, noted d in specification
     */
    constructor(digestBits) {
        /** @type {boolean[][][]} */
        this.state0 = SHA3.createState();
        /** @type {boolean[][][]} */
        this.state1 = SHA3.createState();
        /** @type {boolean[][]} */
        this.plane0 = SHA3.createPlane();
        /** @type {boolean[][]} */
        this.plane1 = SHA3.createPlane();
        /** @type {number} for algorithm name display */
        this.digestBits = digestBits;
        /** @type {number} noted r */
        this.rate = 1600 - 2 * digestBits;
        /** @type {Uint8Array} */
        this.cumulation = new Uint8Array(new ArrayBuffer(this.rate >> 3));
        /** @type {number} pointer of cumulation */
        this.position;
        /** @type {number[]} */
        this.chars = new Array(this.cumulation.byteLength << 1);
    }
    /**
     * @param {string} tag
     */
    printState(tag) {
        const chars = [];
        function encodeNibble(nibble) {
            if (nibble < 0xa) {
                nibble += 0x30;
            } else {
                nibble += 0x57;
            }
            chars.push(nibble);
        }
        let byteValue = 0;
        let bitIndex = 0;
        SHA3.forEach(this.state0, oldValue => {
            if (oldValue) {
                byteValue |= 1 << bitIndex;
            }
            if (++bitIndex >= 8) {
                encodeNibble(0xf & (byteValue >> 4));
                encodeNibble(0xf & byteValue);
                if (chars.length % 48 == 47) {
                    chars.push(0x3b); // semicolon
                } else {
                    chars.push(0x2c); // comma
                }
                byteValue = 0;
                bitIndex = 0;
            }
            return oldValue;
        });
        console.log(String.fromCharCode(...chars), tag);
    }
    start() {
        SHA3.forEach(this.state0, () => false); // all to zero
        this.position = 0;
    }
    /**
     * @param {boolean} debug
     */
    keccak(debug) {
        if (debug) {
            this.printState("#");
        }
        for (let ri = 0; ri < SHA3.NR; ri++) {
            SHA3.theta(this.state0, this.state1, this.plane0, this.plane1);
            if (debug) {
                this.printState(ri + "-A");
            }
            SHA3.rho(this.state1, this.state0);
            if (debug) {
                this.printState(ri + "-B");
            }
            SHA3.pi(this.state0, this.state1);
            if (debug) {
                this.printState(ri + "-C");
            }
            SHA3.chi(this.state1, this.state0);
            if (debug) {
                this.printState(ri + "-D");
            }
            SHA3.iota(ri, this.state0);
            if (debug) {
                this.printState(ri + "-E");
            }
        }
    }
    absorb() {
        let byteIndex = 0;
        let byteValue = null;
        let bitIndex = 8;
        SHA3.forEach(this.state0, oldValue => {
            if (bitIndex >= 8) {
                if (byteIndex >= this.cumulation.byteLength) {
                    return null;
                }
                byteValue = this.cumulation[byteIndex++];
                bitIndex = 0;
            }
            if ((byteValue & (1 << bitIndex++)) != 0) {
                oldValue = !oldValue; // boolean xor
            }
            return oldValue;
        });
    }
    /**
     * @param {boolean} debug
     */
    step(debug) {
        this.absorb();
        this.keccak(debug);
        this.position = 0;
    }
    /**
     * @param {Uint8Array} bytes
     * @param {number} offset
     * @param {boolean} debug
     */
    update(bytes, offset = 0, debug = false) {
        while (offset < bytes.byteLength) {
            const count = Math.min(this.cumulation.byteLength - this.position, bytes.byteLength - offset);
            for (let index = 0; index < count; index++) {
                this.cumulation[this.position++] = bytes[offset++];
            }
            if (this.position == this.cumulation.byteLength) {
                this.step(debug);
            }
        }
    }
    /**
     * @param {boolean} debug
     */
    pad(debug) {
        const cumulationLength = this.cumulation.byteLength;
        this.cumulation[this.position++] = 0x06;
        while (this.position < cumulationLength) {
            this.cumulation[this.position++] = 0;
        }
        this.cumulation[this.position - 1] |= 0x80;
        this.step(debug);
    }
    /**
     * @return {string}
     */
    sqeeze() {
        const cumulationLength = this.cumulation.byteLength;
        let byteIndex = 0;
        let byteValue = 0;
        let bitIndex = 0;
        SHA3.forEach(this.state0, oldValue => {
            if (oldValue) {
                byteValue |= 1 << bitIndex;
            }
            if (++bitIndex >= 8) {
                this.cumulation[byteIndex++] = byteValue;
                if (byteIndex >= cumulationLength) {
                    return null;
                }
                byteValue = 0;
                bitIndex = 0;
            }
            return oldValue;
        });
        let charIndex = 0;
        const encodeNibble = (nibble) => {
            if (nibble < 0xa) {
                nibble += 0x30;
            } else {
                nibble += 0x57;
            }
            this.chars[charIndex++] = nibble;
        }
        for (let cumulationIndex = 0; cumulationIndex < cumulationLength; cumulationIndex++) {
            const byte = this.cumulation[cumulationIndex];
            encodeNibble(0xf & (byte >> 4));
            encodeNibble(0xf & byte);
        }
        return String.fromCharCode(...this.chars); // hex only
    }
    /**
     * @param {boolean} debug
     * @return {string}
     */
    finish(debug = false) {
        this.pad(debug);
        const digestNibbles = this.digestBits >> 2;
        const segments = [];
        let segmentsLength = 0;
        while (true) {
            const segment = this.sqeeze();
            segments.push(segment);
            segmentsLength += segment.length;
            if (segmentsLength >= digestNibbles) {
                break;
            }
            this.keccak(debug);
        }
        return segments.join('').substring(0, digestNibbles);
    }
    /**
     * @return {string}
     */
    toString() {
        return "SHA3-" + this.digestBits;
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
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    function sleep() {
        return new Promise(resolve => setTimeout(resolve, 1));
    }
    const algorithms = [
        new SHA3(224),
        new SHA3(256),
        new SHA3(384),
        new SHA3(512)
    ];
    const fileQueue = [];
    /**
     * @param {File[]} files
     * @return {Promise}
     */
    async function openFiles(files, upper = false, debug = false) {
        const notEmpty = fileQueue.length != 0;
        for (const file of files) {
            file.upper = upper;
            file.debug = debug;
            fileQueue.push(file);
        }
        if (notEmpty) {
            return;
        }
        const tableBody = document.getElementById("tableBody");
        while (true) {
            const file = fileQueue.shift();
            if (file == null) {
                break;
            }
            let tr = document.createElement("tr");
            {
                const nameCell = document.createElement("td");
                nameCell.setAttribute("rowspan", algorithms.length);
                nameCell.className = "name";
                nameCell.textContent = file.name;
                tr.append(nameCell);
            }
            {
                const sizeCell = document.createElement("td");
                sizeCell.setAttribute("rowspan", algorithms.length);
                sizeCell.className = "size";
                sizeCell.textContent = file.size;
                tr.append(sizeCell);
            }
            const resultCells = algorithms.map(algorithm => {
                {
                    const algorithmCell = document.createElement("td");
                    algorithmCell.className = "algorithm";
                    algorithmCell.textContent = algorithm.toString();
                    tr.append(algorithmCell);
                }
                const resultCell = document.createElement("td");
                resultCell.className = "result";
                tr.append(resultCell);
                tableBody.append(tr);
                tr = document.createElement("tr");
                return resultCell;
            });
            try {
                algorithms.forEach(algorithm => algorithm.start());
                for await (const chunk of file.stream()) {
                    for (const algorithm of algorithms) {
                        algorithm.update(chunk, 0, file.debug);
                        await sleep();
                    }
                }
                algorithms.forEach((algorithm, index) => {
                    let hexDigest = algorithm.finish(file.debug);
                    if (file.upper) {
                        hexDigest = hexDigest.toUpperCase();
                    }
                    resultCells[index].textContent = hexDigest;
                });
            } catch (cause) {
                console.error(cause);
            }
        }
    }
    window.apps = algorithms.slice(); // for debug
    window.addEventListener("keydown", event => {
        if (event.ctrlKey) {
            let blob = null;
            if (event.key == "F1") {
                blob = new Blob([]);
                blob.name = "TestMessage0";
            }
            if (event.key == "F2") {
                const buffer = new ArrayBuffer(200);
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < 200; i++) {
                    bytes[i] = 0xa3;
                }
                blob = new Blob([buffer]);
                blob.name = "TestMessage1600";
            }
            if (blob != null) {
                openFiles([blob], event.shiftKey, true);
            }
        }
    });
    window.addEventListener("drop", event => {
        event.preventDefault();
        openFiles(event.dataTransfer.files, event.shiftKey, event.ctrlKey);
    });
    document.getElementById("fileInput").addEventListener("change", event => {
        openFiles(event.target.files);
    });
});