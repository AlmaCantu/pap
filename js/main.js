// Copyright 2021 Newcastle University.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var dimensions;

// const colorRange = ["#FFC54E", "#097DB3"];
// const nominalColor = ["#FFC54E","#097DB3","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf", "#ff7f0e"];
const nanColor = "#555";
const axisColor = "#555";
// const meanColor = d3.interpolateHcl(colorRange[0], colorRange[1])(0.5);

// events listeners
var selectedDatumChangedEventListeners = [];

var colorScaleChangedEventListeners = [];
var axesDisplayAndPositionChangedEventListeners = [];
var dataChangedEventListeners = [];
var selectedDimensionsChangedEventListeners = [];

var coloredDimension;
var selectedDimension1;
var selectedDimension2;

var correlationPlotPanel;
var blandAltmanPlotPanel;

var parallelCoordinatesBehaviour;
var visibleDimensionsPanelBehaviour;
var informationPanelBehaviour;
var correlationPlot;
var blandAltmanPlot;
var datumPanelBehaviour;
var legendPanelBehaviour;

var gParallelSets;
var gParallelCoordinates;

var body;
var tooltip;

var fullData;
var currentData;
var treeData;
var displayedData;

var dataFormatReader;
var dataReader;

var dataFormatFilePath = "dataFormat.xml";
var dataFilePath = "data.csv";

var isMerged = false;
// var totalSize;

var displayOrder = [];
displayOrder["categorical"] = 0;
displayOrder["quantitative"] = 1;

const icon_chart_line = '\uf201';
const icon_chart_bar = '\uf080';
const icon_tint = '\uf043';

var sumIsAll = true;
var corrIsCorr = true;
var blandIsBland = true;

handleData();

function handleData() {

    console.log("Checking if data file is in local folder..");
    var isDataFile = checkFileExist(dataFilePath);
     
    if (isDataFile) {
        console.log("-- Data file in local folder");

        console.log("Loading data...");
        d3.csv(dataFilePath, function(csvData) {
            readCsvData(csvData);
        });
    }
    else {
        console.log("-- Data file not in local folder");

        console.log("Opening an uploading window..");
        var modal = document.getElementById("myModal");
        modal.style.display = "inline";
    }

}

function uploadData(fileData) {
    console.log("Loading data...");
    readCsvData(d3.csvParse(fileData));
}

function readCsvData(csvData) {
    
    fullData = csvData;
    console.log("-- Data loaded");

    console.log("Extact dimensions...");
    this.dimensions = [];
    var keys = d3.keys(fullData[0]);
    
    var catIdx = 0;
    var quantIdx = 0;
    var maxLength = fullData.length;
    var valueIdx;
    keys.forEach(function(k) {

        var dim = {};

        // key
        dim.key = k;
        
        // property
        var val;
        valueIdx = 0;
        while ((valueIdx < maxLength) && (typeof val === 'undefined')) {
            val = fullData[valueIdx][k];
            valueIdx++;
        }
        if (typeof val === 'undefined') return;
        if (isNaN(parseFloat(val))) {
            dim.property = "categorical";
            dim.type = "nominal";
            catIdx++;
        }
        else {
            
            var groupedData = d3.nest()
                .key(d => d[k])
                .entries(fullData);

            if (groupedData.length < 8) {
                dim.property = "categorical";
                dim.type = "ordinal";
                catIdx++;
            }
            else {
                dim.property = "quantitative";
                dim.type = "quantitative";
                quantIdx++;
            }
        }

        // is visible
        dim.isVisible = (((dim.property == "categorical") && (catIdx < 4))
            || ((dim.property == "quantitative") && (quantIdx < 6)));

        dim.domain = [];

        dimensions.push(dim);
    });
    console.log("-- Dimensions initialized");
    // console.log(dimensions);

    // loadData();
    onDataReady();
}

function loadData() {
    
    console.log("Loading data format..");
    dataFormatReader = new DataFormatReader(dataFormatFilePath, dimensions, onDataReady);
    dataFormatReader.initialize();
}

function onDataReady() {

    // dimensions = dataFormatReader.dimensions;

    fullData.forEach(function(d) {
        dimensions.forEach(function(dim) {
            if (dim.property == "categorical")
                if (!d[dim.key] || d[dim.key] == "NaN")
                    d[dim.key] = "none";
            if (dim.property == "quantitative")
                if (d[dim.key] == "NaN")
                    d[dim.key] = null;
        });
    });
    
    var visibleDim = dimensions.filter(dim => dim.isVisible);
    console.log("Inital Visibles Dimensions: " + visibleDim.map (d => d.key));

    // Preselection
    var visibleRefDim = dimensions.filter(dim => dim.isVisible && dim.property == "categorical");
    coloredDimension = visibleRefDim[0];
    console.log("Inital Colored Dimension: " + coloredDimension.key);

    var visibleCharDim = dimensions.filter(dim => dim.isVisible && dim.property == "quantitative");
    selectedDimension1 = visibleCharDim[0];
    if (visibleCharDim.length > 1)
        selectedDimension2 = visibleCharDim[1];
    else
        selectedDimension2 = visibleCharDim[0];
    
    console.log("Inital Selected Dimension 1: " + selectedDimension1.key);
    console.log("Inital Selected Dimension 2: " + selectedDimension2.key);
        
    // console.log(dimensions);
    // console.log(selectedDimension1.key);
    // console.log(selectedDimension2.key);

    try{

        var tempD = fullData.filter(d => d["DataSet"] == ["HA"]);
        console.log(tempD.length);
        if (tempD.length != 0)
            getDimensionByName("DataSet").brush = ["HA"];
    }
    catch {
        console.log("No possibilty to brush amoung the variable named 'DataSet'");
    }

//    var visibleDim = dimensions.filter(dim => dim.isVisible);
    visibleDim.forEach (function(dim, i) {
        if (i>12)
            dim.isVisible = false;
    });

    visibleDim = dimensions.filter(dim => dim.isVisible);
    console.log("Revised Visibles Dimensions: " + visibleDim.map (d => d.key));

    // selectedDimensions = [];
    // selectedDimensions.push(getDimensionByName("Cadence_AbsoluteErrorMean_PassWB"));
    // selectedDimensions.push(getDimensionByName("Cadence_RelativeErrorMean_PassWB"));
    
    // Finalise dimension initialisation
    dimensions.forEach(function(dim) {
        if (!("brush" in dim))
            dim.brush = [];
    });

    // Initilialise the view
    // coloredDimension = dataFormatReader.defaultColoredDimension;
    // shapeDimension = dataFormatReader.defaultShapeDimension;
    // selectedDimension1 = dataFormatReader.defaultSelectedDimension1;
    // selectedDimension2 = dataFormatReader.defaultSelectedDimension2;

    // updateDataAndDomains();
    
    // Launch the interface

    console.log("-- Data format loaded");

    console.log("Initializing views..");
    initializeViews();
}

function initializeViews() {
    
    body = d3.select("body");

    var bodyMargin = 16;
    var width = window.innerWidth - bodyMargin;
    var height = window.innerHeight - bodyMargin;
    var margin = 60;
    
    console.log("  Creating canvas panels..");
    var topHeight = 0.53 * height - margin;
    var bottomHeight = 0.47 * height - margin;
    var legendPanel = createPanel("Legend", 0.065 * width - margin, topHeight, body);
    var parallelAxesPanel = createPanel("Overview", 0.74 * width - margin, topHeight, body);
    var visibleDimensionsPanel = createPanel("Visible Variables", 0.20 * width - margin, topHeight, body);
    var informationPanel = createPanel("Summary", 0.35 * width - margin, 0.47 * height - margin, body);
    correlationPlotPanel = createPanel("Correlation Plot", bottomHeight, bottomHeight, body);
    blandAltmanPlotPanel = createPanel("Bland-Altman Plot", bottomHeight, bottomHeight, body);
    var datumPanel = createPanel("Selected Datum", width - ((0.35 * width) + margin + bottomHeight + margin + bottomHeight), bottomHeight, body);

    console.log("  Creating and linking canvas behaviours..");
    parallelCoordinatesBehaviour = ParallelCoordinates();
    visibleDimensionsPanelBehaviour = VisibilityPanelBehaviour();
    informationPanelBehaviour = InformationPanelBehaviour();
    correlationPlot = CorrelationPlot();
    blandAltmanPlot = BlandAltmanPlot();
    datumPanelBehaviour = DatumPanelBehaviour();
    legendPanelBehaviour = LegendPanelBehaviour();

    parallelAxesPanel.call(parallelCoordinatesBehaviour);
    visibleDimensionsPanel.call(visibleDimensionsPanelBehaviour);
    informationPanel.call(informationPanelBehaviour);
    correlationPlotPanel.call(correlationPlot);
    blandAltmanPlotPanel.call(blandAltmanPlot);
    datumPanel.call(datumPanelBehaviour);
    legendPanel.call(legendPanelBehaviour);

    console.log("  Initializing canvas with data..");

    updateCurrentData();

    dimensions.forEach(dim => dim.colorScale = getColorScale(dim, getDomain(dim, fullData)));

    // colorScale = getColorScale(coloredDimension);
    coloredDimension.order = 1;
    dimensions.filter(dim => dim.isVisible && (dim.key != coloredDimension.key))
        .sort((dimA, dimB) => d3.ascending(displayOrder[dimA.property], displayOrder[dimB.property]))
        .forEach((dim, i) => dim.order = i+2);

    updateTreeAndDisplayedData();

    parallelCoordinatesBehaviour.initialize();
    visibleDimensionsPanelBehaviour.initialize();
    informationPanelBehaviour.initialize();
    correlationPlot.initialize();
    blandAltmanPlot.initialize();
    datumPanelBehaviour.initialize();
    legendPanelBehaviour.initialize();

    console.log("-- Views initialized");

    tooltip = body.append("div")
        .style("display", "none")
        .attr("class", "tooltip");
}

// Events handlers

function onColoredDimensionChange(newColoredDimension) {

    // update model
    coloredDimension = newColoredDimension;
    // update color scale
    updateColorScale();

    if (newColoredDimension.property == "categorical") {
        
        // update axes order putting color first
        coloredDimension.order = 1;
        dimensions.filter(dim => dim.isVisible && (dim.key != coloredDimension.key))
            .sort((dimA, dimB) => d3.ascending(dimA.axis.position, dimB.axis.position))
            .forEach((dim, i) => dim.order = i+2);
        
        // update data tree
        updateTreeAndDisplayedData();
        // update axes position
        parallelCoordinatesBehaviour.updateAxesPosition();
        // redraw ribbon
        parallelCoordinatesBehaviour.updateScalesAndDisplay();
        correlationPlot.updateColoration();
        blandAltmanPlot.updateColoration();
        legendPanelBehaviour.updateColoration();
    }
    else {
        // update drawings colors
        parallelCoordinatesBehaviour.updateColoration();
        correlationPlot.updateColoration();
        blandAltmanPlot.updateColoration();
        legendPanelBehaviour.updateColoration();
    }
    
    informationPanelBehaviour.updateDisplayedData();
}

function onDim1SelectionChange(dim) {
        
    // update model
    selectedDimension1 = dim;
    
    // update selected axes
    parallelCoordinatesBehaviour.updateSelectedDimensions();
    correlationPlot.updateSelectedDimensions();
    blandAltmanPlot.updateSelectedDimensions();
}

function onDim2SelectionChange(dim) {
    
    // update model
    selectedDimension2 = dim;
    
    // update selected axes
    parallelCoordinatesBehaviour.updateSelectedDimensions();
    correlationPlot.updateSelectedDimensions();
    blandAltmanPlot.updateSelectedDimensions();
}

function onDataSelectionChange(dim, isZooming) {
    
    // recompute dataset and tree and domain
    updateCurrentData();
    updateTreeAndDisplayedData();
    updateColorScale();

    // update axes scales and display
    parallelCoordinatesBehaviour.updateScalesAndDisplay();
    correlationPlot.updateScalesAndDisplay();
    blandAltmanPlot.updateScalesAndDisplay();
    legendPanelBehaviour.updateDataSelection();
    informationPanelBehaviour.updateDisplayedData();
}

function onVisibleDimensionsChange(dim) {

    
    dim.isVisible = !dim.isVisible;

    if (dim.isVisible) {
        // update axes order
        dimensions.filter(dim => dim.isVisible && coloredDimension.key)
            .sort((dimA, dimB) => d3.ascending(dimA.axis.position, dimB.axis.position))
            .sort((dimA, dimB) => d3.ascending(displayOrder[dimA.property], displayOrder[dimB.property]))
            .forEach((dim, i) => dim.order = i+1);    
        // update dataset and tree
        updateTreeAndDisplayedData();
        // update axes position
        parallelCoordinatesBehaviour.updateAxesPosition();
        // update axis scale for the new variable
        parallelCoordinatesBehaviour.updateScalesAndDisplay();
    }
    else {
        
        // TODO what is remove colored dim !!!
        
        // reset brush
        dim.brush = [];
        // update dataset and tree
        updateCurrentData();
        updateTreeAndDisplayedData();
        // update axes order
        dimensions.filter(dim => dim.isVisible && coloredDimension.key)
            .sort((dimA, dimB) => d3.ascending(dimA.axis.position, dimB.axis.position))
            .sort((dimA, dimB) => d3.ascending(displayOrder[dimA.property], displayOrder[dimB.property]))
            .forEach((dim, i) => dim.order = i+1);
        // update axes position
        parallelCoordinatesBehaviour.updateAxesPosition();
        // update axis scale and display
        parallelCoordinatesBehaviour.updateScalesAndDisplay();
        // if a selected dim is removed hide corr and bland
        if (dim == selectedDimension1 || dim == selectedDimension2) {
            correlationPlot.hideDisplay();
            blandAltmanPlot.hideDisplay();
        }
        
    }
 
    correlationPlot.updateScalesAndDisplay();
    blandAltmanPlot.updateScalesAndDisplay();
    informationPanelBehaviour.updateDisplayedVariables();

    // if (dim.key == coloredDimension.key) {
    //     // TODO set first axes as new color
    //     onColoredDimensionChange(dim);
    // }
    // else {
    //     // update domain of new visiable or devisible?
    //     updateDataAndDomains();

    //     // Update views
    //     axesDisplayAndPositionChangedEventListeners.forEach(listener => listener.axesDisplayAndPositionChanged());
    //     dataChangedEventListeners.forEach(listener => listener.dataChanged());
    //     colorScaleChangedEventListeners.forEach(listener => listener.colorScaleChanged());
    // }
    
}

function onAxisMoved() {

    // update axes order
    dimensions.filter(dim => dim.isVisible)
        .sort((dimA, dimB) => d3.ascending(dimA.axis.position, dimB.axis.position))
        .sort((dimA, dimB) => d3.ascending(displayOrder[dimA.property], displayOrder[dimB.property]))
        .forEach((dim, i) => dim.order = i+1);
    
    if(coloredDimension.property =="categorical" && coloredDimension.order != 1) {
        // update the colored value
        dimensions.forEach(dim => {if (dim.order == 1) coloredDimension = dim;});

        // update tree data
        updateTreeAndDisplayedData();
        // update axes position
        parallelCoordinatesBehaviour.updateAxesPosition();
        // update display
        parallelCoordinatesBehaviour.updateScalesAndDisplay();
        parallelCoordinatesBehaviour.updateColoration();
        correlationPlot.updateColoration();
        blandAltmanPlot.updateColoration();
        legendPanelBehaviour.updateColoration();
    }
    else {
        // update tree data
        updateTreeAndDisplayedData();
        // update axes position
        parallelCoordinatesBehaviour.updateAxesPosition();
        // update display
        parallelCoordinatesBehaviour.updateScalesAndDisplay();
    }

    informationPanelBehaviour.updateDisplayedData();
}

function onDatumSelected(datum) {
    parallelCoordinatesBehaviour.datumSelected(datum);
    correlationPlot.datumSelected(datum);
    blandAltmanPlot.datumSelected(datum);
    datumPanelBehaviour.datumSelected(datum);
}

function onMergingStateChange() {
    
    isMerged = !isMerged;
    updateTreeAndDisplayedData();

    parallelCoordinatesBehaviour.updateLineDisplay();
    correlationPlot.updateScalesAndDisplay();
    blandAltmanPlot.updateScalesAndDisplay();
    informationPanelBehaviour.updateDisplayedData();
    legendPanelBehaviour.updateDataSelection();

}

// Other methods

function updateColorScale() {
    dimensions.filter(dim => dim.property == "quantitative").forEach(dim => dim.colorScale = getColorScale(dim, getDomain(dim, currentData)));
}

function checkFileExist(urlToFile) {

    try {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', urlToFile, false);
        xhr.send();
        return (xhr.status != "404");
    }
    catch(err) {
        return false;
    }
}

function refreshSelectedData() {
    var selections = [];
    selections = selections.concat(parallelCoordinatesBehaviour.getSelections());
    backgroundData = [];
    selectedData = currentData.filter(function(d) {
        if (selections.every(function(selection) {
            var axis = selection.axis;
            var extend = selection.extend;
            var dPos = axis.yScale(d[axis.key]);
            
            if (axis.dimension.property == "quantitative")
                return (!d[axis.key] || (extend[0] <= dPos && dPos <= extend[1]));
            return (!d[axis.key] || (extend[0] < dPos && dPos <= extend[1]));
        }))
            return true;
        else
            backgroundData.push(d);
    });
}

function computeDomain(dim, dataset) {

    // console.log(dim);

    var domain;

    if (dim.property == "categorical") {
        domain = (d3.nest()
            .key(d => d[dim.key])
            .entries(dataset)).map(d => d.key)
        
        if (dim.key == "TestRec") {
            domain = domain.sort((a, b) => a.split('_')[0].substring(1,3) - b.split('_')[0].substring(1,3));
        }
        else {

            if (dim.key == "WBDurationCategory_RS") {
                var newDomain = [];
                ['< 10 seconds', '10-30 seconds', '30-60 seconds', '60-120 seconds', '> 120 seconds', 'none']
                    .forEach(function (cat) {
                    if (d3.set(domain).has(cat))
                        newDomain.push(cat);
                });
                domain = newDomain;
            }
            else {
                domain = domain.sort((a, b) => a - b);
            }
        }
    }
    else {
        // if (dim.nature == "measured")
            var k = dim.key;
            domain = d3.extent(dataset.filter(d => (d[k] && !isNaN(d[k]) && d[k] != null)), function(d) { return +d[k]; });

        // if (dim.nature == "computed") {
        //     // if (dim.parameters.min && dim.parameters.max)
        //     var k = dim.parameters.mean;
        //     domain = d3.extent(dataset.filter(d => (d[k] && !isNaN(d[k]) && d[k] != null)), function(d) { return +d[k]; });
        // }
    }

    if (dim.type == "ordinal") {
    }

    return domain;
}
    
function getCategoricalScale(dim, dataset, range, totalMargin) {

    var scale;
    
    var isReversed = range[1] < range[0];
    var totalHeight = (isReversed ? range[0] : range[1]) - totalMargin;
    var margin = totalMargin / (dim.domain.length - 1);

    var sc = d3.scaleLinear()
            .domain([0, dataset.length])
            .range([0, totalHeight]);

    var nestedData = d3.nest()
        .key(d => d[dim.key])
        .rollup(v => v.length)
        .entries(dataset);
        
    scale = function(x) {

        var sum = range[0];
        var result;
        
        nestedData.forEach(function (n) {
            if (n.key == x)
                result = sum + (isReversed ? 0 : sc(n.value));
            sum = sum + ((isReversed ? -1 : 1) * (sc(n.value) + margin));
        });

        return result;
    }

    return scale;
}
    
// function getColorScale(dim) {

//     var scale;

//     // console.log(dim.key);
//     // console.log(dim.type);
//     if (dim.property == "categorical") {
        
//         var n = dim.domain.length;

//         if (dim.type == "nominal") {
//             scale = d3.scaleOrdinal(d3.schemeTableau10);
//         }

//         if (dim.type == "ordinal") {

//             var n = dim.domain.length;

//             if (n == 1) {
//                 scale = (d => interpolateYellBlue(0));
//             }
//             else {

//                 var colors = [];
//                 for (let i = 0; i < n; ++i) {
//                     colors.push(d3.rgb(interpolateYellBlue(i / (n - 1))));
//                 }
//                 scale = d3.scaleOrdinal(colors);
                
//             }
//         }
//     }
//     else {

//         var ls = d3.scaleSequential(interpolateYellBlue);

//         var dataset = currentData;
//         var subDataset = dataset.filter(d => d[dim.key]).map(d => +d[dim.key]);

//         var result = [];
//         var levelMax = 3;

//         var rec = function (array, coeff, pos, level) {

//             var mean = d3.mean(array);
//             var min = d3.min(array);
//             if (min == mean)
//                 return;

//             var currentLevel = level + 1;

//             result.push([mean, pos]);

//             if (currentLevel < levelMax) {
//                 rec(array.filter(v => v <= mean), coeff/2, pos - coeff/2, currentLevel);
//                 rec(array.filter(v => v > mean), coeff/2, pos + coeff/2, currentLevel);
//             }
//         };

//         rec(subDataset, 0.5, 0.5, 0);
//         result.push([d3.min(subDataset), 0]);
//         result.push([d3.max(subDataset), 1]);

//         result = result.sort((a, b) => a[0] - b[0]);

//         scale = function(v) {

//             if (!v)
//                 return nanColor;
            
//             var i = 0;
//             while ((i < result.length) && ((+v + 0.00001) >= result[i][0])) {
//                 i++;
//             }

//             if (i == result.length)
//                 i--;

//             var x0 = result[i-1][0];
//             var y0 = result[i-1][1];
//             var x1 = result[i][0];
//             var y1 = result[i][1];

//             var color0 = ls(y0);
//             var color1 = ls(y1);

//             var cs = d3.scaleLinear()
//                 .domain([x0, x1])
//                 .range([color0, color1])
//                 .interpolate(d3.interpolateHcl);

//             return cs(v);

//         }
//     }

//     return scale;
// }

function getDomain(dim, dataset) {

    var domain;

    if (dim.property == "categorical") {

        domain = (d3.nest()
            .key(d => d[dim.key])
            .entries(dataset)).map(d => d.key);

        domain = domain.sort((a, b) => a - b);
        
        // if (dim.key == "TestRec") {
        //     domain = domain.sort((a, b) => a.split('_')[0].substring(1,3) - b.split('_')[0].substring(1,3));
        // }
        // else {

        //     if (dim.key == "WBDurationCategory_RS") {
        //         var newDomain = [];
        //         ['< 10 seconds', '10-30 seconds', '30-60 seconds', '60-120 seconds', '> 120 seconds', 'none']
        //             .forEach(function (cat) {
        //             if (d3.set(domain).has(cat))
        //                 newDomain.push(cat);
        //         });
        //         domain = newDomain;
        //     }
        //     else {
        //         domain = domain.sort((a, b) => a - b);
        //     }
        // }
    }
    else {
        // if (dim.nature == "measured")
            var k = dim.key;
            domain = d3.extent(dataset.filter(d => (d[k] && !isNaN(d[k]) && d[k] != null)), function(d) { return +d[k]; });

        // if (dim.nature == "computed") {
        //     // if (dim.parameters.min && dim.parameters.max)
        //     var k = dim.parameters.mean;
        //     domain = d3.extent(dataset.filter(d => (d[k] && !isNaN(d[k]) && d[k] != null)), function(d) { return +d[k]; });
        // }
    }

    // if (dim.type == "ordinal") {
    // }

    return domain;
}

function getColorScale(dim, domain) {

    var scale;

    if (dim.property == "categorical") {

        var index = domain.indexOf('');
        if (index > -1) {
            domain.splice(index, 1);
        }

        var n = domain.length;

        if (dim.type == "nominal") {

            var colorScheme = [];

            for (let i = 0; i < domain.length; i++) {
                if (domain[i] == "none")
                    colorScheme[i] = nanColor;
                else
                    colorScheme[i] = d3.schemeTableau10[i%10];
            }

            scale = d3.scaleOrdinal()
                .domain(domain)
                .range(colorScheme);
        }

        if (dim.type == "ordinal") {

            // console.log(domain);
            // console.log(n);

            if (n == 1) {
                scale = (d => interpolateYellBlue(0));
            }
            else {

                var colors = [];
                for (let i = 0; i < n; ++i) {
                    colors.push(d3.rgb(interpolateYellBlue(i / (n - 1))));
                }
                scale = d3.scaleOrdinal()
                    .domain(domain)
                    .range(colors);
                
            }
        }
    }
    else {

        var ls = d3.scaleSequential(interpolateYellBlue);

        var dataset = currentData;
        var subDataset = dataset.filter(d => d[dim.key]).map(d => +d[dim.key]);

        var result = [];
        var levelMax = 3;

        var rec = function (array, coeff, pos, level) {

            var mean = d3.mean(array);
            var min = d3.min(array);
            if (min == mean)
                return;

            var currentLevel = level + 1;

            result.push([mean, pos]);

            if (currentLevel < levelMax) {
                rec(array.filter(v => v <= mean), coeff/2, pos - coeff/2, currentLevel);
                rec(array.filter(v => v > mean), coeff/2, pos + coeff/2, currentLevel);
            }
        };

        rec(subDataset, 0.5, 0.5, 0);
        result.push([d3.min(subDataset), 0]);
        result.push([d3.max(subDataset), 1]);

        result = result.sort((a, b) => a[0] - b[0]);

        scale = function(v) {

            if (!v)
                return nanColor;
            
            var i = 0;
            while ((i < result.length) && ((+v + 0.00001) >= result[i][0])) {
                i++;
            }

            if (i == result.length)
                i--;

            var x0 = result[i-1][0];
            var y0 = result[i-1][1];
            var x1 = result[i][0];
            var y1 = result[i][1];

            var color0 = ls(y0);
            var color1 = ls(y1);

            var cs = d3.scaleLinear()
                .domain([x0, x1])
                .range([color0, color1])
                .interpolate(d3.interpolateHcl);

            return cs(v);

        }
    }

    return scale;
}

function interpolateYellBlue(t) {

    var yellowColor = d3.schemeTableau10[5];
    var blueColor = d3.schemeTableau10[0];

    var scale = d3.scaleLinear()
        .domain([0, 1])
        .range([yellowColor, blueColor])
        .interpolate(d3.interpolateHcl);

    return scale(t);
}

function getDimensionByName(name) {
    var result;

    dimensions.forEach(function(dim) {
        if (dim.key == name) {
            result = dim;
        }
    });

    return result;
}

function showTooltip(txt) {

    var m = d3.mouse(body.node());
    tooltip
        .style("display", null)
        .style("left", m[0] + 20 + "px")
        .style("top", m[1] + 20 + "px")
        .html(txt);
}

function hideTooltip() {
    tooltip.style("display", "none");
}

// Updating current data according to brush
function updateCurrentData() {

    console.log("Updating current data according to brush");
    currentData = fullData.filter(function(d) {
        
        var isDisplayed = true;
        
        dimensions.forEach(function(dim) {
            
            var isBrushed = true;

            if (dim.brush.length !== 0) {

                switch(dim.property) {
                    case "categorical":
                        isBrushed = d3.set(dim.brush).has(d[dim.key]);
                        break;
                    case "quantitative":
                        isBrushed = !d[dim.key] || (dim.brush[0] <= d[dim.key] && d[dim.key] <= dim.brush[1]);
                        break;
                    default:
                }
            }
            else {
                dim.brush = [];
            }

            isDisplayed = isDisplayed && isBrushed;
        });

        return isDisplayed;
    });

    console.log("Updating domains according to brush and visibility");
    dimensions.forEach(function(dim) {
        dim.domain = computeDomain(dim, currentData);
    });
}

// Updating tree data and displayedData according to current data
function updateTreeAndDisplayedData() {
    
    console.log("Updating tree data according to current data");
    displayedData = [];
    treeData = [];

    var rec = function (data, tempDims) {
        
        if (data.length == 0)
            return {nodes:[]};
        
        if (tempDims.length != 0) {
        
            var node = {};

            var currentDim = tempDims[0];
            var nestedData = d3.nest()
                .key(d => d[currentDim.key])
                .entries(data);
            
            node.nodes = [];
            var values = [];
            nestedData.sort((a, b) =>  currentDim.domain.indexOf(a.key) - currentDim.domain.indexOf(b.key))
                .forEach(function(d) {
                    var childNode = rec(d.values, tempDims.slice(1));
                    childNode.dimension = currentDim;
                    childNode.category = d.key;
                    node.nodes.push(childNode);
                    values = values.concat(childNode.values);
                });
            
            // if (currentDim.order == "down") {
            //     node.nodes.reverse();
            // }
            
            node.count = values.length;
            node.nanCount = values.filter(d => !d[coloredDimension.key]).length;
            node.otherCount = values.length - node.nanCount;
            node.values = values;
            node.isLeaf = false;

            // console.log(node.nanCount);
            // console.log(node.otherCount);

            return node;
        }
        else {
            
            var leaf = {};

            leaf.count = data.length;
            leaf.nanCount = data.filter(d => !d[coloredDimension.key]).length;
            leaf.otherCount = data.length - leaf.nanCount;
            leaf.values = data;
            leaf.isLeaf = true;

            if (isMerged) {
                var meanValue = {};
                dimensions.forEach(function(dim) {
                    if(dim.property == "categorical") {
                        meanValue[dim.key] = data[0][dim.key];
                    }
                    else {
                        meanValue[dim.key] = d3.mean(data.filter(d => d[dim.key]), d => d[dim.key]);
                    }
                });
                displayedData.push(meanValue);
            }
            else {
                data.forEach(function(d) {
                    displayedData.push(d);
                });
            }
            
            return leaf;
        }
    }

    treeData = rec(currentData, dimensions.filter(dim => dim.isVisible && dim.property == "categorical")
        .sort((dimA, dimB) => d3.ascending(dimA.order, dimB.order))
        .slice(0));
}

var corrTitle;
var blandTitle;

function createPanel(title, width, height, container) {

    var canvas = container.append("div")
        .attr("class", "canvas")
        .attr("style", "width: " + width + "px; height: " + height + "px");
    
    var ul = canvas.append("ul");
    ul.append("li")
        .append("h2")
            .text(title);
    ul.append("li")
        .append("h3")
            .text(" ");

    if (title === "Summary")
        addAllColorButton(ul.append("li"));
    if (title === "Correlation Plot") {
        addCorrHistoButton(ul.append("li"));
        corrTitle = ul.selectAll("h2");
    }
    if (title === "Bland-Altman Plot") {
        addBlandHistoButton(ul.append("li"));
        blandTitle = ul.selectAll("h2");
    }

    var div = canvas.append("div")
        .attr("width", width - 10)
        .attr("height", height - 30);
    
    return div;
}

var sumButton;
function addAllColorButton(canvas) {

    function onAllVsColorButtonClicked() {
        sumIsAll = !sumIsAll;

        if(sumIsAll)
            sumButton.selectAll("text")
                .text(icon_tint);
        else
            sumButton.selectAll("text")
                .text("All");

        informationPanelBehaviour.isAllStateChanged(sumIsAll);
    }

    sumButton = canvas.append("div")
        .attr("class", "button")
        // .on("mouseover", onHover)
        // .on("mouseout", onOut)
        .on("click", onAllVsColorButtonClicked);

    sumButton.append("text")
        .attr("class", "fa")
        .text(icon_tint);

    sumButton.classed("active", true);
}

var corrButton;
function addCorrHistoButton(canvas) {

    function onCorrVsHistButtonClicked() {
        corrIsCorr = !corrIsCorr;

        if(corrIsCorr) {
            corrButton.selectAll("text")
                .text(icon_chart_bar);
            correlationPlot = CorrelationPlot();
            corrTitle.text("Correlation Plot");
        }
        else {
            corrButton.selectAll("text")
                .text(icon_chart_line);
            correlationPlot = Histogram1();
            corrTitle.text("Histogram 1");

        }
        
        correlationPlotPanel.selectAll("svg").remove();
        correlationPlotPanel.call(correlationPlot);
        correlationPlot.initialize();
    }

    corrButton = canvas.append("div")
        .attr("class", "button")
        // .on("mouseover", onHover)
        // .on("mouseout", onOut)
        .on("click", onCorrVsHistButtonClicked);

    corrButton.append("text")
        .attr("class", "fa")
        .text(icon_chart_bar);
    
    corrButton.classed("active", true);

}

var blandButton;
function addBlandHistoButton(canvas) {

    function onBlandVsHistButtonClicked() {
        blandIsBland = !blandIsBland;

        if(blandIsBland) {
            blandButton.selectAll("text")
                .text(icon_chart_bar);
            blandAltmanPlot = BlandAltmanPlot();
            blandTitle.text("Bland-Altman Plot");
        }
        else {
            blandButton.selectAll("text")
                .text(icon_chart_line);
            blandAltmanPlot = Histogram2();
            blandTitle.text("Histogram 2");
        }

        blandAltmanPlotPanel.selectAll("svg").remove();
        blandAltmanPlotPanel.call(blandAltmanPlot);
        blandAltmanPlot.initialize();
    }

    blandButton = canvas.append("div")
        .attr("class", "button")
        // .on("mouseover", onHover)
        // .on("mouseout", onOut)
        .on("click", onBlandVsHistButtonClicked);

    blandButton.append("text")
        .attr("class", "fa")
        .text(icon_chart_bar);

    blandButton.classed("active", true);
}


