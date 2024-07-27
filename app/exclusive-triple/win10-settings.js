document.addEventListener("readystatechange", () => {
    if (document.readyState !== "interactive") {
        return;
    }
    const main = document.querySelector("main");
    main.addEventListener("mousemove", event => {
        main.style.backgroundImage = `radial-gradient(circle at ${event.layerX}px ${event.layerY}px, #7f7f7f 0%, #cacaca 10%, #ffffff 25%)`;
    });
    main.addEventListener("mouseleave", () => {
        main.style.backgroundImage = "none";
    });
    main.addEventListener("mousedown", event => {
        if (event?.target?.classList?.contains("cell")) {
            event.target.classList.add("active");
        }
    });
    main.addEventListener("mouseup", event => {
        if (event?.target?.classList?.contains("cell")) {
            event.target.classList.remove("active");
        }
    });
    main.addEventListener("mouseout", () => {
        const active = document.querySelector(".cell.active");
        if (active != null) {
            active.classList.remove("active");
        }
    });
});