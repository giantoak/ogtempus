if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}


function handleFiles(files) {
  // Check for the various File API support.
  if (window.FileReader) {
    // FileReader are supported.
    getAsText(files[0]);
  } else {
    alert('FileReader are not supported in this browser.');
  }
}

function getAsText(fileToRead) {
  var reader = new FileReader();
  // Handle errors load
  reader.onload = loadHandler;
  reader.onerror = errorHandler;
  // Read file into memory as UTF-8      
  reader.readAsText(fileToRead);
}

function loadHandler(event) {
  var csv = event.target.result;
  processData(csv);             
}

function processData(csv) {
    var allTextLines = csv.split(/\r\n|\n/);
    var lines = [];
    var data =[];
    while (allTextLines.length-1) {
        var temp = allTextLines.shift().split(',');
        lines.push(temp);
        data.push({"date":new Date(temp[0]),"value":parseFloat(temp[1])})
        //data.push({"date1":parseFloat(temp[0]),"value":parseFloat(temp[1])})
 
    }
  console.log(data)
  drawOutput(data);
}

function errorHandler(evt) {
  if(evt.target.error.name == "NotReadableError") {
    alert("Cannot read file!");
  }
}

function drawOutput(lines){
  $('#output').append('<div id="new">') 
  dat=lines
  MG.data_graphic({
    title: "Raw data",
    data: lines,
    width:screen.width-100,
    height:250,
    area:true,
    linked:true,
    xax_count:14,
    target: '#new',
    area:false,
    x_accessor: 'date',
    y_accessor: 'value'
})


}

  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    getAsText(files[0]);
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
