document.addEventListener("readystatechange", () => {
    if (document.readyState != "interactive") {
        return;
    }
    document.querySelectorAll(".tag").forEach(node => {
        const name = node.textContent.trim();
        const anchor = document.createElement("a");
        anchor.setAttribute("href", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/" + name);
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noreferrer");
        anchor.setAttribute("referrerpolicy", "no-referrer");
        anchor.textContent = name;
        node.innerHTML = "";
        node.append(anchor);
    });
});
