// Define Area of Interest
var kisumu = ee.FeatureCollection("projects/ee-john-odero/assets/Kissumu");


// Combine land cover feature collections
var featureCollection = built_up.merge(vegetation).merge(bareland).merge(water_body);

// Center the map over the AOI
Map.centerObject(kisumu, 10);
Map.addLayer(kisumu, {color: 'red'}, 'AOI');

// Load Sentinel-2 Image Collections
var image2024 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(kisumu)
  .filterDate('2024-01-01', '2024-10-20')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(kisumu);

var image2020 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(kisumu)
  .filterDate('2020-01-01', '2020-12-30')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(kisumu);

// Visualization parameters
var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4
};

Map.addLayer(image2024, visParams, 'Sentinel-2 Image 2024');
Map.addLayer(image2020, visParams, 'Sentinel-2 Image 2020');

// NDVI Calculation
var ndvi2024 = image2024.normalizedDifference(['B8', 'B4']).rename('NDVI');
var ndvi2020 = image2020.normalizedDifference(['B8', 'B4']).rename('NDVI');

// Visualization parameters for NDVI
var ndviVisParams = {
  min: -1,
  max: 1,
  palette: ['blue', 'yellow', 'green']
};

// Add NDVI layers to the map
Map.addLayer(ndvi2024, ndviVisParams, 'NDVI 2024');
Map.addLayer(ndvi2020, ndviVisParams, 'NDVI 2020');

// Training data sampling
var bands = ['B2', 'B3', 'B4', 'B8'];
// Use a larger scale during sampling to reduce memory consumption
var trainingSample = image2020.select(bands).sampleRegions({
  collection: featureCollection.limit(500),  // Limit training points
  properties: ['class'],
  scale: 50  // Increase scale to reduce memory usage
});

// Train the classifier
var classifier = ee.Classifier.smileRandomForest(10).train({
  features: trainingSample,
  classProperty: 'class',
  inputProperties: bands
});

// Classify the images
var classified2024 = image2024.select(bands).classify(classifier);
var classified2020 = image2020.select(bands).classify(classifier);

// Visualizing the classified images (check for memory issues)
var classVis = {
  min: 0,
  max: 3,
  palette: ['black', 'green', 'brown', 'blue']  // Modify for your classes
};

Map.addLayer(classified2024, classVis, 'Classified 2024');
Map.addLayer(classified2020, classVis, 'Classified 2020');

// Accuracy assessment and validation
var validationPoints = featureCollection; // Use the same feature collection as validation

var validation = image2024.select(bands).sampleRegions({
  collection: validationPoints,
  properties: ['class'],
  scale: 10
});

// Classify validation data and build confusion matrix
var validated = validation.classify(classifier);
var confusionMatrix = validated.errorMatrix('class', 'classification');

// Print confusion matrix and accuracy
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());

// Change Detection
var changeDetection = classified2020.neq(classified2024);

// Display change detection results
Map.addLayer(changeDetection, {min: 0, max: 1, palette: ['white', 'black']}, 'Change Detection');

// Step 5: Create a function to add legends
function addLegend(title, colors, names) {
  var legendPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('vertical'),
    style: {position: 'bottom-left', padding: '8px'}
  });

  var legendTitle = ui.Label(title, {fontWeight: 'bold', fontSize: '14px'});
  legendPanel.add(legendTitle);
  
  colors.forEach(function(color, index) {
    var colorBox = ui.Label({
      style: {backgroundColor: color, padding: '10px', margin: '2px'}
    });
    var description = ui.Label(names[index]);
    
    var row = ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.flow('horizontal')
    });
    legendPanel.add(row);
  });
  
  Map.add(legendPanel);
}

// Step 6: Define colors and names for classified images legend
var classifiedColors = ['blue', 'green', 'black', 'brown'];
var classifiedNames = ['Water', 'Vegetation', 'Built-up', 'Bareland'];

// Step 7: Define colors and names for change detection legend
var changeColors = ['white', 'black'];
var changeNames = ['No Change', 'Change'];

// Step 8: Create legends
//addLegend('Classified Image Legend', classifiedColors, classifiedNames);
//addLegend('Change Detection Legend', changeColors, changeNames);

// Step 9: Define colors and names for NDVI legend
var ndviColors = ['blue', 'yellow', 'green',];
var ndviNames = ['Low NDVI', 'Neutral NDVI', 'High NDVI',];

// Step 10: Add NDVI Legend
addLegend('NDVI Legend', ndviColors, ndviNames);


// Define the class values for the land cover types
var classValues = [0, 1, 2, 3]; // Adjust these based on your class definitions
var classNames = ['Built-up', 'Vegetation', 'Bareland', 'Water Body']; // Names for each class

// Call the function to calculate the area for 2024 and 2020 classified images
var area2024 = calculateArea(classified2024, classValues);
var area2020 = calculateArea(classified2020, classValues);

// Function to calculate the area and return the result as a dictionary
function calculateArea(classifiedImage, classValues) {
  var pixelArea = ee.Image.pixelArea().divide(10000); // Convert to hectares
  var areas = [];
  var classNames = classValues.map(function(classValue) {
    return classValue.toString(); // Convert integer to string
  });

  classValues.forEach(function(classValue) {
    var classMask = classifiedImage.eq(classValue);
    var area = pixelArea.updateMask(classMask).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: kisumu, // Adjust this to your region of interest
      scale: 10,
      maxPixels: 1e9
    }).get('area');
    areas.push(area);
  });

  return ee.Dictionary.fromLists(classNames, areas); // Use string keys
}

// Extract area values from the dictionaries
var area2020Array = classValues.map(function(classValue) {
  return ee.Number(area2020.get(classValue.toString()));
});

var area2024Array = classValues.map(function(classValue) {
  return ee.Number(area2024.get(classValue.toString()));
});

// Debugging: Print the area arrays to check their contents
print('Area 2020:', area2020Array);
print('Area 2024:', area2024Array);

// Create a chart to visualize the areas
var chart = ui.Chart.array.values({
  array: ee.Array([area2020Array, area2024Array]),
  axis: 0,
  xLabels: classNames
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Land Cover Area Comparison (2020 vs 2024)',
  hAxis: {title: 'Land Cover Type'},
  vAxis: {title: 'Area (hectares)'},
  series: {
    0: {labelInLegend: '2020'},
    1: {labelInLegend: '2024'}
  }
});

// Display the chart
print(chart);

Export.image.toDrive({
    image: classified2024,
    description: 'clsssified_image2024',
    folder: 'earthengine',
    fileNamePrefix: 'classified2024',
    region: kisumu,
    scale: 10,
    maxPixels: 1e9
});


// Export the training data to Google Drive
Export.table.toDrive({
  collection: trainingSample,  // The training data feature collection
  description: 'TrainingDataExport',  // Name for the export task
  folder: 'earthengine',  // Folder in your Google Drive
  fileNamePrefix: 'training_data',  // File name prefix
  fileFormat: 'CSV'  // File format
});
