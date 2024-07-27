document.addEventListener("readystatechange", () => {
    if (document.readyState != "interactive") {
        return;
    }
    const shadowScope = document.getElementById("shadowScope");
    function mousemove(event) {
        shadowScope.style.left = (event.clientX - 150) + "px";
        shadowScope.style.top = (event.clientY - 150) + "px";
    }
    document.getElementById("shadowToggle").addEventListener("click", event => {
        if (shadowScope.classList.toggle("active")) {
            document.addEventListener("mousemove", mousemove);
            mousemove(event);
        } else {
            document.removeEventListener("mousemove", mousemove);
        }
    });
});
document.addEventListener("readystatechange", () => {
    if (document.readyState != "interactive") {
        return;
    }
    if (location.protocol === "file:" || location.hostname === "localhost") {
        document.querySelectorAll("section.hidden").forEach(section => {
            section.classList.remove("hidden");
        });
    }
});