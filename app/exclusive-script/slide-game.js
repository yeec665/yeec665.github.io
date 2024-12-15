class SlideGame {
    static checkSize(size) {
        if (!(3 <= size && size <= 16)) {
            throw new RangeError(size);
        }
    }
    constructor(width, height) {
        SlideGame.checkSize(width);
        SlideGame.checkSize(height);
        this.width = width;
        this.height = height;
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        window.app = new SlideGame(4, 4);
    }
});