////////////////// GENERAL FUNCTIONS //////////////////////
var imgCoordinates = {}; // each displayed image actual coordinates on canvas for click detection (loaded in drawImageGrid function)
var selectedImages = new Set(); // set containing currently selected images for tagging

var selectAllFlag = false; // select all flag used for tagging 
var viewingModeFlag = false; // flag used to prevent clicking other images when in viewing mode 

var columns;
var rows;


// On page load configure control elements(adding onclick functions, etc.) and do inital draw
window.onload = function () {
  configureDatasetControls();
  configureGridControls();
  configureFilterControls();
  configureTaggingControls();
  configureModal();

  resizeCanvas();
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

  $('select[name=categories]').val(backendData["filters"]["selected_categories"]);
  $('select[name=tags_filter]').val(backendData["filters"]["selected_tags"]);

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
        // toggle bounding boxes checkbox
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