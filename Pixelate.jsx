#target photoshop
app.bringToFront();

// Ask user how many colours they want
var numColorsStr = prompt("Enter number of colours (2–256):", "8");
if (numColorsStr === null) throw new Error("Script cancelled");
var numColors = parseInt(numColorsStr, 10);
if (isNaN(numColors) || numColors < 2 || numColors > 256) {
    alert("Please enter a whole number between 2 and 256.");
    throw new Error("Invalid colour count");
}

numColors++;

// Remember original settings
var origDoc   = app.activeDocument;
var origPrefs = app.preferences.rulerUnits;
app.preferences.rulerUnits = Units.PIXELS;

// Create a temporary doc the same size/resolution
var tmpDoc = app.documents.add(
    origDoc.width,
    origDoc.height,
    origDoc.resolution,
    "TempPixelate",
    NewDocumentMode.RGB,
    DocumentFill.TRANSPARENT
);

// ── Copy the active layer into the temp doc ──
// Make original frontmost by assignment, then copy
app.activeDocument = origDoc;
origDoc.activeLayer.copy();

// Make temp doc frontmost, paste & flatten
app.activeDocument = tmpDoc;
tmpDoc.paste();
tmpDoc.flatten();

// ── Pixelate by scaling down to 10% then back up to 1000% ──
tmpDoc.resizeImage(
  tmpDoc.width  * 0.1,
  tmpDoc.height * 0.1,
  undefined,
  ResampleMethod.NEARESTNEIGHBOR
);
tmpDoc.resizeImage(
  origDoc.width,
  origDoc.height,
  undefined,
  ResampleMethod.NEARESTNEIGHBOR
);

// ── Reduce to indexed colour ──
if (tmpDoc.mode !== DocumentMode.INDEXEDCOLOR) {
  var opts = new IndexedConversionOptions();
  opts.palette = Palette.LOCALSELECTIVE;
  opts.colors  = numColors;
  opts.dither  = Dither.NONE;
  // no need to set ditherAmount when dithering is NONE
  tmpDoc.changeMode(ChangeMode.INDEXEDCOLOR, opts);
}
// Back to RGB so we can copy from it
tmpDoc.changeMode(ChangeMode.RGB);

// ── Copy the processed pixels back into the original document ──
app.activeDocument = tmpDoc;
tmpDoc.selection.selectAll();
tmpDoc.selection.copy(true);

app.activeDocument = origDoc;
var newLayer = origDoc.paste();
newLayer.name = "Pixelated × " + numColors;

// Clean up
tmpDoc.close(SaveOptions.DONOTSAVECHANGES);
app.preferences.rulerUnits = origPrefs;
