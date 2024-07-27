document.addEventListener("readystatechange", () => {
    if (document.readyState != "interactive") {
        return;
    }
    const params = new URLSearchParams(location.search);
    function getInt(name, min, max, fallback) {
        const value = parseInt(params.get(name));
        if (Number.isNaN(value)) {
            return fallback;
        } else {
            return Math.max(min, Math.min(value, max));
        }
    }
    const iw = getInt("w", 3, 64, 31);
    const ih = getInt("h", 3, 64, 17);
    const doc = document;
    const tbody = doc.getElementById("tbody");
    const mat = new Array(iw * ih);
    let ix, iy, ii, tr, td;
    for (iy = 0; iy < ih; iy++) {
        tr = doc.createElement("tr");
        for (ix = 0; ix < iw; ix++) {
            ii = iy * iw + ix;
            td = doc.createElement("td");
            td.setAttribute("ii", ii);
            mat[ii] = {
                value: +Infinity,
                ix: ix,
                iy: iy,
                node: td
            };
            tr.append(td);
        }
        tbody.append(tr);
    }
    const list = new Array();
    function wait(item) {
        item.node.textContent = "...";
        if (list.includes(item)) {
            return;
        }
        list.push(item);
    }
    tbody.addEventListener("click", e => {
        if (e.target == null) {
            return;
        }
        const ii = e.target.getAttribute("ii");
        if (ii == null) {
            return;
        }
        const item = mat[ii];
        if (e.shiftKey) {
            if (item.value != 0) {
                item.value = 0;
            } else {
                item.value = +Infinity;
            }
        } else {
            if (item.value != null) {
                item.value = null;
                item.node.className = "barrier";
            } else {
                item.value = +Infinity;
                item.node.className = "";
            }
            item.node.style = "";
            item.node.textContent = "";
        }
        wait(item);
    });
    const gradient = ['#e61c1c', '#e4231c', '#e12a1c', '#df311c', '#dc381d', '#da3f1d', '#d7471d', '#d54e1d', '#d2551d', '#d05c1d', '#ce631e', '#cb6a1e', '#c9711e', '#c6781e', '#c47f1e', '#c1861e', '#bf8d1e', '#bc951f', '#ba9c1f', '#b7a31f', '#b1a922', '#acab25', '#a7ac29', '#a2ae2c', '#9db02f', '#98b232', '#93b436', '#8eb539', '#89b73c', '#84b93f', '#7fbb42', '#7abc46', '#75be49', '#70c04c', '#6bc24f', '#66c452', '#61c556', '#5cc759', '#57c95c', '#52c665', '#51c36b', '#4fbf72', '#4ebc79', '#4cb87f', '#4bb586', '#49b18c', '#47ae93', '#46aa9a', '#44a7a0', '#43a3a7', '#41a0ae', '#3f9cb4', '#3e99bb', '#3c95c1', '#3b92c8', '#398ecf', '#388bd5', '#3687dc', '#3a87df', '#3e8ade', '#438cde', '#488edd', '#4c90dc', '#5193db', '#5695db', '#5a97da', '#5f9ad9', '#639cd8', '#689ed8', '#6da1d7', '#71a3d6', '#76a5d5', '#7ba7d5', '#7faad4', '#84acd3', '#89aed2', '#8db1d1'];
    function color(m) {
        return gradient[Math.min(m, gradient.length - 1)];
    }
    function update(item) {
        let each = function (side) {
            const ii = item.iy * iw + item.ix;
            if (item.ix > 0) {
                side(mat[ii - 1]);
            }
            if (item.iy > 0) {
                side(mat[ii - iw]);
            }
            if (item.ix + 1 < iw) {
                side(mat[ii + 1]);
            }
            if (item.iy + 1 < ih) {
                side(mat[ii + iw]);
            }
        }
        if (item.value != null) {
            let back = +Infinity;
            each(function(near) {
                if (near.value != null && near.value < back) {
                    back = near.value;
                }
            });
            if (item.value != 0) {
                if (item.value != back + 1) {
                    item.value = back + 1;
                } else {
                    each = null;
                }
            }
            if (isFinite(item.value)) {
                item.node.style.backgroundColor = color(item.value);
                item.node.textContent = item.value;
            } else {
                item.node.style = "";
                item.node.textContent = "";
            }
        } else {
            item.node.textContent = "";
        }
        if (each) {
            each(function(near) {
                if (near.value != null && near.value != 0) {
                    wait(near);
                }
            });
        }
    }
    (() => {
        function randomItem() {
            return mat[Math.floor(mat.length * Math.random())];
        }
        function randomWalk(item, index) {
            if (index == 0 && item.ix > 0) {
                return mat[item.iy * iw + (item.ix - 1)];
            }
            if (index == 1 && item.iy > 0) {
                return mat[(item.iy - 1) * iw + item.ix];
            }
            if (index == 2 && item.ix < iw) {
                return mat[item.iy * iw + (item.ix + 1)];
            }
            if (index == 3 && item.iy < ih) {
                return mat[(item.iy + 1) * iw + item.ix];
            }
            return null;
        }
        let i, j, item;
        for (i = 0; i < 5; i++) {
            item = randomItem();
            for (j = 0; j < 16; j++) {
                item = randomWalk(item, Math.floor(4 * Math.random()));
                if (item == null) {
                    break;
                }
                item.value = null;
                item.node.className = "barrier";
                wait(item);
            }
        }
        const source = randomItem();
        source.value = 0;
        wait(source);
    })();
    window.setInterval(() => {
        const item = list.shift();
        if (item != null) {
            update(item);
        }
    }, 25);
});