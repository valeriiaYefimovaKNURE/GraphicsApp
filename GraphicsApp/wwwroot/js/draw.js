const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0, lastY = 0;

let undoStack = [];
let redoStack = [];

let currentTool = "brush";
let currentBrush = "soft";

function selectBrush(type) {
    currentTool = "brush";   
    currentBrush = type;   
}

function selectTool(tool) {
    currentTool = tool;   
}

//EVENTS
canvas.onmousedown = (e) => {
    saveState();
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
};

canvas.onmouseup = () => drawing = false;
canvas.onmouseout = () => drawing = false;

canvas.onmousemove = async (e) => {
    if (!drawing || currentTool === "fill") return;

    const color = currentTool === "eraser"
        ? "#ffffff"
        : document.getElementById("colorPicker").value;

    const thickness = parseInt(document.getElementById("thicknessPicker").value);

    const response = await fetch('/Draw/DrawLine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            x0: lastX,
            y0: lastY,
            x1: e.offsetX,
            y1: e.offsetY,
            color: color,
            thickness: thickness
        })
    });

    const pixels = await response.json();

    drawPixels(pixels, currentBrush);

    lastX = e.offsetX;
    lastY = e.offsetY;
};
function getCanvasPixels() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const pixels = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        const color =
            (a << 24) |
            (r << 16) |
            (g << 8) |
            b;

        pixels.push(color);
    }

    return pixels;
}
function applyPixels(pixels, width, height) {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < pixels.length; i++) {
        const color = pixels[i];

        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        const a = (color >> 24) & 255;

        const idx = i * 4;

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
    }

    ctx.putImageData(imageData, 0, 0);
}
canvas.addEventListener("click", async (e) => {
    if (currentTool !== "fill") return;

    saveState();

    const x = e.offsetX;
    const y = e.offsetY;

    const color = document.getElementById("colorPicker").value;

    const pixels = getCanvasPixels();

    const response = await fetch('/Draw/FloodFill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            x: x,
            y: y,
            color: color,
            width: canvas.width,
            height: canvas.height,
            pixels: pixels
        })
    });

    const resultPixels = await response.json();

    applyPixels(resultPixels, canvas.width, canvas.height);
});
// DRAW FROM COM
function drawPixels(pixels, brushType) {
    pixels.forEach(p => {
        const r = (p.color >> 16) & 255;
        const g = (p.color >> 8) & 255;
        const b = p.color & 255;

        if (brushType === "soft") {
            ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (brushType === "medium") {
            ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else { // hard
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(p.x, p.y, 2, 2);
        }
    });
}

//UNDO / REDO
function saveState() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.push(imageData);
    redoStack = [];
}

function undo() {
    if (!undoStack.length) return;
    const imageData = undoStack.pop();
    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(imageData, 0, 0);
}

function redo() {
    if (!redoStack.length) return;
    const imageData = redoStack.pop();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(imageData, 0, 0);
}

async function saveImage() {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
        alert("Помилка створення зображення"); return;
    }
    const formData = new FormData();
    formData.append("image", blob, "drawing.png");
    formData.append("message", document.getElementById("msg").value);
    const response = await fetch("/Draw/PostImage", {
        method: "POST", body: formData
    });
    if (response.ok) {
        window.location.href = "/";
    }
    else {
        alert("Помилка завантаження");
    }
}