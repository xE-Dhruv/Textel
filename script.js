document.addEventListener('DOMContentLoaded', () => {

const uploadBtn = document.getElementById('uploadbtn');
const uploadArea = document.getElementById('uploadArea');
const converterContainer = document.getElementById('converterContainer');
const preview = document.getElementById('preview');
const asciiOutput = document.getElementById('asciiOutput');
const closeBtn = document.getElementById('closeBtn');
const resolutionSlider = document.getElementById('resolution');
const resolutionVal = document.getElementById('resolutionVal');
const detailSlider = document.getElementById('detail');
const detailVal = document.getElementById('detailVal');
const charSetSelect = document.getElementById('charSet');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

let currentImage = null;

// Show/hide panels

function showConverter() {
    uploadArea.style.display = 'none';
    converterContainer.style.display = 'flex';
}

function hideConverter() {
    uploadArea.style.display = 'block';
    converterContainer.style.display = 'none';
    currentImage = null;
    preview.src = '';
    asciiOutput.textContent = '';
}

converterContainer.style.display = 'none';

// Load image

function loadImage(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file (PNG, JPG, JPEG, WebP).');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            preview.src = e.target.result;
            showConverter();
            generateASCII();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ASCII generation

function generateASCII() {
    if (!currentImage) return;

    const chars = charSetSelect.value;
    const resolution = parseInt(resolutionSlider.value);
    const detail = parseInt(detailSlider.value) / 100;
    const cols = resolution;
    const aspectRatio = currentImage.height / currentImage.width;
    const rows = Math.floor(cols * aspectRatio * 0.5);

    canvas.width = cols;
    canvas.height = rows;
    ctx.drawImage(currentImage, 0, 0, cols, rows);

    const imageData = ctx.getImageData(0, 0, cols, rows);
    const pixels = imageData.data;

    let ascii = '';

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            const contrast = 0.5 + detail * 1.5;
            const adjusted = Math.min(255, Math.max(0, (brightness - 128) * contrast + 128));
            const cutoff = 255 - (detail * 80);

            if (adjusted > cutoff) {
                ascii += ' ';
            } else {
                const charIndex = Math.floor((adjusted / cutoff) * (chars.length - 1));
                ascii += chars[chars.length - 1 - charIndex];
            }
        }
        ascii += '\n';
    }

    asciiOutput.textContent = ascii;
}


// Download

function downloadAs(format) {
    if (format !== "png") return;

    const asciiOutput = document.getElementById("asciiOutput");

    if (!asciiOutput || !asciiOutput.textContent.trim()) {
        alert("No ASCII art to download.");
        return;
    }

    const text = asciiOutput.textContent;
    const lines = text.split("\n");

    const fontSize = 10;
    const lineHeight = 12;
    const charWidth = 6;

    const maxCols = Math.max(...lines.map(line => line.length));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = maxCols * charWidth + 20;
    canvas.height = lines.length * lineHeight + 20;

    ctx.fillStyle = "#0e0e14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = `${fontSize}px monospace`;

    lines.forEach((line, index) => {
        ctx.fillText(line, 10, (index + 1) * lineHeight);
    });

    const link = document.createElement("a");
    link.download = "ascii-art.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

document.getElementById('downloadBtn').addEventListener('click', () => {
    downloadAs('png');
});

// Copy

function copyASCII() {
    const text = asciiOutput.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        if (btn) {
            btn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied!';
            setTimeout(() => {
                btn.innerHTML = '<span class="material-symbols-outlined">content_copy</span> Copy';
            }, 2000);
        }
    });
}


// Upload button

uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, image/webp';
    input.onchange = (e) => loadImage(e.target.files[0]);
    input.click();
});

// Drag and drop

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.opacity = '0.7';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.opacity = '1';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    console.log('DROP DETECTED');
    uploadArea.style.opacity = '1';
    loadImage(e.dataTransfer.files[0]);
});

closeBtn.addEventListener('click', hideConverter);

resolutionSlider.addEventListener('input', () => {
    resolutionVal.textContent = resolutionSlider.value;
    generateASCII();
});

detailSlider.addEventListener('input', () => {
    detailVal.textContent = detailSlider.value + '%';
    generateASCII();
});

charSetSelect.addEventListener('change', generateASCII);

document.querySelectorAll('.action-btn').forEach(btn => {
    if (btn.textContent.includes('Copy')) {
        btn.classList.add('copy-btn');
        btn.addEventListener('click', copyASCII);
    }
});

});