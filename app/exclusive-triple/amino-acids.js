class AminoAcids {
    static urlPrefix = "https://upload.wikimedia.ahmu.cf/wikipedia/commons/";
    static atomSigns = ["C", "H", "N", "O", "S"];
    static atomMass = [12, 1, 14, 16, 32];
    static colorMapStorageKey = "amino-acids-color";
    /**
     * @param {Document} doc
     * @param {string[]} list
     * @param {function} update
     */
    static bindSelect(doc, list, update) {
        list = list.map(id => doc.getElementById(id));
        for (const node0 of list) {
            node0.addEventListener("click", () => {
                for (const node1 of list) {
                    node1.classList.toggle("selected", node0 == node1);
                }
                update.call(this, node0.id);
            });
        }
    }
    constructor() {
        this.loadColorMap();
        const doc = document;
        this.left = doc.getElementById("left");
        this.right = doc.getElementById("right");
        this.matrix = doc.getElementById("matrix");
        this.settings = doc.getElementById("settings");
        this.info = doc.getElementById("info");
        this.order = null;
        this.display = "selectDisplayAbbr3Mr";
        this.filter = null;
        doc.body.addEventListener("contextmenu", event => {
            event.preventDefault();
            this.deselectLeft();
            this.toggleSettings();
        });
        const loadingIcon = doc.getElementById("loadingIcon");
        const imageContent = doc.getElementById("imageContent");
        imageContent.addEventListener("load", () => {
            loadingIcon.classList.add("hidden");
            imageContent.classList.remove("hidden");
        });
        this.updateMatrix();
        this.initSettingsOrder(doc);
        this.initSettingsDisplay(doc);
        this.initSettingsFilter(doc);
        this.initSettingsTheme(doc);
    }
    loadColorMap() {
        let colorMap = localStorage.getItem(AminoAcids.colorMapStorageKey);
        if (colorMap != null) {
            try {
                this.colorMap = JSON.parse(colorMap);
                return;
            } catch (e) {
                console.error(e);
            }
        }
        const colorList = [
            "#88734f", "#e55039", "#1e3799", "#2b5b7e", "#079992",
            "#7c3961", "#b33771", "#ca431a", "#e17055", "#00b894",
            "#ff7675", "#ffa502", "#a3192c", "#287a48", "#c44569",
            "#b6a64f", "#2382db", "#338199", "#796a81", "#2e6b5c"
        ];
        const len = colorList.length;
        let i, j, c;
        for (i = 1; i < len; i++) {
            j = Math.floor(Math.random() * (i + 1));
            if (j < i) {
                c = colorList[i];
                colorList[i] = colorList[j];
                colorList[j] = c;
            }
        }
        colorMap = {};
        i = 0;
        for (const item of AminoAcids.data) {
            colorMap[item.abbr3] = colorList[i++ % len];
        }
        this.colorMap = colorMap;
        localStorage.setItem(AminoAcids.colorMapStorageKey, JSON.stringify(colorMap));
    }
    reloadLeft() {
        window.setTimeout(this.updateMatrix.bind(this), 800);
        this.left.classList.remove("show");
    }
    updateMatrix() {
        const doc = document;
        this.list = AminoAcids.data.slice();
        if (this.order != null) {
            this.list.sort(this.order);
        }
        let itemB, itemC;
        this.matrix.innerHTML = "";
        for (const item of this.list) {
            const itemA = doc.createElement("div");
            itemA.id = "amino" + item.abbr3;
            if (this.filter != null && (item.tags == null || !item.tags.includes(this.filter))) {
                itemA.className = "item-a filtered";
            } else {
                itemA.className = "item-a";
            }
            itemA.style.color = this.colorMap[item.abbr3];
            itemA.style.backgroundColor = itemA.style.color;
            itemB = doc.createElement("div");
            itemC = doc.createElement("div");
            itemB.className = "item-b";
            itemC.className = "item-c";
            switch (this.display) {
                case "selectDisplayAbbr1":
                    itemB.textContent = item.abbr1;
                    itemC = null;
                    break;
                case "selectDisplayAbbr3":
                    itemB.textContent = item.abbr3;
                    itemC = null;
                    break;
                case "selectDisplayEn":
                    itemB.textContent = item.en;
                    itemC = null;
                    break;
                case "selectDisplayZh":
                    itemB.textContent = item.zh;
                    itemC = null;
                    break;
                case "selectDisplayAbbr3Formula":
                    itemB.textContent = item.abbr3;
                    this.buildFormula(doc, item.atoms, itemC);
                    break;
                default:
                case "selectDisplayAbbr3Mr":
                    itemB.textContent = item.abbr3;
                    itemC.textContent = item.mr;
                    break;
                case "selectDisplayEnMr":
                    itemB.textContent = item.en;
                    itemC.textContent = item.mr;
                    break;
                case "selectDisplayEnZh":
                    itemB.textContent = item.en;
                    itemC.textContent = item.zh;
                    break;
            }
            itemA.append(itemB);
            if (itemC != null) {
                itemA.append(itemC);
            }
            itemA.addEventListener("click", () => {
                this.deselectLeft();
                itemA.style.color = "#ffffff";
                itemA.style.backgroundImage = "none";
                itemA.classList.add("selected");
                this.loadInfo(item);
            });
            this.matrix.append(itemA);
        }
        this.left.classList.add("show");
    }
    updateFilter() {
        const doc = document;
        for (const item of this.list) {
            const node = doc.getElementById("amino" + item.abbr3);
            if (node == null) {
                continue;
            }
            if (this.filter != null && (item.tags == null || !item.tags.includes(this.filter))) {
                node.className = "item-a filtered";
            } else {
                node.className = "item-a";
            }
        }
    }
    /**
     * @param {Document} doc
     */
    initSettingsOrder(doc) {
        function countAtom(atoms) {
            let sum = 0;
            for (let index = 0; index < 5; index++) {
                sum *= 100;
                if (atoms[index] != null) {
                    sum += atoms[index];
                }
            }
            return sum;
        }
        const orderMap = {
            "selectOrderDefault": null,
            "selectOrderAbbr1": (a, b) => a.abbr1.localeCompare(b.abbr1),
            "selectOrderAbbr3": (a, b) => a.abbr3.localeCompare(b.abbr3),
            "selectOrderEn": (a, b) => a.en.localeCompare(b.en),
            "selectOrderZh": (a, b) => a.zh.localeCompare(b.zh),
            "selectOrderCarbon": (a, b) => countAtom(a.atoms) - countAtom(b.atoms),
            "selectOrderMr": (a, b) => a.mr - b.mr
        };
        AminoAcids.bindSelect(doc, Object.keys(orderMap), id => {
            this.order = orderMap[id];
            this.updateMatrix();
        });
    }
    /**
     * @param {Document} doc
     */
    initSettingsDisplay(doc) {
        const classMap = {
            "selectDisplayAbbr1": "db-xxl",
            "selectDisplayAbbr3": "db-xl",
            "selectDisplayEn": "",
            "selectDisplayZh": "db-l",
            "selectDisplayAbbr3Formula": "db-xl",
            "selectDisplayAbbr3Mr": "db-xl",
            "selectDisplayEnMr": "",
            "selectDisplayEnZh": "dc-l",
        };
        AminoAcids.bindSelect(doc, Object.keys(classMap), id => {
            this.display = id;
            this.matrix.className = classMap[id];
            this.updateMatrix();
        });
    }
    /**
     * @param {Document} doc
     */
    initSettingsFilter(doc) {
        const tagSet = new Set();
        tagSet.add(null);
        for (const item of AminoAcids.data) {
            if (item.tags == null) {
                continue;
            }
            for (const tag of item.tags) {
                tagSet.add(tag);
            }
        }
        const selectFilter = doc.getElementById("selectFilter");
        const buttons = [];
        let buttonBC;
        for (const tag of tagSet) {
            const buttonA = doc.createElement("div");
            if (tag != null) {
                buttonA.className = "button-a";
            } else {
                buttonA.className = "button-a selected";
            }
            buttonBC = doc.createElement("div");
            buttonBC.className = "button-b";
            if (tag != null) {
                buttonBC.textContent = tag;
            } else {
                buttonBC.textContent = "无过滤器";
            }
            buttonA.append(buttonBC);
            buttonBC = doc.createElement("div");
            buttonBC.className = "button-c";
            buttonA.append(buttonBC);
            buttonA.addEventListener("click", () => {
                for (const button of buttons) {
                    button.classList.toggle("selected", button == buttonA);
                }
                this.filter = tag;
                this.updateFilter();
            });
            selectFilter.append(buttonA);
            buttons.push(buttonA);
        }
    }
    /**
     * @param {Document} doc
     */
    initSettingsTheme(doc) {
        AminoAcids.bindSelect(doc, ["selectThemeLight", "selectThemeDark"], id => {
            if (id == "selectThemeDark") {
                doc.body.className = "dark";
            } else {
                doc.body.className = "light";
            }
        });
    }
    deselectLeft() {
        let node = document.querySelector(".item-a.selected");
        if (node != null) {
            node.classList.remove("selected");
            node.style.color = node.style.backgroundColor;
            node.style.backgroundImage = null;
        }
    }
    toggleSettings() {
        if (this.right.classList.contains("show")) {
            if (this.settings.classList.contains("selected")) {
                window.setTimeout(() => {
                    this.settings.classList.remove("selected");
                }, 800);
            } else {
                window.setTimeout(this.showSettings.bind(this), 500);
            }
            this.right.classList.remove("show");
        } else {
            this.showSettings();
        }
    }
    showSettings() {
        this.right.style.borderColor = null;
        this.settings.classList.add("selected");
        this.info.classList.remove("selected");
        this.right.classList.add("show");
    }
    /**
     * @param {object} item
     */
    loadInfo(item) {
        if (this.right.classList.contains("show")) {
            if (!(this.info.classList.contains("selected") && this.opened == item)) {
                window.setTimeout(this.showInfo.bind(this, item), 500);
            }
            this.right.classList.remove("show");
        } else {
            this.showInfo(item);
        }
    }
    /**
     * @param {object} item
     */
    showInfo(item) {
        const doc = document;
        this.right.style.borderColor = this.colorMap[item.abbr3];
        const loadingIcon = doc.getElementById("loadingIcon");
        const imageContent = doc.getElementById("imageContent");
        loadingIcon.classList.remove("hidden");
        imageContent.classList.add("hidden");
        imageContent.src = AminoAcids.urlPrefix + item.img;
        doc.getElementById("valAbbr1").textContent = item.abbr1;
        doc.getElementById("valAbbr3").textContent = item.abbr3;
        doc.getElementById("valEn").textContent = item.en;
        doc.getElementById("valZh").textContent = item.zh;
        this.buildFormula(doc, item.atoms, doc.getElementById("valFormula"));
        const valMR = doc.getElementById("valMR");
        valMR.textContent = item.mr.toFixed(3);
        valMR.title = this.buildMrExpression(item.atoms);
        doc.getElementById("valPI").textContent = item.pi.toFixed(2);
        doc.getElementById("valPK1").textContent = item.pk1.toFixed(2);
        doc.getElementById("valPK2").textContent = item.pk2.toFixed(2);
        doc.getElementById("valCodon").textContent = item.codon.join(", ");
        this.settings.classList.remove("selected");
        this.info.classList.add("selected");
        this.right.classList.add("show");
    }
    /**
     * @param {object} item
     * @param {number[]} atoms
     * @param {HTMLElement} node
     */
    buildFormula(doc, atoms, node) {
        node.textContent = "";
        atoms.forEach((value, index) => {
            if (value > 0) {
                node.append(doc.createTextNode(AminoAcids.atomSigns[index]));
                if (value > 1) {
                    const sub = doc.createElement("sub");
                    sub.textContent = value;
                    node.append(sub);
                }
            }
        });
    }
    /**
     * @param {number[]} atoms
     * @return {string}
     */
    buildMrExpression(atoms) {
        let mrHint = "";
        let mrSum = 0;
        atoms.forEach((value, index) => {
            if (value > 0) {
                if (mrSum > 0) {
                    mrHint += " + ";
                }
                mrSum += AminoAcids.atomMass[index] * value
                mrHint += AminoAcids.atomMass[index] + " * " + value;
            }
        });
        return mrHint + " = " + mrSum;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState == "interactive") {
        window.app = new AminoAcids();
    }
});
AminoAcids.data = [
    {
        abbr1: "R",
        abbr3: "Arg",
        en: "Arginine",
        zh: "精氨酸",
        img: "thumb/c/c6/L-arginine-skeletal-%28tall%29.png/285px-L-arginine-skeletal-%28tall%29.png",
        atoms: [6, 14, 4, 2],
        mr: 174.204,
        tags: ["带正电"],
        pi: 10.76,
        pk1: 1.82,
        pk2: 9.87,
        pka: 12.1,
        codon: ["CGU", "CGC", "CGG", "CGA", "AGA", "AGG"]
    },
    {
        abbr1: "H",
        abbr3: "His",
        en: "Histidine",
        zh: "组氨酸",
        img: "thumb/6/64/L-histidine-skeletal.png/203px-L-histidine-skeletal.png",
        atoms: [6, 9, 3, 2],
        mr: 155.157,
        tags: ["极性", "疏水", "带正电", "芳香", "必需氨基酸"],
        pi: 7.60,
        pk1: 1.80,
        pk2: 9.33,
        pka: 6.0,
        codon: ["CAU", "CAC"]
    },
    {
        abbr1: "K",
        abbr3: "Lys",
        en: "Lysine",
        zh: "赖氨酸",
        img: "thumb/0/04/L-lysine-skeletal.png/320px-L-lysine-skeletal.png",
        atoms: [6, 14, 2, 2],
        mr: 146.190,
        tags: ["极性", "带正电", "必需氨基酸"],
        pi: 9.60,
        pk1: 2.16,
        pk2: 9.06,
        pka: 10.7,
        codon: ["AAA", "AAG"]
    },
    {
        abbr1: "D",
        abbr3: "Asp",
        en: "Aspatic Acid",
        zh: "天冬氨酸",
        img: "thumb/6/6e/L-aspartic-acid-skeletal.png/204px-L-aspartic-acid-skeletal.png",
        atoms: [4, 7, 1, 4],
        mr: 133.103,
        tags: ["极性", "带负电", "非必需氨基酸"],
        pi: 2.85,
        pk1: 1.99,
        pk2: 9.90,
        pka: 3.7,
        codon: ["GAU", "GAC"]
    },
    {
        abbr1: "E",
        abbr3: "Glu",
        en: "Glutamic Acid",
        zh: "谷氨酸",
        img: "thumb/a/a8/L-glutamic-acid-skeletal.png/273px-L-glutamic-acid-skeletal.png",
        tags: ["极性", "带负电", "非必需氨基酸"],
        atoms: [5, 9, 1, 4],
        mr: 147.130,
        pi: 3.15,
        pk1: 2.10,
        pk2: 9.47,
        pka: 4.2,
        codon: ["GAA", "GAG"]
    },
    {
        abbr1: "S",
        abbr3: "Ser",
        en: "Serine",
        zh: "丝氨酸",
        img: "thumb/e/e2/L-serine-skeletal.png/273px-L-serine-skeletal.png",
        tags: ["极性", "带负电", "带羟基", "非必需氨基酸"],
        atoms: [3, 7, 1, 3],
        mr: 105.093,
        pi: 5.68,
        pk1: 2.19,
        pk2: 9.21,
        codon: ["UCU", "UCA", "UCC", "UCG", "AGU", "AGC"]
    },
    {
        abbr1: "T",
        abbr3: "Thr",
        en: "Threoine",
        zh: "苏氨酸",
        img: "thumb/3/3e/L-threonine-skeletal.png/264px-L-threonine-skeletal.png",
        tags: ["极性", "疏水", "带羟基", "必需氨基酸"],
        atoms: [4, 9, 1, 3],
        mr: 119.120,
        pi: 5.60,
        pk1: 2.09,
        pk2: 9.10,
        codon: ["ACU", "ACC", "ACG", "ACA"]
    },
    {
        abbr1: "N",
        abbr3: "Asn",
        en: "Asparagine",
        zh: "天冬酰胺",
        img: "thumb/c/c9/L-asparagine-skeletal.png/203px-L-asparagine-skeletal.png",
        tags: ["极性", "非必需氨基酸"],
        atoms: [4, 8, 2, 3],
        mr: 132.119,
        pi: 5.41,
        pk1: 2.14,
        pk2: 8.72,
        codon: ["AAU", "AAC"]
    },
    {
        abbr1: "Q",
        abbr3: "Gln",
        en: "Glutamine",
        zh: "谷氨酰胺",
        img: "thumb/9/91/L-glutamine-skeletal.png/295px-L-glutamine-skeletal.png",
        tags: ["极性", "非必需氨基酸"],
        atoms: [5, 10, 2, 3],
        mr: 146.146,
        pi: 5.65,
        pk1: 2.17,
        pk2: 9.13,
        codon: ["CAA", "CAG"]
    },
    {
        abbr1: "G",
        abbr3: "Gly",
        en: "Glycine",
        zh: "甘氨酸",
        img: "thumb/f/f1/Glycine-skeletal.png/320px-Glycine-skeletal.png",
        tags: ["非必需氨基酸"],
        atoms: [2, 5, 1, 2],
        mr: 75.067,
        pi: 6.06,
        pk1: 2.35,
        pk2: 9.78,
        codon: ["GGU", "GGC", "GGA", "GGG"]
    },
    {
        abbr1: "P",
        abbr3: "Pro",
        en: "Proline",
        zh: "脯氨酸",
        img: "thumb/d/d7/L-proline-skeletal.png/311px-L-proline-skeletal.png",
        tags: ["非必需氨基酸"],
        atoms: [5, 9, 1, 2],
        mr: 115.132,
        pi: 6.30,
        pk1: 1.95,
        pk2: 10.64,
        codon: ["CCU", "CCA", "CCG", "CCC"]
    },
    {
        abbr1: "C",
        abbr3: "Cys",
        en: "Cysteine",
        zh: "半胱氨酸",
        img: "thumb/a/a5/L-cysteine-skeletal.png/236px-L-cysteine-skeletal.png",
        tags: ["极性", "含硫", "非必需氨基酸"],
        atoms: [3, 7, 1, 2, 1],
        mr: 121.15,
        pi: 5.05,
        pk1: 1.92,
        pk2: 10.70,
        pka: 8.3,
        codon: ["UGU", "UGC"]
    },
    {
        abbr1: "A",
        abbr3: "Ala",
        en: "Alanine",
        zh: "丙氨酸",
        img: "thumb/0/05/L-alanine-skeletal.png/320px-L-alanine-skeletal.png",
        tags: ["疏水", "非必需氨基酸"],
        atoms: [3, 7, 1, 2],
        mr: 89.094,
        pi: 6.01,
        pk1: 2.35,
        pk2: 9.87,
        codon: ["GCU", "GCC", "GCA", "GCG"]
    },
    {
        abbr1: "V",
        abbr3: "Val",
        en: "Valine",
        zh: "缬氨酸",
        img: "thumb/5/52/L-valine-skeletal.png/283px-L-valine-skeletal.png",
        tags: ["疏水", "脂肪基团", "必需氨基酸"],
        atoms: [5, 11, 1, 2],
        mr: 117.148,
        pi: 6.00,
        pk1: 2.39,
        pk2: 9.74,
        codon: ["GUU", "GUC", "GUA", "GUG"]
    },
    {
        abbr1: "I",
        abbr3: "Ile",
        en: "Isoleucine",
        zh: "异亮氨酸",
        img: "thumb/e/e8/L-isoleucine-skeletal.svg/248px-L-isoleucine-skeletal.svg.png",
        tags: ["疏水", "脂肪基团", "必需氨基酸"],
        atoms: [6, 13, 1, 2],
        mr: 131.175,
        pi: 6.05,
        pk1: 2.32,
        pk2: 9.76,
        codon: ["AUU", "AUC", "AUA"]
    },
    {
        abbr1: "L",
        abbr3: "Leu",
        en: "Leucine",
        zh: "亮氨酸",
        img: "thumb/2/29/L-leucine-skeletal.png/227px-L-leucine-skeletal.png",
        tags: ["疏水", "脂肪基团", "必需氨基酸"],
        atoms: [6, 13, 1, 2],
        mr: 131.175,
        pi: 6.01,
        pk1: 2.33,
        pk2: 9.74,
        codon: ["CUU", "CUC", "CUA", "CUG", "UUA", "UUG"]
    },
    {
        abbr1: "M",
        abbr3: "Met",
        en: "Methionine",
        zh: "甲硫氨酸",
        img: "thumb/d/db/L-methionine-skeletal.png/285px-L-methionine-skeletal.png",
        tags: ["疏水", "含硫", "必需氨基酸"],
        atoms: [5, 11, 1, 2, 1],
        mr: 149.21,
        pi: 5.74,
        pk1: 2.13,
        pk2: 9.28,
        codon: ["AUG"]
    },
    {
        abbr1: "F",
        abbr3: "Phe",
        en: "Phenylalanine",
        zh: "苯丙氨酸",
        img: "thumb/4/42/L-phenylalanine-skeletal.png/235px-L-phenylalanine-skeletal.png",
        tags: ["疏水", "芳香", "必需氨基酸"],
        atoms: [9, 11, 1, 2],
        mr: 165.192,
        pi: 5.49,
        pk1: 2.20,
        pk2: 9.31,
        codon: ["UUU", "UUC"]
    },
    {
        abbr1: "Y",
        abbr3: "Tyr",
        en: "Tyrosine",
        zh: "酪氨酸",
        img: "thumb/5/5c/L-tyrosine-skeletal.png/292px-L-tyrosine-skeletal.png",
        tags: ["极性", "疏水", "芳香", "非必需氨基酸"],
        atoms: [9, 11, 1, 3],
        mr: 181.191,
        pi: 5.64,
        pk1: 2.20,
        pk2: 9.21,
        codon: ["UAU", "UAC"]
    },
    {
        abbr1: "W",
        abbr3: "Trp",
        en: "Tryptophan",
        zh: "色氨酸",
        img: "thumb/b/b8/L-tryptophan-skeletal.png/223px-L-tryptophan-skeletal.png",
        tags: ["极性", "疏水", "芳香", "必需氨基酸"],
        atoms: [11, 12, 2, 2],
        mr: 204.229,
        pi: 5.89,
        pk1: 2.46,
        pk2: 9.74,
        codon: ["UGG"]
    }
];