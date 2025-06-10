import chroma from 'chroma-js';

const fileInput = document.getElementById('fileInput');
const pasteArea = document.getElementById('pasteArea');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');
const colorPalette = document.getElementById('colorPalette');
const paletteNameInput = document.getElementById('paletteNameInput');
const savePaletteButton = document.getElementById('savePaletteButton');
const loadPaletteButton = document.getElementById('loadPaletteButton');
const clearPaletteButton = document.getElementById('clearPaletteButton');
const clearImageButton = document.getElementById('clearImageButton');
const eyedropperPreview = document.getElementById('eyedropperPreview');
const eyedropperCoords = document.getElementById('eyedropperCoords');
const copiedMessage = document.getElementById('copiedMessage');

let currentImage = null; // Store the loaded image element

// Helper function to display copied message
function showCopiedMessage() {
    copiedMessage.classList.add('show');
    setTimeout(() => {
        copiedMessage.classList.remove('show');
    }, 1500);
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showCopiedMessage();
    } catch (err) {
        console.error('Failed to copy:', err);
        // Fallback for older browsers or permissions issues
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Avoid scrolling to bottom
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showCopiedMessage();
        } catch (execErr) {
            console.error('Fallback copy failed:', execErr);
            alert('Failed to copy text. Please copy it manually: ' + text);
        }
        document.body.removeChild(textArea);
    }
}

// --- Image Loading ---

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function displayImage(image) {
    currentImage = image;

    // Clear previous content
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

    // Scale image to fit while maintaining aspect ratio
    const maxCanvasWidth = imageCanvas.parentElement.offsetWidth; // Max width based on container
    const maxCanvasHeight = window.innerHeight * 0.7; // Max height relative to viewport

    const aspectRatio = image.width / image.height;
    let canvasWidth = image.width;
    let canvasHeight = image.height;

    if (canvasWidth > maxCanvasWidth) {
        canvasWidth = maxCanvasWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    if (canvasHeight > maxCanvasHeight) {
        canvasHeight = maxCanvasHeight;
        canvasWidth = canvasHeight * aspectRatio;
    }

    // Set canvas dimensions
    imageCanvas.width = canvasWidth;
    imageCanvas.height = canvasHeight;

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

    // Show controls
    clearImageButton.style.display = 'inline-block';
    // Enable eyedropper functionality
    imageCanvas.style.cursor = 'crosshair';
}

// Handle file input
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const img = await loadImage(e.target.result);
                displayImage(img);
            } catch (error) {
                console.error('Error loading image from file:', error);
                alert('Could not load image from file.');
            }
        };
        reader.readAsDataURL(file); // Use Data URL as file path is not accessible
    }
});

// Handle paste event
pasteArea.addEventListener('paste', async (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let imageItem = null;

    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            imageItem = item;
            break;
        }
    }

    if (imageItem) {
        event.preventDefault(); // Prevent default paste behavior
        const blob = imageItem.getAsFile();
        const reader = new FileReader();
        reader.onload = async (e) => {
             try {
                const img = await loadImage(e.target.result);
                displayImage(img);
            } catch (error) {
                console.error('Error loading image from paste:', error);
                alert('Could not load image from paste.');
            }
        };
        reader.readAsDataURL(blob); // Use Data URL
    } else {
         console.log('No image found in paste data.');
    }
});

// Clear image button
clearImageButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageCanvas.width = 0;
    imageCanvas.height = 0;
    currentImage = null;
    clearImageButton.style.display = 'none';
    imageCanvas.style.cursor = 'default';
    eyedropperPreview.style.display = 'none';
    eyedropperCoords.style.display = 'none';
});


// --- Eyedropper Functionality ---

imageCanvas.addEventListener('mousemove', (event) => {
    if (!currentImage) return;

    const rect = imageCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (imageCanvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (imageCanvas.height / rect.height));

    if (x >= 0 && x < imageCanvas.width && y >= 0 && y < imageCanvas.height) {
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        const color = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;

        eyedropperPreview.style.backgroundColor = color;
        eyedropperPreview.style.display = 'block';

        eyedropperCoords.textContent = `(${x}, ${y})`;
        eyedropperCoords.style.display = 'block';
    } else {
         eyedropperPreview.style.display = 'none';
         eyedropperCoords.style.display = 'none';
    }
});

imageCanvas.addEventListener('mouseleave', () => {
    eyedropperPreview.style.display = 'none';
    eyedropperCoords.style.display = 'none';
});


imageCanvas.addEventListener('click', (event) => {
     if (!currentImage) return;

    const rect = imageCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (imageCanvas.width / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (imageCanvas.height / rect.height));

     if (x >= 0 && x < imageCanvas.width && y >= 0 && y < imageCanvas.height) {
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        // Handle transparency if alpha is 0, maybe default to white background?
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];
        const a = pixelData[3]; // Alpha channel

        // For simplicity, we'll just use the RGB values directly for display
        // If alpha is 0, it might be fully transparent, but we get the underlying canvas color (default black if not drawn on)
        // If the image itself has transparency, ctx.getImageData will give the blended color on the canvas background (default black).
        // To get the 'true' color from a potentially transparent pixel on a non-transparent image, you'd need to handle alpha blending.
        // For this tool, sampling the *rendered* pixel seems appropriate.

        const color = { r, g, b };
        addColorToPalette(color);
     }
});

// --- Palette Management ---

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function rgbToHsl(r, g, b) {
    // Using chroma.js for reliable conversion
    const hsl = chroma(r, g, b).hsl();
    const h = isNaN(hsl[0]) ? 0 : Math.round(hsl[0]); // Handle grayscale (hue is NaN)
    const s = Math.round(hsl[1] * 100);
    const l = Math.round(hsl[2] * 100);
    return `hsl(${h}, ${s}%, ${l}%)`;
}


function addColorToPalette(rgbColor) {
    const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
    const hsl = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
    const rgbString = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;

    const colorInfo = {
        rgb: rgbString,
        hex: hex,
        hsl: hsl,
        id: Date.now() + Math.random() // Simple unique ID
    };

    renderPaletteItem(colorInfo);
}

function renderPaletteItem(colorInfo) {
    const listItem = document.createElement('li');
    listItem.classList.add('palette-item');
    listItem.dataset.id = colorInfo.id; // Use data attribute for ID

    listItem.innerHTML = `
        <div class="color-swatch" style="background-color: ${colorInfo.rgb};"></div>
        <div class="color-details">
            <div class="color-values">
                <span class="value-hex" data-value="${colorInfo.hex}">${colorInfo.hex}</span>
                <span class="value-rgb" data-value="${colorInfo.rgb}">${colorInfo.rgb}</span>
                <span class="value-hsl" data-value="${colorInfo.hsl}">${colorInfo.hsl}</span>
            </div>
        </div>
        <button class="remove-color" aria-label="Remove color">&times;</button>
    `;

    colorPalette.appendChild(listItem);

    // Add event listeners for copying
    listItem.querySelectorAll('.color-values span').forEach(span => {
        span.addEventListener('click', () => {
            copyToClipboard(span.dataset.value);
        });
    });

    // Add event listener for removing
    listItem.querySelector('.remove-color').addEventListener('click', () => {
        removeColorFromPalette(colorInfo.id);
    });
}

function removeColorFromPalette(id) {
    const itemToRemove = document.querySelector(`.palette-item[data-id="${id}"]`);
    if (itemToRemove) {
        itemToRemove.remove();
    }
}

function getPaletteColors() {
    const colors = [];
    colorPalette.querySelectorAll('.palette-item').forEach(item => {
        const hex = item.querySelector('.value-hex').dataset.value;
        const rgb = item.querySelector('.value-rgb').dataset.value;
        const hsl = item.querySelector('.value-hsl').dataset.value;
        colors.push({
            rgb: rgb,
            hex: hex,
            hsl: hsl,
            id: item.dataset.id // Preserve ID for removal logic if needed
        });
    });
    return colors;
}

function renderPalette(colors) {
    colorPalette.innerHTML = ''; // Clear current palette
    colors.forEach(color => renderPaletteItem(color));
}


// --- Local Storage ---

const STORAGE_KEY = 'colorSamplerPalette';

function savePalette() {
    const palette = {
        name: paletteNameInput.value || 'Unnamed Palette',
        colors: getPaletteColors()
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(palette));
        console.log('Palette saved:', palette);
    } catch (e) {
        console.error('Error saving palette to local storage:', e);
        alert('Could not save palette. Local storage might be full or unavailable.');
    }
}

function loadPalette() {
    try {
        const storedPalette = localStorage.getItem(STORAGE_KEY);
        if (storedPalette) {
            const palette = JSON.parse(storedPalette);
            paletteNameInput.value = palette.name || '';
            renderPalette(palette.colors || []);
            console.log('Palette loaded:', palette);
        } else {
            console.log('No palette found in local storage.');
            alert('No saved palette found.');
        }
    } catch (e) {
        console.error('Error loading palette from local storage:', e);
        alert('Could not load palette. Stored data might be corrupt.');
    }
}

function clearPalette() {
    if (confirm('Are you sure you want to clear the current palette? This cannot be undone.')) {
        colorPalette.innerHTML = ''; // Clear the UI
        paletteNameInput.value = ''; // Clear the name
        // Optionally clear from local storage immediately, or just let saving overwrite it
        // localStorage.removeItem(STORAGE_KEY); // Optional: clear storage immediately
        console.log('Palette cleared.');
    }
}


// Add event listeners for palette actions
savePaletteButton.addEventListener('click', savePalette);
loadPaletteButton.addEventListener('click', loadPalette);
clearPaletteButton.addEventListener('click', clearPalette);

// Load palette on initial page load
document.addEventListener('DOMContentLoaded', loadPalette);

