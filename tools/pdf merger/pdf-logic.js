'use strict';

// --- Initialize PDF.js for Visual Preview ---
// Check if the library is loaded before accessing its properties
const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;

// Point to the worker source correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const status = document.getElementById('status');
const splitInput = document.getElementById('splitInput');
const previewContainer = document.getElementById('pdfPreviewContainer');
const splitRangeInput = document.getElementById('splitRange');

const mergeInput = document.getElementById('mergeInput');
const mergeFileList = document.getElementById('mergeFileList');
const imgToPdfInput = document.getElementById('imgToPdfInput');
const imgFileList = document.getElementById('imgFileList');

let selectedPages = new Set();
let mergeFiles = [];
let imgFiles = [];

function renderFileList(filesArray, containerElement) {
    containerElement.innerHTML = '';
    filesArray.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = file.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'X';
        removeBtn.onclick = () => {
            filesArray.splice(index, 1);
            renderFileList(filesArray, containerElement);
        };
        
        item.appendChild(nameSpan);
        item.appendChild(removeBtn);
        containerElement.appendChild(item);
    });
}

mergeInput.addEventListener('change', (e) => {
    mergeFiles.push(...Array.from(e.target.files));
    renderFileList(mergeFiles, mergeFileList);
    e.target.value = "";
});

imgToPdfInput.addEventListener('change', (e) => {
    imgFiles.push(...Array.from(e.target.files));
    renderFileList(imgFiles, imgFileList);
    e.target.value = "";
});


// --- Helper: Download function ---
function downloadFile(bytes, name) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = "Finished: " + name + " downloaded.";
}

// --- 1. MERGE LOGIC ---
document.getElementById('mergeBtn').onclick = async () => {
    const files = mergeFiles;
    if (files.length < 2) return notify.info("Select at least 2 PDFs");
    
    status.textContent = "Merging...";
    try {
        const mergedDoc = await PDFLib.PDFDocument.create();
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const doc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
            pages.forEach(p => mergedDoc.addPage(p));
        }
        const bytes = await mergedDoc.save();
        downloadFile(bytes, "merged_toolsuite.pdf");
    } catch (e) {
        status.textContent = "Error merging files.";
        console.error(e);
    }
};

// --- 2. SPLIT LOGIC (With Visual Preview) ---

// When user selects a file for splitting, generate thumbnails
splitInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    status.textContent = "Loading preview thumbnails...";
    previewContainer.innerHTML = ""; 
    selectedPages.clear();
    splitRangeInput.value = "";

    try {
        const arrayBuffer = await file.arrayBuffer();
        // Load the PDF via PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 }); // Thumbnail size
            
            const wrapper = document.createElement('div');
            wrapper.style.display = "inline-block";
            wrapper.style.textAlign = "center";
            wrapper.style.margin = "10px";
            wrapper.style.padding = "5px";
            wrapper.style.border = "1px solid #ddd";

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.border = "3px solid transparent";
            canvas.style.cursor = "pointer";
            
            // Render PDF page to canvas
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const label = document.createElement('div');
            label.innerText = "Page " + i;
            label.style.fontSize = "12px";

            canvas.onclick = () => {
                if (selectedPages.has(i)) {
                    selectedPages.delete(i);
                    canvas.style.border = "3px solid transparent";
                } else {
                    selectedPages.add(i);
                    canvas.style.border = "3px solid blue";
                }
                // Update text input with sorted page numbers
                splitRangeInput.value = Array.from(selectedPages).sort((a,b) => a-b).join(', ');
            };

            wrapper.appendChild(canvas);
            wrapper.appendChild(label);
            previewContainer.appendChild(wrapper);
        }
        status.textContent = `Loaded ${pdf.numPages} pages. Click pages to select.`;
    } catch (err) {
        status.textContent = "Error loading preview.";
        console.error("PDF.js Error:", err);
    }
};

splitRangeInput.addEventListener('input', (e) => {
    const range = e.target.value;
    selectedPages.clear();
    
    const parts = range.split(',');
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1) {
                for (let i = start; i <= end; i++) selectedPages.add(i);
            }
        } else if (part !== "") {
            const num = Number(part);
            if (!isNaN(num) && num >= 1) {
                selectedPages.add(num);
            }
        }
    });

    // Update canvas borders
    const wrappers = previewContainer.children;
    for (let i = 0; i < wrappers.length; i++) {
        const pageNum = i + 1;
        const canvas = wrappers[i].querySelector('canvas');
        if (canvas) {
            if (selectedPages.has(pageNum)) {
                canvas.style.border = "3px solid blue";
            } else {
                canvas.style.border = "3px solid transparent";
            }
        }
    }
});

document.getElementById('splitBtn').onclick = async () => {
    const file = splitInput.files[0];
    const range = splitRangeInput.value;
    if (!file || !range) return notify.info("Select a file and click pages (or type range)");

    const pageIndices = [];
    let hasError = false;
    
    range.split(',').forEach(part => {
        part = part.trim();
        if (part === "") return;
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start > end || start < 1) { 
                hasError = true; return; 
            }
            for (let i = start; i <= end; i++) pageIndices.push(i - 1);
        } else {
            const num = Number(part);
            if (isNaN(num) || num < 1) { 
                hasError = true; return; 
            }
            pageIndices.push(num - 1);
        }
    });

    if (hasError || pageIndices.length === 0) {
        return notify.error("Invalid page range format. Please use formats like 1, 3, 5-8.");
    }

    status.textContent = "Splitting...";
    try {
        const doc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        const newDoc = await PDFLib.PDFDocument.create();
        
        const pages = await newDoc.copyPages(doc, pageIndices);
        pages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        downloadFile(bytes, "extracted_pages.pdf");
    } catch (e) {
        notify.error("Check your page range. Error: " + e.message);
    }
};

// --- 3. IMAGE TO PDF LOGIC ---
document.getElementById('imgToPdfBtn').onclick = async () => {
    const files = imgFiles;
    if (files.length === 0) return notify.info("Select at least one image");

    status.textContent = "Converting Images...";
    try {
        const pdfDoc = await PDFLib.PDFDocument.create();

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            let img;
            if (file.type === "image/jpeg" || file.type === "image/jpg") {
                img = await pdfDoc.embedJpg(bytes);
            } else if (file.type === "image/png") {
                img = await pdfDoc.embedPng(bytes);
            } else {
                continue; // Skip non-supported types
            }

            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }

        const finalBytes = await pdfDoc.save();
        downloadFile(finalBytes, "images_converted.pdf");
    } catch (err) {
        status.textContent = "Error converting images.";
        console.error(err);
    }
};
