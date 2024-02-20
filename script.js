const CANVAS_SIZE = 1205;
const INITIAL_COLOR = '#2c2c2c';

const canvas = document.querySelector('canvas');
const mode = document.getElementById('jsMode');
const ctx = canvas.getContext('2d');
const saveBtn = document.getElementById('jsSave');
const range = document.getElementById('jsRange');
const fileInput = document.getElementById('fileInput');
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

let paintColor = INITIAL_COLOR;
let currentTool = 'brush';
let painting = false;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

ctx.strokeStyle = paintColor;
ctx.fillStyle = paintColor;
ctx.lineWidth = 2.5;

let paintMode = 'peindre';

function togglePaintMode() {
    console.log("toggle paint mode");
    if (paintMode === 'peindre') {
        mode.innerText = 'Remplir';
        paintMode = 'remplir';
    } else {
        mode.innerText = 'Peindre';
        paintMode = 'peindre';
    }
}

if (canvas) {
    canvas.addEventListener('contextmenu', disableContextMenu);
    canvas.addEventListener('click', () => { if (paintMode == 'remplir') fillCanvas(); });
    canvas.addEventListener('mousedown', paintBegin);
}

function disableContextMenu(event) {
    event.preventDefault();
}

function fillCanvas() {
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

let startImage = null;
let startPoint = { x: 0, y: 0 };

function paintCanvas(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    switch (currentTool) {
        case "brush": {
            ctx.lineTo(x, y);
            ctx.stroke();
        } break;
        case "ligne": {
            ctx.putImageData(startImage, 0, 0);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        } break;
        case "rectangle": {
            ctx.putImageData(startImage, 0, 0);
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);
        } break;
        case "cercle": {
            ctx.putImageData(startImage, 0, 0);
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        } break;
        case "polygone": {
            console.log("polygon");
            ctx.putImageData(startImage, 0, 0);
            getPolygon(x, y);
        } break;
    }
}

function paintBegin(event) {
    canvas.addEventListener('mousemove', paintCanvas);
    canvas.addEventListener('mouseup', paintEnd);
    canvas.addEventListener('mouseleave', paintEnd);
    const x = event.offsetX;
    const y = event.offsetY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    startImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    startPoint = { x, y };
}

function paintEnd(event) {
    canvas.removeEventListener('mousemove', paintCanvas);
    canvas.removeEventListener('mouseup', paintEnd);
    canvas.removeEventListener('mouseleave', paintEnd);
}

// Setup click handler for jsColor buttons
const colorButtons = Array.from(document.getElementsByClassName('jsColor'));

colorButtons.forEach(button =>
    button.addEventListener('click', (e) =>
        changePaintColor(e.target.style.backgroundColor)));

function changePaintColor(clickedColor) {
    paintColor = clickedColor;
    ctx.strokeStyle = clickedColor;
    ctx.fillStyle = clickedColor;
}

function changePaintTool(clickedTool) {
    console.log(clickedTool);
    const toolList = [
        // "open", "save","ellipse",
        "brush", "ligne", "rectangle", "cercle", "polygone"
    ];
    toolList.forEach(toolName => document.getElementById(toolName).className = "");
    document.getElementById(clickedTool).className = "selected";
    currentTool = clickedTool;
}

// Polygon Code

const polygonSides = 5;

// Holds x & y polygon point values
class PolygonPoint {
    constructor(x, y) {
        this.x = x, this.y = y;
    }
}

// Returns the angle using x and y
// x = Adjacent Side
// y = Opposite Side
// Tan(Angle) = Opposite / Adjacent
// Angle = ArcTan(Opposite / Adjacent)
function getAngleUsingXAndY(x, y) {
    let adjacent = x - startPoint.x;
    let opposite = y - startPoint.y;

    return radiansToDegrees(Math.atan2(opposite, adjacent));
}

function radiansToDegrees(rad) {
    if (rad < 0) {
        // Correct the bottom error by adding the negative
        // angle to 360 to get the correct result around
        // the whole circle
        return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
    } else {
        return (rad * (180 / Math.PI)).toFixed(2);
    }
}

// Converts degrees to radians
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function getPolygonPoints(x, y) {
    // Get angle in radians based on x & y of mouse location
    let angle = degreesToRadians(getAngleUsingXAndY(startPoint.x, startPoint.y));

    // X & Y for the X & Y point representing the radius is equal to
    // the X & Y of the bounding rubberband box
    const width = x - startPoint.x;
    const height = y - startPoint.y;
    let radiusX = width;
    let radiusY = height;
    // Stores all points in the polygon
    let polygonPoints = [];

    // Each point in the polygon is found by breaking the 
    // parts of the polygon into triangles
    // Then I can use the known angle and adjacent side length
    // to find the X = mouseLoc.x + radiusX * Sin(angle)
    // You find the Y = mouseLoc.y + radiusY * Cos(angle)
    for (let i = 0; i < polygonSides; i++) {
        polygonPoints.push(new PolygonPoint(
            startPoint.x + radiusX * Math.sin(angle),
            startPoint.y - radiusY * Math.cos(angle)
        ));

        // 2 * PI equals 360 degrees
        // Divide 360 into parts based on how many polygon 
        // sides you want 
        angle += 2 * Math.PI / polygonSides;
    }
    return polygonPoints;
}

// Get the polygon points and draw the polygon
function getPolygon(x, y) {
    console.log("getPolygon");
    let polygonPoints = getPolygonPoints(x, y);
    console.log(polygonPoints);
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonSides; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function handleSaveClick(){
    const image = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = image;
    link.download = "Exportation du dessin";
    link.click();
}

if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveClick);
}

if (range) {
    range.addEventListener('input', handleRangeChange);
}

function handleRangeChange(event){
    const rangeValue = event.target.value;
    ctx.lineWidth = rangeValue;
}

/*

const canvas = document.querySelector('canvas');
//const canvas = document.getElementById('jsCanvas');
const ctx = canvas.getContext('2d');
const colors = document.getElementsByClassName('jsColor');
const range = document.getElementById('jsRange');
const mode = document.getElementById('jsMode');
const saveBtn = document.getElementById('jsSave');
const fileInput = document.getElementById('fileInput');


const INITIAL_COLOR = '#2c2c2c';
const CANVAS_SIZE = 1100;

canvas.height = CANVAS_SIZE;
canvas.width = CANVAS_SIZE;

ctx.fillStyle = 'white';
ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);

ctx.lineWidth = 2.5;
ctx.strokeStyle = INITIAL_COLOR;
ctx.fillStyle = INITIAL_COLOR;

let painting = false;
let filling = false;
let dragging = false;



let line_Width = 2;
let polygonSides = 6;
// Tool currently using
let currentTool = 'brush';


// Stores whether I'm currently using brush
let usingBrush = false;
// Stores line x & ys used to make brush lines
let brushXPoints = new Array();
let brushYPoints = new Array();
// Stores whether mouse is down
let brushDownPos = new Array();



function stopPainting(){
    painting = false;
}

function startPainting(){
    painting = true;
}

function onMouseMove(event){
    x = event.offsetX;
    y = event.offsetY;
    if (!painting) {
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function onMouseDown(event){
    painting = true;
}

function handleColorClick(event){
    const color = event.target.style.backgroundColor;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
}

function handleRangeChange(event){
    const rangeValue = event.target.value;
    ctx.lineWidth = rangeValue;
}

function handleModeClick(){
    if (filling === true) {
        filling = false;
        mode.innerText = 'Remplir';
    } else {
        filling = true;
        mode.innerText = 'Peindre';
    }
}

function handleCanvasClick(){
    if (filling){
        ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);
    }
}

function handleCM(event){
    event.preventDefault();
}

function handleSaveClick(){
    const image = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = image;
    link.download = "Exportation du dessin";
    link.click();
}



// Stores size data used to create rubber band shapes
// that will redraw as the user moves the mouse
class ShapeBoundingBox{
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}

// Holds x & y polygon point values
class PolygonPoint{
    constructor(x,y) {
        this.x = x,
        this.y = y;
    }
}


// Stores top left x & y and size of rubber band box 
let shapeBoundingBox = new ShapeBoundingBox(0,0,0,0);
// Holds x & y position where clicked
let mousedown = new GetMousePosition(0,0);
// Holds x & y location of the mouse
//let loc = new Location(0,0);

// Call for our function to execute when page is loaded
document.addEventListener('DOMContentLoaded', setupCanvas);

function setupCanvas(){
    // Get reference to canvas element
    //canvas = document.getElementById('canvas');
    // Get methods for manipulating the canvas
    //ctx = canvas.getContext('2d');
    ctx.strokeStyle = INITIAL_COLOR;
    ctx.lineWidth = line_Width;
    // Execute ReactToMouseDown when the mouse is clicked
    canvas.addEventListener("mousedown", ReactToMouseDown);
    // Execute ReactToMouseMove when the mouse is clicked
    canvas.addEventListener("mousemove", ReactToMouseMove);
    // Execute ReactToMouseUp when the mouse is clicked
    canvas.addEventListener("mouseup", ReactToMouseUp);
}


if(currentTool === "brush"){
    // Create paint brush
    DrawBrush();
} else if(currentTool === "line"){
    // Draw Line
    ctx.beginPath();
    ctx.moveTo(mousedown.x, mousedown.y);
    ctx.lineTo(loc.x, loc.y);
    ctx.stroke();
}


function ChangeTool(toolClicked){
    document.getElementById("open").className = "";
   //document.getElementById("save").className = "";
    document.getElementById('brush').className = " ";
    document.getElementById('ligne').className = " ";
    document.getElementById("rectangle").className = "";
    document.getElementById("cercle").className = "";
    //document.getElementById("ellipse").className = "";
    document.getElementById("polygone").className = "";
    // Highlight the last selected tool on toolbar
    document.getElementById(toolClicked).className = "selected";
    // Change current tool used for drawing
    currentTool = toolClicked;
}
// Returns mouse x & y position based on canvas position in page
function GetMousePosition(x,y){
    // Get canvas size and position in web page
    let canvasSizeData = canvas.getBoundingClientRect();
    return { x: (x - canvasSizeData.left) * (canvas.width  / canvasSizeData.width),
        y: (y - canvasSizeData.top)  * (canvas.height / canvasSizeData.height)
      };
}

function RedrawCanvasImage(){
    // Restore image
    ctx.putImageData(savedImageData,0,0);
}

function UpdateRubberbandSizeData(loc){
    // Height & width are the difference between were clicked
    // and current mouse position
    shapeBoundingBox.width = Math.abs(loc.x - mousedown.x);
    shapeBoundingBox.height = Math.abs(loc.y - mousedown.y);

    // If mouse is below where mouse was clicked originally
    if(loc.x > mousedown.x){

        // Store mousedown because it is farthest left
        shapeBoundingBox.left = mousedown.x;
    } else {

        // Store mouse location because it is most left
        shapeBoundingBox.left = loc.x;
    }

    // If mouse location is below where clicked originally
    if(loc.y > mousedown.y){

        // Store mousedown because it is closer to the top
        // of the canvas
        shapeBoundingBox.top = mousedown.y;
    } else {

        // Otherwise store mouse position
        shapeBoundingBox.top = loc.y;
    }
}

// Returns the angle using x and y
// x = Adjacent Side
// y = Opposite Side
// Tan(Angle) = Opposite / Adjacent
// Angle = ArcTan(Opposite / Adjacent)
function getAngleUsingXAndY(mouselocX, mouselocY){
    let adjacent = mousedown.x - mouselocX;
    let opposite = mousedown.y - mouselocY;
 
    return radiansToDegrees(Math.atan2(opposite, adjacent));
}

function radiansToDegrees(rad){
    if(rad < 0){
        // Correct the bottom error by adding the negative
        // angle to 360 to get the correct result around
        // the whole circle
        return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
    } else {
        return (rad * (180 / Math.PI)).toFixed(2);
    }
}

// Converts degrees to radians
function degreesToRadians(degrees){
    return degrees * (Math.PI / 180);
}

function getPolygonPoints(){
    // Get angle in radians based on x & y of mouse location
    let angle =  degreesToRadians(getAngleUsingXAndY(loc.x, loc.y));

    // X & Y for the X & Y point representing the radius is equal to
    // the X & Y of the bounding rubberband box
    let radiusX = shapeBoundingBox.width;
    let radiusY = shapeBoundingBox.height;
    // Stores all points in the polygon
    let polygonPoints = [];

    // Each point in the polygon is found by breaking the 
    // parts of the polygon into triangles
    // Then I can use the known angle and adjacent side length
    // to find the X = mouseLoc.x + radiusX * Sin(angle)
    // You find the Y = mouseLoc.y + radiusY * Cos(angle)
    for(let i = 0; i < polygonSides; i++){
        polygonPoints.push(new PolygonPoint(loc.x + radiusX * Math.sin(angle),
        loc.y - radiusY * Math.cos(angle)));

        // 2 * PI equals 360 degrees
        // Divide 360 into parts based on how many polygon 
        // sides you want 
        angle += 2 * Math.PI / polygonSides;
    }
    return polygonPoints;
}

// Get the polygon points and draw the polygon
function getPolygon(){
    let polygonPoints = getPolygonPoints();
    ctx.beginPath();
    ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for(let i = 1; i < polygonSides; i++){
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    ctx.closePath();
}

// Called to draw the line
function drawRubberbandShape(loc){
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    if(currentTool === "brush"){
        // Create paint brush
        DrawBrush();
    } else if(currentTool === "line"){
        // Draw Line
        ctx.beginPath();
        ctx.moveTo(mousedown.x, mousedown.y);
        ctx.lineTo(loc.x, loc.y);
        ctx.stroke();
    } else if(currentTool === "rectangle"){
        // Creates rectangles
        ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top, shapeBoundingBox.width, shapeBoundingBox.height);
    } else if(currentTool === "cercle"){
        // Create circles
        let radius = shapeBoundingBox.width;
        ctx.beginPath();
        ctx.arc(mousedown.x, mousedown.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if(currentTool === "ellipse"){
        // Create ellipses
        // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
        let radiusX = shapeBoundingBox.width / 2;
        let radiusY = shapeBoundingBox.height / 2;
        ctx.beginPath();
        ctx.ellipse(mousedown.x, mousedown.y, radiusX, radiusY, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    } else if(currentTool === "polygone"){
        // Create polygons
        getPolygon();
        ctx.stroke();
    }
}

function UpdateRubberbandOnMove(loc){
    // Stores changing height, width, x & y position of most 
    // top left point being either the click or mouse location
    UpdateRubberbandSizeData(loc);

    // Redraw the shape
    drawRubberbandShape(loc);
}

// Store each point as the mouse moves and whether the mouse
// button is currently being dragged
function AddBrushPoint(x, y, mouseDown){
    brushXPoints.push(x);
    brushYPoints.push(y);
    // Store true that mouse is down
    brushDownPos.push(mouseDown);
}

// Cycle through all brush points and connect them with lines
function DrawBrush(){
    for(let i = 1; i < brushXPoints.length; i++){
        ctx.beginPath();

        // Check if the mouse button was down at this point
        // and if so continue drawing
        if(brushDownPos[i]){
            ctx.moveTo(brushXPoints[i-1], brushYPoints[i-1]);
        } else {
            ctx.moveTo(brushXPoints[i]-1, brushYPoints[i]);
        }
        ctx.lineTo(brushXPoints[i], brushYPoints[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

function ReactToMouseDown(e){
    // Store location 
    loc = GetMousePosition(e.clientX, e.clientY);
    // Save the current canvas image
    SaveCanvasImage();
    // Store mouse position when clicked
    mousedown.x = loc.x;
    mousedown.y = loc.y;
    // Store that yes the mouse is being held down
    dragging = true;

    // Brush will store points in an array
    if(currentTool === 'brush'){
        usingBrush = true;
        AddBrushPoint(loc.x, loc.y);
    }
};

function ReactToMouseMove(e){
    loc = GetMousePosition(e.clientX, e.clientY);

    // If using brush tool and dragging store each point
    if(currentTool === 'brush' && dragging && usingBrush){
        // Throw away brush drawings that occur outside of the canvas
        if(loc.x > 0 && loc.x < canvasWidth && loc.y > 0 && loc.y < canvasHeight){
            AddBrushPoint(loc.x, loc.y, true);
        }
        RedrawCanvasImage();
        DrawBrush();
    } else {
        if(dragging){
            RedrawCanvasImage();
            UpdateRubberbandOnMove(loc);
        }
    }
};

function ReactToMouseUp(e){
    canvas.style.cursor = "default";
    loc = GetMousePosition(e.clientX, e.clientY);
    RedrawCanvasImage();
    UpdateRubberbandOnMove(loc);
    dragging = false;
    usingBrush = false;
}

function OpenImage(){
    let img = new Image();
    // Once the image is loaded clear the canvas and draw it
    img.onload = function(){
        ctx.clearRect(0,0,canvas.width, canvas.height);
        ctx.drawImage(img,0,0);
    }
    img.src = 'image.png';

}



if (canvas) {
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', stopPainting);
    canvas.addEventListener('mouseleave', stopPainting);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('ctxmenu', handleCM);
}

Array.from(colors).forEach(color => color.addEventListener('click', handleColorClick));

if (range) {
    range.addEventListener('input', handleRangeChange);
}

if (mode) {
    mode.addEventListener('click', handleModeClick);
}

if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveClick);
}

const openFileBtn = document.getElementById('open-file');
/*
openFileBtn.addEventListener('click', () => {
  document.getElementById('fileInput').click();
})
*/
fileInput.addEventListener('change', () => {

  const file = fileInput.files[0];

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  }

  img.src = URL.createObjectURL(file);

})

*/
