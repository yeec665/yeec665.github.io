function resize(width) {
    const powerGroupCount = Math.floor((width - 24) / 108);
    document.querySelectorAll(".power.holes").forEach(holes => {
        holes.innerHTML = "";
        for (let i = 0; i < powerGroupCount; i++) {
            const group = document.createElement("div");
            group.className = "power group";
            for (let j = 0; j < 10; j++) {
                const hole = document.createElement("div");
                hole.className = "hole";
                group.append(hole);
            }
            holes.append(group);
        }
    });
    const columnCount = powerGroupCount * 6 - 1;
    const totalCount = 5 * columnCount;
    document.querySelectorAll(".logic.holes").forEach(holes => {
        holes.innerHTML = "";
        holes.style = `grid-template-columns: repeat(${columnCount}, 18px);`;
        for (let i = 0; i < totalCount; i++) {
            const hole = document.createElement("div");
            hole.className = "hole";
            holes.append(hole);
        }
    });
}
document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    let width0 = document.body.clientWidth;
    window.addEventListener("resize", () => {
        const width1 = document.body.clientWidth;
        if (width0 != width1) {
            width0 = width1;
            resize(width0);
        }
    });
    resize(width0);
});