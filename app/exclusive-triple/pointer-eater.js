class PointEater {
    static A = 200;
    static R = 90;
    static DARK = "#251a02";
    static MOUTH = "#730700";
    constructor() {
        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("2d");
        this.gradient = this.context.createRadialGradient(
            PointEater.A,
            PointEater.A - 0.3 * PointEater.R,
            0.3 * PointEater.R,
            PointEater.A,
            PointEater.A,
            1.5 * PointEater.R
        );
        this.context.lineCap = "round";
        this.context.lineJoin = "round";
        this.gradient.addColorStop(0, "#fff087");
        this.gradient.addColorStop(1 / 3, "#ffd843");
        this.gradient.addColorStop(2 / 3, "#ffcc2c");
        this.gradient.addColorStop(1, "#ffaa0c");
        this.locked = false;
        this.lookX = PointEater.A;
        this.lookY = 2 * PointEater.A;
        this.moveX = 0;
        this.moveY = 0;
        this.direction = 0;
        this.intensity = 0;
        document.addEventListener("pointerlockchange", this.pointerlockchange.bind(this));
        this.canvas.addEventListener("click", this.click.bind(this));
        document.body.addEventListener("mousemove", this.mousemove.bind(this));
        window.setInterval(this.tick.bind(this), 30);
    }
    pointerlockchange() {
        this.locked = document.pointerLockElement != null;
    }
    /**
     * @param {MouseEvent} event
     */
    click() {
        if (document.pointerLockElement != null) {
            document.exitPointerLock();
        } else {
            this.canvas.requestPointerLock();
        }
    }
    /**
     * @param {MouseEvent} event
     */
    mousemove(event) {
        if (this.locked) {
            this.moveX += event.movementX;
            this.moveY += event.movementY;
        } else {
            this.lookX = event.pageX - this.canvas.offsetLeft;
            this.lookY = event.pageY - this.canvas.offsetTop;
        }
    }
    tick() {
        if (this.locked) {
            const intensity = Math.hypot(this.moveX, this.moveY) / 500;
            if (intensity > 0.02) {
                this.direction = Math.atan2(this.moveY, this.moveX);
                this.intensity = Math.min(intensity, 1.0);
            } else {
                this.intensity = 0;
            }
            this.moveX *= 0.92;
            this.moveY *= 0.92;
            this.paintInside();
        } else {
            this.paintOutside();
        }
    }
    paintInside() {
        const alpha = (0.3 - 0.18 * this.intensity) * Math.PI;
        const r = PointEater.R * (1 + this.intensity);
        const cv = (4.0 / 3.0) * Math.sin(0.5 * alpha) / (1.0 + Math.cos(0.5 * alpha));
        this.context.fillStyle = this.gradient;
        this.context.strokeStyle = PointEater.DARK;
        this.context.lineWidth = 4;
        this.context.clearRect(0, 0, 2 * PointEater.A, 2 * PointEater.A);
        this.context.beginPath();
        this.context.moveTo(
            PointEater.A + PointEater.R * Math.cos(this.direction - alpha),
            PointEater.A + PointEater.R * Math.sin(this.direction - alpha)
        );
        this.context.bezierCurveTo(
            PointEater.A + PointEater.R * Math.cos(this.direction - alpha) - cv * PointEater.R * Math.sin(this.direction - alpha),
            PointEater.A + PointEater.R * Math.sin(this.direction - alpha) + cv * PointEater.R * Math.cos(this.direction - alpha),
            PointEater.A + r * Math.cos(this.direction) + cv * r * Math.sin(this.direction),
            PointEater.A + r * Math.sin(this.direction) - cv * r * Math.cos(this.direction),
            PointEater.A + r * Math.cos(this.direction),
            PointEater.A + r * Math.sin(this.direction)
        );
        this.context.bezierCurveTo(
            PointEater.A + r * Math.cos(this.direction) - cv * r * Math.sin(this.direction),
            PointEater.A + r * Math.sin(this.direction) + cv * r * Math.cos(this.direction),
            PointEater.A + PointEater.R * Math.cos(this.direction + alpha) + cv * PointEater.R * Math.sin(this.direction + alpha),
            PointEater.A + PointEater.R * Math.sin(this.direction + alpha) - cv * PointEater.R * Math.cos(this.direction + alpha),
            PointEater.A + PointEater.R * Math.cos(this.direction + alpha),
            PointEater.A + PointEater.R * Math.sin(this.direction + alpha)
        );
        this.context.arc(PointEater.A, PointEater.A, PointEater.R, this.direction + alpha, this.direction - alpha, false);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        for (const rx of [-0.36, 0.36]) {
            const x = PointEater.A + rx * PointEater.R;
            const y = PointEater.A - 0.3 * PointEater.R;
            this.context.fillStyle = "white";
            this.context.beginPath();
            this.context.arc(x, y, 0.18 * PointEater.R, 0, 2 * Math.PI);
            this.context.fill();
            this.context.fillStyle = PointEater.DARK;
            this.context.beginPath();
            this.context.arc(x, y, 0.12 * PointEater.R, 0, 2 * Math.PI);
            this.context.fill();
        }
        let dx = 0;
        let dy = 0;
        if (0.25 * Math.PI < this.direction && this.direction < 0.75 * Math.PI) {
            dx = 0.5 * this.intensity * Math.cos(this.direction);
            dy = 0.5 * this.intensity * Math.sin(this.direction);
        }
        this.context.fillStyle = PointEater.MOUTH;
        this.context.beginPath();
        this.context.moveTo(
            PointEater.A - 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.bezierCurveTo(
            PointEater.A - 0.2 * PointEater.R,
            PointEater.A + 0.35 * PointEater.R,
            PointEater.A + 0.2 * PointEater.R,
            PointEater.A + 0.35 * PointEater.R,
            PointEater.A + 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.bezierCurveTo(
            PointEater.A + (0.4 + dx) * PointEater.R,
            PointEater.A + (0.8 + dy) * PointEater.R,
            PointEater.A + (-0.4 + dx) * PointEater.R,
            PointEater.A + (0.8 + dy) * PointEater.R,
            PointEater.A - 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.fill();
        this.context.stroke();
    }
    paintOutside() {
        this.context.fillStyle = this.gradient;
        this.context.strokeStyle = PointEater.DARK;
        this.context.lineWidth = 4;
        this.context.clearRect(0, 0, 2 * PointEater.A, 2 * PointEater.A);
        this.context.beginPath();
        this.context.arc(PointEater.A, PointEater.A, PointEater.R, 0, 2 * Math.PI);
        this.context.fill();
        this.context.stroke();
        for (const rx of [-0.36, 0.36]) {
            const x = PointEater.A + rx * PointEater.R;
            const y = PointEater.A - 0.3 * PointEater.R;
            const a = Math.atan2(this.lookY - y, this.lookX - x) || 0;
            this.context.fillStyle = "white";
            this.context.beginPath();
            this.context.arc(x, y, 0.18 * PointEater.R, 0, 2 * Math.PI);
            this.context.fill();
            this.context.fillStyle = PointEater.DARK;
            this.context.beginPath();
            this.context.arc(x + 0.06 * PointEater.R * Math.cos(a), y + 0.06 * PointEater.R * Math.sin(a), 0.12 * PointEater.R, 0, 2 * Math.PI);
            this.context.fill();
        }
        this.context.fillStyle = PointEater.MOUTH;
        this.context.beginPath();
        this.context.moveTo(
            PointEater.A - 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.bezierCurveTo(
            PointEater.A - 0.2 * PointEater.R,
            PointEater.A + 0.35 * PointEater.R,
            PointEater.A + 0.2 * PointEater.R,
            PointEater.A + 0.35 * PointEater.R,
            PointEater.A + 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.bezierCurveTo(
            PointEater.A + 0.4 * PointEater.R,
            PointEater.A + 0.8 * PointEater.R,
            PointEater.A - 0.4 * PointEater.R,
            PointEater.A + 0.8 * PointEater.R,
            PointEater.A - 0.55 * PointEater.R,
            PointEater.A + 0.3 * PointEater.R
        );
        this.context.fill();
        this.context.stroke();
    }
}
document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") {
        window.app = new PointEater();
    }
});