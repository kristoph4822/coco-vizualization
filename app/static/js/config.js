///// IMAGES DATA FROM FLASK ////
var backendData; 

function loadData(data) {
  // Load data from Flask app through HTML template into JS variable, called in HTML head
  backendData = data;
};


///// CONSTANTS //////

const imgGridParameters = {
  outsidePadding: 10,
  insidePaddingImageRatio: 0.05,
}

const bboxParameters = {
  lineWidth: 3,
  colorsList: [
    '#e6194b', '#3cb44b', '#ffe119',
    '#4363d8', '#f58231', '#911eb4',
    '#46f0f0', '#f032e6', '#bcf60c',
    '#fabebe', '#008080', '#e6beff',
    '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1',
    '#000075', '#808080'
  ],
  labelFont: "13px Arial"
  }

const  segmentationParameters = {
  lineWidth: 2,
  colorsList: [
    '#e6194b', '#3cb44b', '#ffe119',
    '#4363d8', '#f58231', '#911eb4',
    '#46f0f0', '#f032e6', '#bcf60c',
    '#fabebe', '#008080', '#e6beff',
    '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1',
    '#000075', '#808080'
  ],
  labelFont: "13px Arial",
  transparency: 0.5
}

const taggingParameters = {
  tagSizeRatio: 0.2,
  selectColor: '#FF0000',
  deselectColor: '#202020',
  selectLineWidth: 4,
  availableTagKeys: ['0', '1', '2', '3', '4', '5', '6'] //0 for untagging
}

const  viewParameters = {
  padding: 15
}





