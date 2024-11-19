class SlideGame {
    constructor() {}
}
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        window.app = new SlideGame();
    }
});