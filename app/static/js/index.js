////////////////// GLOBAL VARS //////////////////////

var backendData; // data loaded from Flask app
var imgCoordinates = {}; // each displayed image actual coordinates on canvas for click detection (loaded in drawImageGrid function)
var selectedImages = new Set(); // set containing currently selected images for tagging

var selectAllFlag = false; // select all flag used for tagging 
var viewingModeFlag = false; // used to prevent clicking other images when in viewing mode 

var columns;
var rows;


////////////////// GENERAL FUNCTIONS //////////////////////

// On page load configure control elements(adding onclick functions, etc.) and do inital draw
window.onload = function () {
  configureDatasetControls();
  configureGridControls();
  configureFilterControls();
  configureTaggingControls();
  configureModal();

  resizeCanvas();
};

// Load data from Flask app through HTML template into JS variable, called in HTML head
function loadData(data) {
  backendData = data;
};

// Redraw images upon changing window size
window.addEventListener('resize', resizeCanvas, false);
function resizeCanvas() {
  canvas.width = document.getElementById('canvas').offsetWidth;
  drawImageGrid(rows, columns);
};


////////////////// CONFIG FUNCTIONS //////////////////////

// Configure data source selection panel
function configureDatasetControls() {

  // DATASET selection
  document.getElementById("dataset_selection").value = backendData['api_meta']['dataset'];;

  // DATA SOURCE toggle
  if (backendData['local_dir'] != null) {
    console.log(backendData['local_dir'])
    document.getElementById("local_data_source_radio").checked = true;
  }
};


// Configure grid controls selection panel
function configureGridControls() {

  var gridSlots = backendData["grid_params"]["grid_slots"];
  columns = backendData["grid_params"]["initial_columns"];
  rows = Math.ceil(gridSlots / columns);

  // COLUMNS slider
  const columnsSlider = document.getElementById('columns_slider');
  const columnsLabel = document.getElementById("columns_label");

  columnsSlider.onchange = function () {
    columnsLabel.innerHTML = "Columns: " + this.value;
    columns = this.value;
    rows = Math.ceil(gridSlots / columns);
    localStorage.setItem('columns', columns);
    drawImageGrid(rows, columns);
  }

  // check if there is already columns value in localStorage
  if (localStorage.hasOwnProperty('columns')) {
    columns = parseInt(localStorage.getItem('columns'));
    rows = Math.ceil(gridSlots / columns);
    columnsSlider.value = columns;
    columnsLabel.innerHTML = "Columns: " + columnsSlider.value
  } else {
    columnsSlider.onchange();
  }

  // GRID SLOTS selection (number of images displayed on page)
  document.getElementById(`${gridSlots}_slots_radio`).className = "btn btn-secondary btn-sm";

  // BOUNDING BOXES display checkbox
  bboxCheckbox = document.querySelector("input[name=bbox_checkbox]");

  // check if there is already bboxCheckbox checked value in localStorage
  if (localStorage.hasOwnProperty('bboxCheckbox')) {
    bboxCheckbox.checked = JSON.parse(localStorage.getItem('bboxCheckbox'));
  } else {
    localStorage.setItem('bboxCheckbox', bboxCheckbox.checked);
  }

  bboxCheckbox.addEventListener('change', function () {
    localStorage.setItem('bboxCheckbox', bboxCheckbox.checked)
    if (segmentationCheckbox.checked) {
      segmentationCheckbox.checked = false;
      localStorage.setItem('segmentationCheckbox', segmentationCheckbox.checked)
    };
    drawImageGrid(rows, columns);
  });

  // SEGMENTATION display checkbox
  const segmentationCheckbox = document.querySelector("input[name=segmentation_checkbox]");

  // check if there is already segmentationCheckbox checked value in localStorage
  if (localStorage.hasOwnProperty('segmentationCheckbox')) {
    segmentationCheckbox.checked = JSON.parse(localStorage.getItem('segmentationCheckbox'));
  } else {
    localStorage.setItem('segmentationCheckbox', segmentationCheckbox.checked);
  }

  segmentationCheckbox.addEventListener('change', function () {
    localStorage.setItem('segmentationCheckbox', segmentationCheckbox.checked)
    if (bboxCheckbox.checked) {
      bboxCheckbox.checked = false;
      localStorage.setItem('bboxCheckbox', bboxCheckbox.checked)
    };
    drawImageGrid(rows, columns);
  });
};


// Configure filtering (categories/tags selection) panelt
function configureFilterControls() {

  $('select[name=categories]').val(backendData["img_page"]["categories"]);
  $('select[name=tags_filter]').val(backendData["img_page"]["tags_filter"]);

  $('.selectpicker').selectpicker('refresh');
};


// Configure tagging panel
function configureTaggingControls() {

  // TAGGING MODE checkbox
  const taggingToggle = document.querySelector("input[name=tagging_toggle]");
  taggingToggle.addEventListener('change', function () {
    if (!taggingToggle.checked) {
      drawImageGrid(rows, columns);
      selectAllFlag = false;
      selectedImages = new Set();
    }
  });

  // SELECT ALL button (selects images across all pages)
  const selectAllButton = document.getElementById("select_all_button");
  selectAllButton.addEventListener("click", function (e) {
    selectAllFlag = !selectAllFlag;

    if (selectAllFlag) {
      selectedImages = new Set();
    }

    for (let img_id in imgCoordinates) {
      selectImage(img_id);
    }

    if (!taggingToggle.checked) {
      taggingToggle.checked = true;
    }
  });

  // LOAD TAGS file input
  document.getElementById('inputfile').addEventListener('change', function () {
    var fr = new FileReader();
    fr.onload = function () {
      $.ajax({
        url: '/read_tags_from_file',
        type: 'POST',
        data: {
          images_to_tag: fr.result
        },
        success: function () {
          location.reload();
        }
      });
    }
    fr.readAsText(this.files[0]);
  });
};


// Configure modal for viewing images in full size
function configureModal() {

  const span = document.getElementById("closeModalButton");

  span.addEventListener("click", function (e) {
    document.getElementById("modal").style.display = "none";
    viewingModeFlag = false;
    e.stopImmediatePropagation();
  });
};


////////////////// DRAWING FUNCTIONS //////////////////////

// Draw images grid 
function drawImageGrid(rows, columns) {

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext('2d');

  var imgPage = backendData["img_page"];
  var tags = backendData["tags"];

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
      if (typeof imgPage["images"][i] == 'undefined') {
        canvas.height = (slotSize + insidePadding * 2) * (yCell + 1) + outsidePadding * 2;
        yCell = rows; // break outer loop
        break;
      }

      // get image and its annotations
      let img = imgPage["images"][i];
      let annotations = imgPage["anns"][img["id"]];

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
        if (img["id"] in tags) {
          drawTag(tags[img["id"]], imgX + imgWidth, imgY);
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

    // COCO segmentation is a list in a list, so we retrive first element
    let segmentation = annotations[i]['segmentation'][0]

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

////////////////// IMAGE SELECTING FUNCTIONS (VIEWING & TAGGING)//////////////////////

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

  var imgPage = backendData["img_page"];

  var modal = document.getElementById("modal");
  var modalCaption = document.getElementById("modal_caption");
  var modalFilename = document.getElementById("modal_filename");
  var modalCanvas = document.getElementById('modal_canvas');
  var modalCtx = modalCanvas.getContext('2d');

  for (let img of imgPage["images"]) {
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
      let annotations = imgPage["anns"][viewedImg["id"]];
      drawBboxes(modalCtx, annotations, padding, padding, 1, 1);
    }

    // display bounding segmentation if checked
    if (JSON.parse(localStorage.getItem('segmentationCheckbox'))) {
      let annotations = imgPage["anns"][viewedImg["id"]];
      drawSegmentations(modalCtx, annotations, padding, padding, 1, 1);
    }

  };

  imageObj.src = viewedImg["url"]

  // display filename and captions
  modalFilename.innerHTML = `${viewedImg["file_name"]}`;
  modalCaption.innerHTML = `${imgPage["captions"][viewedImg["id"]]}`;
  viewingModeFlag = true;
};

// Check if clicked on image to view/tag
document.addEventListener('click', function (e) {

  // loop through images coordinates to see if click was made inside one
  for (let img_id in imgCoordinates) {
    if (isClickInsideRectangle(imgCoordinates[img_id], e.clientX, e.clientY)) {
      if (document.querySelector("input[name=tagging_toggle]").checked) {
        selectImage(img_id);
      } else if (viewingModeFlag == false) {
        viewImage(img_id);
      }
      break;
    }
  }

  // Helper function for determining if click was made inside rectangle 
  function isClickInsideRectangle(rectCoordinates, clickX, clickY) {

    // adjust click coordinates to canvas position
    const canvasRect = canvas.getBoundingClientRect()
    clickX -= canvasRect.left
    clickY -= canvasRect.top

    // get rectangle coordinates
    var rectLeft, rectTop, rectRight, rectBottom;
    rectLeft = rectCoordinates[0];
    rectTop = rectCoordinates[1];
    rectRight = rectLeft + rectCoordinates[2];
    rectBottom = rectTop + rectCoordinates[3];

    // check click coordinates against rectangle coordinates
    var horizontalCheck = clickX >= rectLeft && clickX <= rectRight;
    var verticalCheck = clickY >= rectTop && clickY <= rectBottom;

    // return true if click is inside rectangle
    return horizontalCheck && verticalCheck;
  }
});


// Key down handling for tagging / handling buttons and toggles
document.addEventListener('keydown', (event) => {

  // available keys for tagging are set in config file
  const availableTagKeys = taggingParameters.availableTagKeys;
  var key = event.key;
  var tags = backendData["tags"];

  // update tags and send them to backend
  if (selectedImages.size > 0 && availableTagKeys.includes(key)) {
    let imgIds = [...selectedImages]
    $.ajax({
      url: '/update_tags',
      type: 'POST',
      data: {
        images_to_tag: JSON.stringify({
          'selected_img_ids': imgIds,
          'tag': key,
          'select_all_flag': selectAllFlag
        })
      }
    });
    document.querySelector("input[name=tagging_toggle]").checked = false;
    selectAllFlag = false;
    selectedImages = new Set();
    for (var i = 0; i < imgIds.length; i++) {
      tags[parseInt(imgIds[i])] = key;
    };
    drawImageGrid(rows, columns);
  }

  // handling buttons and toggles
  else {
    
    switch (event.key) {
      case "Escape":
        // ESC - close viewing mode
        document.getElementById("closeModalButton").click(); 
        break;
      case "b":
        // CTRL B - toggle bounding boxes checkbox
        document.querySelector("input[name=bbox_checkbox]").click();
        break;
      case "s":
        // toggle segmentations checkbox
        document.querySelector("input[name=segmentation_checkbox]").click();
        break;
      case "t":
        // toggle  tagging mode
        document.querySelector("input[name=tagging_toggle]").click();
        break;
      case "ArrowRight":
        // go next page
        document.getElementById("next_button").click();
        break;
      case "ArrowLeft":
        // go pervious page
        document.getElementById("previous_button").click();
        break;
    }
  }
});