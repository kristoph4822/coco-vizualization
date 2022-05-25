////////////////// DRAWING FUNCTIONS //////////////////////

// Draw images grid 
function drawImageGrid(rows, columns) {

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d');

    // grid parameters
    const outsidePadding = imgGridParameters.outsidePadding; //padding
    const slotSize = (canvas.width - 2 * outsidePadding) / columns;
    const insidePadding = slotSize * imgGridParameters.insidePaddingImageRatio; //padding
    canvas.height = (slotSize + insidePadding * 2) * rows;

    // iterator for subsequent images
    let i = 0

    for (let yCell = 0; yCell < rows; yCell++) {
        for (let xCell = 0; xCell < columns; xCell++) {

            // break if reached the end + adjust canvas height
            if (typeof backendData["images"][i] == 'undefined') {
                canvas.height = (slotSize + insidePadding * 2) * (yCell + 1) + outsidePadding * 2;
                yCell = rows; // break outer loop
                break;
            }

            // get image and its annotations
            let img = backendData["images"][i];
            let annotations = backendData["anns"][img["id"]];

            // get image coordinates and size
            let imgX = xCell * slotSize + insidePadding + outsidePadding;
            let imgY = yCell * slotSize + insidePadding + outsidePadding;

            let imgWidth = slotSize - insidePadding * 2;
            let imgHeight = slotSize - insidePadding * 2;

            // get width and height ratio to scale annotations coordinates
            let imgWidthRatio = imgWidth / img["width"];
            let imgHeightRatio = imgHeight / img["height"];

            // update images coordinates (global variable) used in handling clicks
            imgCoordinates[img["id"]] = [imgX, imgY, imgWidth, imgHeight]

            let imageObj = new Image();
            imageObj.onload = function () {

                ctx.drawImage(imageObj, imgX, imgY, imgWidth, imgHeight);

                // draw bboxes if checked
                if (JSON.parse(localStorage.getItem('bboxCheckbox'))) {
                    drawBboxes(ctx, annotations, imgX, imgY, imgWidthRatio, imgHeightRatio);
                }

                // draw segmentation if checked
                if (JSON.parse(localStorage.getItem('segmentationCheckbox'))) {
                    drawSegmentations(ctx, annotations, imgX, imgY, imgWidthRatio, imgHeightRatio);
                }

                // add tag img if tagged
                if (img["id"] in backendData["tags"]) {
                    drawTag(backendData["tags"][img["id"]], imgX + imgWidth, imgY);
                }
            };

            // display error image if url cannot be loaded
            imageObj.onerror = function () {
                imageObj.src = '../static/img/no_image.png';
            }

            imageObj.src = img['url'];
            i += 1;
        }
    }
};

// Draw bounding boxes (coordinates and size ratios to adjust coordinates)
function drawBboxes(ctx, annotations, imgX, imgY, imgWidthRatio, imgHeightRatio) {

    const bboxLineWidth = bboxParameters.lineWidth;
    const colors = bboxParameters.colorsList;
    const labelFont = bboxParameters.labelFont;

    for (let j = 0; j < annotations.length; j++) {

        // get bounding box and adjust its size to img size based on new:original size ratio
        let bbox = annotations[j]['bbox']
        bbox = [bbox[0] * imgWidthRatio, bbox[1] * imgHeightRatio, bbox[2] * imgWidthRatio, bbox[3] * imgHeightRatio]

        // get color based on category id value
        let color = colors[annotations[j]['category_id'] % colors.length];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        ctx.beginPath();
        ctx.lineWidth = bboxLineWidth;
        ctx.font = labelFont;
        ctx.rect(imgX + bbox[0], imgY + bbox[1], bbox[2], bbox[3]);
        ctx.fillText(annotations[j]['category_name'], imgX + bbox[0], imgY + bbox[1] - 5);
        ctx.stroke();
    }
};


// Draw segmentation polygons (coordinates and size ratios to adjust coordinates)
function drawSegmentations(ctx, annotations, imgX, imgY, imgWidthRatio, imgHeightRatio) {

    const outlineWidth = segmentationParameters.lineWidth;
    const colors = segmentationParameters.colorsList;
    const labelFont = segmentationParameters.labelFont;
    const transparency = segmentationParameters.transparency;

    for (let i = 0; i < annotations.length; i++) {

        let segmentation = annotations[i]['segmentation']

        // skip if there is no segmentation
        if (typeof segmentation == 'undefined') {
            break;
        }

        // get color based on category id value
        let color = colors[annotations[i]['category_id'] % colors.length];
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = outlineWidth;
        ctx.font = labelFont;

        ctx.beginPath();
        ctx.moveTo(imgX + segmentation[0] * imgWidthRatio, imgY + segmentation[1] * imgHeightRatio);

        // scale and adjust coordinates to image postion and size
        for (let j = 2; j < segmentation.length - 1; j += 2) {
            ctx.lineTo(imgX + segmentation[j] * imgWidthRatio, imgY + segmentation[j + 1] * imgHeightRatio);
        }
        ctx.closePath();
        ctx.stroke();

        // position label on top of segmentation polygon
        let textLocation = findHighestPolyPoint(segmentation);
        ctx.fillText(annotations[i]['category_name'], imgX + textLocation[0] * imgWidthRatio, imgY + textLocation[1] * imgHeightRatio - 5);

        // make inside of polygon partially transparent
        ctx.globalAlpha = transparency;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // find highest point of polygon to position label text
    function findHighestPolyPoint(poly) {
        let highestPoint = [poly[0], poly[1]];
        for (let i = 2; i < poly.length - 1; i += 2) {
            if (poly[i + 1] < highestPoint[1]) {
                highestPoint = [poly[i], poly[i + 1]]
            }
        }
        return highestPoint
    }
};


function drawTag(tag, rightTopCornerX, rightTopCornerY) {

    var ctx = document.querySelector("canvas").getContext("2d");
    var tagImgSize = (canvas.width / columns) * taggingParameters.tagSizeRatio;
    img = new Image;


    img.onload = function () {
        ctx.drawImage(this, rightTopCornerX - tagImgSize, rightTopCornerY, tagImgSize, tagImgSize);
    };

    img.src = `../static/img/tags/tag_${tag}.png`;

};


// Select/deselect image for tagging (draw outline)
function selectImage(img_id) {

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext('2d');
    var color;

    if (selectedImages.has(img_id)) {
        selectedImages.delete(img_id);
        color = taggingParameters.deselectColor;
        ctx.lineWidth = taggingParameters.selectLineWidth + 1;
    } else {
        selectedImages.add(img_id);
        color = taggingParameters.selectColor;
        ctx.lineWidth = taggingParameters.selectLineWidth;
    }
    ctx.strokeStyle = color
    ctx.beginPath();
    ctx.rect(imgCoordinates[img_id][0], imgCoordinates[img_id][1], imgCoordinates[img_id][2], imgCoordinates[img_id][3]);
    ctx.stroke();
};


// View full scale image in modal (+ display filename and captions)
function viewImage(img_id) {
    var viewedImg;
    const padding = viewParameters.padding;


    var modal = document.getElementById("modal");
    var modalCaption = document.getElementById("modal_caption");
    var modalFilename = document.getElementById("modal_filename");
    var modalCanvas = document.getElementById('modal_canvas');
    var modalCtx = modalCanvas.getContext('2d');

    for (let img of backendData["images"]) {
        if (img["id"] == img_id) {
            viewedImg = img;
            break;
        }
    }

    modal.style.display = "block";

    var imageObj = new Image;

    imageObj.onload = function () {
        modalCtx.canvas.width = viewedImg["width"] + 2 * padding;
        modalCtx.canvas.height = viewedImg["height"] + 2 * padding;
        modalCtx.drawImage(imageObj, padding, padding, viewedImg["width"], viewedImg["height"]);

        // display bounding boxes if checked
        if (JSON.parse(localStorage.getItem('bboxCheckbox'))) {
            let annotations = backendData["anns"][viewedImg["id"]];
            drawBboxes(modalCtx, annotations, padding, padding, 1, 1);
        }

        // display bounding segmentation if checked
        if (JSON.parse(localStorage.getItem('segmentationCheckbox'))) {
            let annotations = backendData["anns"][viewedImg["id"]];
            drawSegmentations(modalCtx, annotations, padding, padding, 1, 1);
        }

    };

    imageObj.src = viewedImg["url"]

    // display filename and captions
    modalFilename.innerHTML = `${viewedImg["file_name"]}`;
    modalCaption.innerHTML = `${backendData["captions"][viewedImg["id"]]}`;
    viewingModeFlag = true;
};