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

function ParallelCoordinates() {
    
    var _width;
    var _height;
    const margin = {top: 70, right: 0, bottom: 90, left: 70};

    const scaleMargin = 10;

    var _strokeWidth;
    
    var _svg;
    var _gAxes;
    var _gRibbons;
    var _gSelectedLines;
    
    var _tempYPositions;
    
    var _renderLines;
    
    var _ribbonsDataStructure;
    var _junctionDataStructure;

    var _barUnit;
    
    var _dimensionOrder = {};
    
    var _previousBrush = [0, 0];

    var _colorationButtons;
    var _resetFilteringButtons;
    var _selectDim1Buttons;
    var _selectDim2Buttons;
    // var _selectAddDimButtons;

    const icon_tint = '\uf043';
    const icon_slash = '\uf715';
    const icon_filter = '\uf0b0';
    const icon_angle_double_right = '\uf101';
    
    const f = d3.format(".2f");
    
    // Initialization

    function parallelCoordinates(container) {

        console.log("   Creating parallel coordinates behaviour..");

        _width = container.attr("width") - margin.left - margin.right;
        _height = container.attr("height") - margin.top - margin.bottom;

        _svg = container.append("svg")
            .attr("width", _width + margin.left + margin.right)
            .attr("height", _height + margin.top + margin.bottom)
            .attr("xmlns:xhtml", "http://www.w3.org/1999/xhtml")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Initialize structure
        _gRibbons = _svg.append('g');
        _gUnselectedLines = _svg.append("g");
        _gSelectedLines = _svg.append("g");
        _gJunctions = _svg.append("g");
        
        _renderLines = renderQueue(drawLine).rate(500);
    
        _dimensionOrder["referential"] = 0;
        _dimensionOrder["characteristic"] = 1;
    }

    parallelCoordinates.initialize = function () {

        console.log("   Creating parallel coordinates behaviour..");
        
        // Initialize axes
        initializeAxes();

        _strokeWidth = d3.min([2.5/Math.pow(displayedData.length,0.3),1]);

        // console.log("   Init axes display and position");
        updateAxesDisplayAndPosition();
        updateAxesScale();
        updateDisplay();

    }
    
    // Getters
    
    parallelCoordinates.getSelections = function () {
        
        var selections = [];
        
        _gAxes.selectAll(".brush")
            .filter(function(a) {
                return d3.brushSelection(this);
            })
            .each(function(a) {
                var brushExtend = d3.brushSelection(this);          
                selections.push({
                    axis: a,
                    extend: brushExtend
                });
            // console.log(brushExtend);
            });
        
        return selections;
    }

    parallelCoordinates.getAxes = function () {
        
        var axes = _gAxes.data();
        
        return axes;
    }

    // Event
    /// Internal

    function onDragStart(axis) {

        if (!axis.dragDisabled) {
            _previousAxisPosition = d3.event.x;
        }
    }

    function onDrag(axis) {

        if (!axis.dragDisabled) {
            axis.position = d3.event.x;
            d3.select(this).attr("transform", a => "translate(" + a.position + ")");
        }
    }

    function onDragEnd(axis) {
        
        if (!axis.dragDisabled) {
            onAxisMoved();
            // updateAxesPositionData();

            // if ((axis.dimension.property == "referential") && (axis.dimension.axis.position == 0))
            //     onColoredDimensionChange(axis.dimension.key);
            // else {
            //     updateDataAndDomains();
            //     updateContent();
            // }
        }
    }

    function onBrushStart(axis) {
        
        axis.dragDisabled = true;
        
        _renderLines.invalidate();
    }

    function onBrush() {}

    function onBrushEnd(axis) {

        axis.dragDisabled = false;
        
        var brushExtend = d3.brushSelection(this);

        if (brushExtend && _previousBrush)
            if (_previousBrush[0] == brushExtend[0] && _previousBrush[1] == brushExtend[1])
                return;
        _previousBrush = brushExtend;

        if (brushExtend != null) {

            if (axis.dimension.property == "referential") {
            
                var valueExtend = invertYScale(axis, brushExtend);

                var y1 = axis.yScale(valueExtend[0]) - axis.sizeScale(axis.counts[valueExtend[0]]);
                var y2 = axis.yScale(valueExtend[1]);

                var extend = [y1, y2];

                fullDataBrushed = fullData.filter(function(d) {
                    var dPos = axis.yScale(d[axis.key]);
                    // return (!d[axis.key] || (extend[0] < dPos && dPos <= extend[1]));
                    return (extend[0] < dPos && dPos <= extend[1]);
                });

                axis.dimension.brush = computeDomain(axis.dimension, fullDataBrushed);
            }
            else {
                
                var y0, y1;
                if (axis.order == "up") {
                    y0 = brushExtend[1];
                    y1 = brushExtend[0];
                }
                else {
                    y0 = brushExtend[1];
                    y1 = brushExtend[0];
                }

                axis.minValue = axis.yScale.invert(y0);
                axis.maxValue = axis.yScale.invert(y1);

                axis.dimension.brush = [axis.minValue, axis.maxValue];
                // axis.dimension.brush = [axis.yScale.invert(y0), axis.yScale.invert(y1)];

                // update the inputs values
                // d3.selectAll(".topValue").filter(a => a.key == axis.key).attr("value", axis => axis.order == "up" ? f(axis.maxValue) : f(axis.minValue));
                // d3.selectAll(".bottomValue").filter(a => a.key == axis.key).attr("value", axis => axis.order == "up" ? f(axis.minValue) : f(axis.maxValue));
            }

            // remove the brush
            axis.brush
                .on("start", null)
                .on("brush", null)
                .on("end", null);
        
            axis.brush.move(d3.select(this), null);
            axis.brush
                .on("start", onBrushStart)
                .on("brush", onBrush)
                .on("end", onBrushEnd);

            // update the view
            onDataSelectionChange(axis, true);
        }
        
    }

    function onColorButtonClicked(axis) {

        if (!d3.select(this).classed("selected")) {
            console.log(axis.dimension.key);
            onColoredDimensionChange(axis.dimension);
        }

    }
    
    function onResetZoomButtonClicked(axis) {

        if (d3.select(this).classed("active")) {

            // Update model
            axis.dimension.brush = [];

            // Update view
            onDataSelectionChange(axis, false);
        }
    }

    function onDim1ButtonClicked(axis) {

        if (!d3.select(this).classed("selected")) {
            onDim1SelectionChange(axis.dimension);
        }

    }

    function onDim2ButtonClicked(axis) {

        if (!d3.select(this).classed("selected")) {
            onDim2SelectionChange(axis.dimension);
        }

    }

    /// External

    parallelCoordinates.updateColoration = function () {

        // Update coloring button         
        _colorationButtons.filter(axis => axis.dimension.isVisible).classed("selected", axis => axis.key == coloredDimension.key);

        updateDisplayColor();
    }

    parallelCoordinates.updateAxesPosition = function () {
        updateAxesDisplayAndPosition();
    }

    parallelCoordinates.updateScalesAndDisplay = function () {

        _colorationButtons.filter(axis => axis.dimension.isVisible).classed("selected", axis => axis.key == coloredDimension.key);


        // update the reset button
        _resetFilteringButtons.classed("active", a => a.dimension.brush.length !== 0);
        _resetFilteringButtons.classed("selected", a => a.dimension.brush.length !== 0);


        updateAxesScale();
        updateDisplay();
    }

    parallelCoordinates.updateRibbonDisplay = function () {
        updateRibbonsDisplay();
        if (isMerged) {
            updateLinesDisplay();
        }
    }

    parallelCoordinates.updateLineDisplay = function () {
        
        _tempYPositions = {};

        _barUnit = (_height - scaleMargin) / currentData.length;
        computeRibbonsAndJunctionsDataStructure(treeData, true);
        updateLinesDisplay();
    }

    parallelCoordinates.updateSelectedDimensions = function () {
        _selectDim1Buttons.filter(axis => selectedDimension1 && axis.dimension.isVisible).classed("selected", axis => axis.key == selectedDimension1.key);
        _selectDim2Buttons.filter(axis => selectedDimension2 && axis.dimension.isVisible).classed("selected", axis => axis.key == selectedDimension2.key);
    }

    // parallelCoordinates.coloredDimension.colorScaleChanged = function () {
        
    //     // Update coloring button         
    //     _colorationButtons.filter(axis => axis.dimension.isVisible).classed("selected", axis => axis.key == coloredDimension.key);

    //     updateDisplayColor();
    // }

    // parallelCoordinates.axesDisplayAndPositionChanged = function () {
    //     updateAxesDisplayAndPosition();
    //     // updateAxesScale();
    //     // updateDisplay();
    //     // updateDisplayColor();
    // }

    // parallelCoordinates.dataChanged = function () {

    //     // Update reset filtering button            
    //     _resetFilteringButtons.filter(axis => axis.dimension.isVisible).classed("active", axis => axis.dimension.brush.length != 0);
    //     _resetFilteringButtons.filter(axis => axis.dimension.isVisible).classed("selected", axis => axis.dimension.brush.length != 0);

    //     updateAxesScale();
    //     updateDisplay();
    //     // updateDisplayColor();
    // }

    // parallelCoordinates.selectedDimensionsChanged = function () {
        
    //     // Update inputs fields
    //     d3.selectAll(".topValue").filter(axis => axis.dimension.isVisible && (axis.dimension.property == "characteristic")).attr("value", axis => axis.order == "up" ? f(axis.maxValue) : f(axis.minValue));
    //     d3.selectAll(".bottomValue").filter(axis => axis.dimension.isVisible && (axis.dimension.property == "characteristic")).attr("value", axis => axis.order == "up" ? f(axis.minValue) : f(axis.maxValue));
        
    //     // Update selected dimensions buttons
    //     _selectDim1Buttons.filter(axis => selectedDimension1 && axis.dimension.isVisible).classed("selected", axis => axis.key == selectedDimension1.key);
    //     _selectDim2Buttons.filter(axis => selectedDimension2 && axis.dimension.isVisible).classed("selected", axis => axis.key == selectedDimension2.key);

    // }

    parallelCoordinates.datumSelected = function (datum) {
        d3.selectAll(".path").classed("selected", false);
        d3.selectAll(".path").filter(d => d == datum).each(function(d) {
            d3.select(this).raise();
        });
        d3.selectAll(".path").filter(d => d == datum).classed("selected", true);
    }
    
    function initializeAxes() {

        // Create axes data        
        var axesData = initAxesData();

        // console.log(axesData);
        console.log("    Link to data to axes display, add title, scale, button");
        
        // Create axes display from data
        _gAxes = _svg.selectAll(".axis")
            .data(axesData).enter()
            .append("g")
                .attr("class", "axis");
        
        // Add legend
        _gAxes.append("text")
            .attr("class", "title")
            .attr("text-anchor", "start")
            .text(a => a.label)
            .on("mouseover", a => showTooltip("Drag to change position"))
            .on("mouseout", a => hideTooltip());

        // Add inputs
        // addDomainInputs();
        
        var yPos = _height + 20;
        
        // Add direction button
        // _orderAxisButtons = addOrderAxisButton(yPos);
        // _orderAxisButtons.classed("active", true);

        // yPos += 20;
        
        // Add color button
        _colorationButtons = addColorationButton(yPos);
        _colorationButtons.filter(axis => axis.key == coloredDimension.key).classed("selected", true);
        _colorationButtons.classed("active", true);
        
        yPos += 20;
         
        // Add filter button
        _resetFilteringButtons = addResetFilteringButton(yPos);
        _resetFilteringButtons.classed("active", a => a.dimension.brush.length !== 0);
        _resetFilteringButtons.classed("selected", a => a.dimension.brush.length !== 0);

        yPos += 20;

        // Add dim 1 button
        _selectDim1Buttons = addDim1SelectionButton(yPos);
        _selectDim1Buttons.filter(axis => axis.key == selectedDimension1.key).classed("selected", true);
        _selectDim1Buttons.classed("active", true);
        
        yPos += 20;

        // Add dim 2 button
        _selectDim2Buttons = addDim2SelectionButton(yPos);
        _selectDim2Buttons.filter(axis => axis.key == selectedDimension2.key).classed("selected", true);
        _selectDim2Buttons.classed("active", true);
        
        yPos += 20;

        // Add additional dims button
        // _selectAddDimButtons = addAddDimSelectionButton(yPos);
        // _selectAddDimButtons.classed("active", true);
        // _selectAddDimButtons.filter(axis => axis.key == selectedDimension1.key).classed("active", false);
        // _selectAddDimButtons.filter(axis => axis.key == selectedDimension2.key).classed("active", false);
        // _selectAddDimButtons.filter(axis => d3.set(selectedDimensions, dim => dim.key).has(axis.key)).classed("selected", true);

        // Add drag feature
        _gAxes.call(d3.drag()
            .on("start", onDragStart)
            .on("drag", onDrag)
            .on("end", onDragEnd));


        if (coloredDimension.property == "referential") {
                        
            getRefAxes().each(function (a) {
                if (a.key == coloredDimension.key)
                    a.position = -1;
            });
        }

        
        addMergeButton();
        _mergeButton.classed("active", true);
    }

    function initAxesData() {
 
        console.log("    Initialize axes data");
        
        var axes = [];
        
        dimensions
        //.filter(dim => dim.isVisible)
        .forEach(function(dim, i) {

            var axis = {};

            // console.log(dim);

            axis.key = (dim.nature == "measured" ? dim.key : dim.parameters.mean);
            axis.label = (dim.label ? dim.label : dim.key);
            axis.dimension = dim;
            dim.axis = axis;
            axis.order = "up";
            axis.dragDisabled = false;
            // axis.domain = dim.domain;

            if (axis.dimension.property == "referential") {

                axis.averaged = false;
                // if (dim.type == "nominal" || dim.type == "ordinal")
                //     axis.yScale = getCategoricalScale(dim, currentData, [height, 0]); //// TO DO

                // axis.domain.forEach(function (cat) {
                //     var category = {};

                //     category.key = cat;
                //     category.selected = false;
                //     category.axis = axis;

                //     refCategories[cat] = category;
                // });
                
                // var nestedData = d3.nest()
                //     .key(d => d[axis.key])
                //     .rollup(v => v.length)
                //     .entries(currentData);
                
                // var total = 0;
                // axis.counts = {};
                // nestedData.forEach(function (n) {
                //     axis.counts[n.key] = n.value
                //     total = total + n.value;
                // });

                // console.log(axis.counts);
                
                // axis.sizeScale = d3.scaleLinear()
                //     .domain([0, total])
                //     .range([0, height]);
            }

            else {

                axis.position = 0;
                axis.selected = false;
                // axis.yScale = d3.scaleLinear()
                //     .domain(axis.domain)
                    // .range([height-20, 0]);
                axis.nanPosition = _height;

                axis.maxValue = d3.max(currentData, d => +d[axis.key]);
                axis.minValue = d3.min(currentData, d => +d[axis.key]);
            }

            axes.push(axis);
        });

        
        
        return axes;
    }

    // ----------------------------------------------
    
    function updateAxesDisplayAndPosition() {

        console.log("    Update axes display and position");

        _gAxes.style("visibility", "visible");

        // Update visibility
        dimensions.filter(dim => !dim.isVisible)
            .forEach(function(dim) {
                dim.axis.position = 2500;
            });
        _gAxes.filter(a => !a.dimension.isVisible)
            .attr("transform", a => "translate(" + a.position + ")")
            .style("visibility", "hidden");

        // Update scale
        var nbVisible = dimensions.filter(dim => dim.isVisible).length;
        var xScale = d3.scaleLinear()
            .domain([0, nbVisible])
            .range([0, _width]);

        // Update positions
        dimensions.filter(dim => dim.isVisible)
            .sort((dimA, dimB) => d3.ascending(dimA.order, dimB.order))
            .forEach(function(dim, i) {
                dim.axis.position = xScale(i);
            });

        _gAxes.filter(a => a.dimension.isVisible)
            .transition()
            .attr("transform", a => "translate(" + a.position + ")");
    } 

    function updateAxesScale() {
        updateAxesScaleData();
        updateAxesScaleDisplay();
        // updateNanBarDisplay();
    }

    function updateAxesScaleData() {

        console.log("    Update Axis Y scales data");

        var scaledDataset = currentData;

        // _refCategories = [];

        _gAxes.filter(a => (a.dimension.isVisible && a.dimension.property == "referential"))
            .each(function (axis) {

                axis.domain = axis.dimension.domain;

                // axis.yScale = getCategoricalScale(axis.dimension, scaledDataset, [_height, 0], scaleMargin); //// TO DO
                
                // console.log(axis.yScale);

                // var nestedData = d3.nest()
                //     .key(d => d[axis.key])
                //     .rollup(v => v.length)
                //     .entries(scaledDataset);
                
                // var total = 0;
                // axis.counts = {};
                // nestedData.forEach(function (n) {
                //     axis.counts[n.key] = n.value;
                //     total = total + n.value;
                // });
                
                // axis.sizeScale = d3.scaleLinear()
                //     .domain([0, total])
                //     .range([0, _height - scaleMargin]);

        });
        updateReferentialAxesYScale(treeData, _height, scaleMargin);

        _gAxes.filter(a => (a.dimension.isVisible && a.dimension.property == "characteristic"))
            .each(function (axis) {

                var nbNotMissing = scaledDataset.filter(d => d[axis.key]).length;
                var nbTotal = scaledDataset.length;

                var coeffNotMissing = nbNotMissing/nbTotal;

                axis.coeffNotMissing = nbNotMissing/nbTotal;

                axis.y0Axis = 0;
                axis.y1Bar = _height;

                if (coeffNotMissing == 1) {
                    axis.y1Axis = _height;
                    axis.y0Bar = _height;
                }
                else {
                    axis.y1Axis = (_height - 10) * axis.coeffNotMissing;
                    axis.y0Bar = axis.y1Axis + 10;
                }

                axis.domain = axis.dimension.domain;

                axis.yScale = d3.scaleLinear()
                    .domain(axis.domain)
                    .range([axis.y1Axis, axis.y0Axis]);
            });
    }

    function updateAxesScaleDisplay() {

        console.log("    Update Axis Y scales display");

        _gAxes.selectAll(".scale").remove();
        _gAxes.selectAll(".brush").remove();

        _gAxes.filter(a => a.dimension.isVisible)
            .sort((dimA, dimB) => d3.ascending(dimA.order, dimB.order))
            .append("g")
            .attr("class", "scale")
            .each(function(a) {
                switch(a.dimension.type) {
                    case "nominal":
                        drawCategoricalAxis(d3.select(this), a);
                        break;
                    case "ordinal":
                        drawCategoricalAxis(d3.select(this), a);
                        break;
                    case "quantitative":

                        var axis = d3.axisLeft(a.yScale);
                        axis.tickSizeOuter(0);

                        d3.select(this).call(axis);

                        break;
                    default:
                        break;
                }
            });

        _gAxes.append("g")
            .attr("class", "brush")
            .each(function(a) {
                d3.select(this).call(a.brush = d3.brushY()
                    .extent([[-10, 0], [10, a.dimension.property == "referential" ? _height : a.y1Axis]])
                    .on("start", onBrushStart)
                    .on("brush", onBrush)
                    .on("end", onBrushEnd)
                )
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16)
            .on("mouseover", a => showTooltip("Brush on the axis to filter"))
            .on("mouseout", a => hideTooltip());

    }

    function updateReferentialAxesYScale(dataTree, totalSize, margin) {

        var catSize = {};

        var rec = function(node) {

            var dimKey = node.dimension.key;
            var catKey = node.category;

            if (!(dimKey in catSize))
                catSize[dimKey] = {};
            if (!(catKey in catSize[dimKey]))
                catSize[dimKey][catKey] = 0;

            catSize[dimKey][catKey] += node.values.length;


            if (!(node.isLeaf)) {
                node.nodes.forEach(child => rec(child));
            }
        }
        dataTree.nodes.forEach(child => rec(child));

        _gAxes.filter(a => (a.dimension.isVisible && a.dimension.property == "referential"))
            .each(function (axis) {

            // var isReversed = (axis.order == "up");

            // console.log(dataTree.values.length);

            axis.sizeScale = d3.scaleLinear()
                .domain([0, dataTree.values.length])
                .range([0, totalSize - margin]);

            axis.counts = {};
            axis.domain.forEach(function (cat) {
                axis.counts[cat] = catSize[axis.dimension.key][cat];
            });

            axis.yScale = function(x) {

                var sum = totalSize;
                var result;

                var tempMargin = margin/(axis.domain.length-1);

                axis.domain.forEach(function (cat) {

                    if (x == cat)
                        result = sum;
                    sum = sum - axis.sizeScale(catSize[axis.dimension.key][cat]) - tempMargin;
                });
        
                return result;
            }
        });
    }
 
    function updateDisplay() {

        _barUnit = (_height - scaleMargin) / currentData.length;
        
        updateRibbonsDisplay();
        updateNanBarDisplay();
        updateLinesDisplay();

    }

    function updateDisplayColor() {
        // SOLVE THIS
        updateRibbonsDisplay();
        updateNanBarDisplay();
        updateLinesColor();
    }
    
    function updateRibbonsDisplay() {

        _tempYPositions = {};

        _barUnit = (_height - scaleMargin) / currentData.length;
        
        computeRibbonsAndJunctionsDataStructure(treeData, true);
        
        // Draw ribbons
        _gRibbons.selectAll(".ribbon").remove();
        
        _gRibbons.selectAll(".ribbon")
            .data(_ribbonsDataStructure.sort((a, b) => a.selected - b.selected)).enter()
            .append("path")
                .attr("class", "ribbon")
                .attr("d", r => drawRibbonPath (r))
                .attr("fill", r => (r.selected ? coloredDimension.colorScale(r.meanValue[coloredDimension.key]) : nanColor))
                .attr("opacity", 0.7)
                .attr("stroke", "none");
    }
    
    function updateNanBarDisplay() {

        _gAxes.selectAll(".bar").remove();
        
        var scaledDataset = currentData;

        _gAxes.filter(a => a.dimension.isVisible && a.dimension.property == "characteristic").append("g")
            .each(function(axis) {

                if (axis.y0Bar != axis.y1Bar) {

                    if(coloredDimension.property == "referential") {

                        var missingDataset = scaledDataset.filter(d => !d[axis.key]);
                        var nbMissingTotal = missingDataset.length;
        
                        var nestedData = d3.nest()
                            .key(d => d[coloredDimension.key])
                            .rollup(v => v.length)
                            .entries(missingDataset);

                            
                        // console.log(nestedData);

                        // var currentDim = axis.dimension;

                        axis.yBars = {};

                        // console.log(currentDim.domain);
                        // console.log(nestedData);
                        // console.log(nestedData.sort((a, b) => coloredDimension.domain.indexOf(a.key) - coloredDimension.domain.indexOf(b.key)));
        
                        var previousPos = axis.y1Bar;
                        nestedData.sort((a, b) => coloredDimension.domain.indexOf(a.key) - coloredDimension.domain.indexOf(b.key))
                        .forEach(function(n) {
                                n.pos = previousPos;
                                n.size = ((n.value / nbMissingTotal) * (axis.y1Bar - axis.y0Bar));
                                previousPos = n.pos - n.size;
                                axis.yBars[n.key] = [];
                                axis.yBars[n.key][0] = n.pos;
                                axis.yBars[n.key][1] = previousPos;
                            });

                        // console.log(nestedData);

                        var self = d3.select(this);

                        nestedData.forEach(function(n) {
                            // console.log(n.key);
                            // console.log(coloredDimension.colorScale(n.key));
                            self.append("rect")
                                // .datum(n.key)
                                .attr("class", "bar")
                                .attr("x", -5)
                                .attr("y", (n.pos - n.size))
                                .attr("width", 10)
                                .attr("height", n.size)
                                .attr("fill", n.key ? coloredDimension.colorScale(n.key) : nanColor);
                        });
        
                        // d3.select(this).selectAll()
                        //     .data(nestedData).enter()
                        //     .append("rect")
                        //         .attr("x", -5)
                        //         .attr("y", n => n.pos)
                        //         .attr("width", 10)
                        //         .attr("height", n => n.size);
                                // .attr("fill", n => _coloredDimension.colorScale(n.key));
        
                    }
                    else {
                        
                        var missingDataset = scaledDataset.filter(d => !d[axis.key]);
                        var nbMissingTotal = missingDataset.length;
                        var nbMissingMissing = missingDataset.filter(d => !d[coloredDimension.key]).length;
        
                        var meanValueMissing = d3.mean(missingDataset.filter(d => d[coloredDimension.key]), d => d[coloredDimension.key]);

                        var coeffMissingMissing = nbMissingMissing / nbMissingTotal;
                        var size1 = (1 - coeffMissingMissing) * (axis.y1Bar - axis.y0Bar);

                        axis.yBars = {};
        
                        d3.select(this).append("rect")
                            .datum(meanValueMissing)
                            .attr("class", "bar")
                            .attr("x", -5)
                            .attr("y", axis.y0Bar)
                            .attr("width", 10)
                            .attr("height", size1)
                            .attr("fill", coloredDimension.colorScale(meanValueMissing));

                        axis.yBars["missing"] = [axis.y0Bar, axis.y0Bar + size1];
        
                        d3.select(this).append("rect")
                            .attr("class", "bar")
                            .attr("x", -5)
                            .attr("y", axis.y0Bar + size1)
                            .attr("width", 10)
                            .attr("height", coeffMissingMissing * (axis.y1Bar - axis.y0Bar))
                            .attr("fill", nanColor);

                        axis.yBars["missingMissing"] = [axis.y0Bar + size1, axis.y1Bar];

                    }
                }

            });
    }

    function updateLinesDisplay() {

        dimensions.filter(dim => dim.isVisible && dim.property == "characteristic")
            .forEach(dim => _tempYPositions[dim.key] = _height);

        var refAxes = getRefAxes().data();
        var lastRefAxis = refAxes[refAxes.length - 1];

        _tempYPositionsLastRefAxis = {};
        lastRefAxis.domain.forEach(function(cat) {
            _tempYPositionsLastRefAxis[cat] = lastRefAxis.yScale(cat);
        });

        _strokeWidth = d3.min([2.5/Math.pow(displayedData.length,0.3),1]);


        var dataset = displayedData;

        _gSelectedLines.selectAll("path").remove();


        if (isMerged) {

            var charAxes = getCharAxes().data();
            var firstCharAxis = charAxes[0];

            _gSelectedLines.selectAll(".junction")
                .data(dataset).enter()
                .append("path")
                    .attr("class", "junction")
                    .attr("d", function(d, i) {

                        var width = _junctionDataStructure[i];
                                
                        var source = {};
                        source.x = lastRefAxis.position;
                        // source.y = _lastRefBarCursor[d[lastRefAxis.key]];
                        // _lastRefBarCursor[d[lastRefAxis.key]] -= width;
                        source.y = _tempYPositionsLastRefAxis[d[lastRefAxis.key]];
                        _tempYPositionsLastRefAxis[d[lastRefAxis.key]] -= width;

                        // console.log(source);
                        
                        var dest = {};
                        dest.x = firstCharAxis.position;
                        dest.y = firstCharAxis.yScale(d[firstCharAxis.key]);

                        
                        // console.log(dest);
                
                        return drawCurvedPath(source, dest, width);
                    })
                    .attr("fill", d =>  d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor)
                    .attr("stroke", 'none')
                    .attr("opacity", 0.7);
        }

        // _gSelectedLines.selectAll(".path")
        //     .data(dataset).enter();

        _renderLines(dataset);

        // _gSelectedLines.selectAll(".path")
        //     .data(dataset).enter()
        //     .append("path")
        //         .attr("class", "path")
        //         .attr("fill", "none")
        //         .attr("stroke-width", _strokeWidth)
        //         .attr("opacity", 0.3)
        //         // .attr("stroke", d => d[coloredDimension.key] ? _coloredDimension.colorScale(d[coloredDimension.key]) : nanColor)
        //         .attr("stroke", nanColor)
        //         .attr("d", d => linePath(d));

    }

    function updateLinesColor() {

        if (isMerged) {
            _gSelectedLines.selectAll(".junction")
                .attr("fill", d =>  d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor);
        }

        _gSelectedLines.selectAll(".path")
            .attr("stroke", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor);

        // _gAxes.selectAll(".bar")
        //     .attr("fill", function (d) {
        //         // console.log(d);
        //         return coloredDimension.colorScale(d);});

    }

    // ----------------------------------------------
    
    function addDomainInputs() {

        var foreignObject = _gAxes.append("g").filter(a => (a.dimension.property == "characteristic"))
            .append("foreignObject")
                .attr("x", "5")
                .attr("y", "0")
                .attr("width", "50")
                .attr("height", _height-20);

                
        const f = d3.format(".2f");

        function onEnterOrFocusout(self, axis) {
            
            self.blur();

            function updateFiltering () {
                axis.dimension.brush = [axis.minValue, axis.maxValue];

                // console.log(axis.dimension.brush);
                
                _resetFilteringButtons.filter(a => a.key == axis.key).classed("active", true);
                _resetFilteringButtons.filter(a => a.key == axis.key).classed("selected", true);
                onDataSelectionChange(axis.dimension, true);
            }

            if ((d3.select(self).classed("topValue") && (axis.order == "up")) || (d3.select(self).classed("bottonValue") && (axis.order == "down"))) {
                if (axis.maxValue != parseFloat(self.value)) {
                    axis.maxValue = parseFloat(self.value);
                    updateFiltering();
                }
            }
            else {
                if (axis.minValue != parseFloat(self.value)) {
                    axis.minValue = parseFloat(self.value);
                    updateFiltering();
                }
            }
        }

        foreignObject.append("xhtml:input")
            .attr("type", "number")
            .attr("class", "topValue")
            .style("font-size", "10px")
            .style("color", "#097DB3")
            .attr("min", axis => f(d3.min(fullData, d => d[axis.key])))
            .attr("max", axis => f(d3.max(fullData, d => +d[axis.key])))
            .attr("value", axis => f(d3.max(currentData, d => +d[axis.key])))
            .on("keyup", function(axis) {
                if(d3.event.keyCode === 32 || d3.event.keyCode === 13) {
                    onEnterOrFocusout(this, axis);
                }
            })
            .on("focusout", function(axis) {
                onEnterOrFocusout(this, axis);
            });

        foreignObject.append("xhtml:input")
            .attr("type", "number")
            .attr("class", "bottomValue")
            .style("font-size", "10px")
            .style("color", "#097DB3")
            .style("position", "absolute")
            .style("bottom", "0")
            .style("left", "0")
            .attr("min", axis => f(d3.min(fullData, d => d[axis.key])))
            .attr("max", axis => f(d3.max(fullData, d => +d[axis.key])))
            .attr("value", axis => f(d3.min(currentData, d => +d[axis.key])))
            .on("keyup", function(axis) {
                if(d3.event.keyCode === 32 || d3.event.keyCode === 13) {
                    onEnterOrFocusout(this, axis);
                }
            })
            .on("focusout", function(axis) {
                onEnterOrFocusout(this, axis);
            });
    }
            
    function addColorationButton(yPos) {

        function onHover(axis) {
            axis.dragDisabled = true;
            showTooltip("Click to color the view <br> according to this dimension");
        }

        function onOut(axis) {
            hideTooltip();
            axis.dragDisabled = false;
        }

        var iconButton = _gAxes.append("g")
            .attr("class", "button")
            .on("mouseover", onHover)
            .on("mouseout", onOut)
            .on("click", onColorButtonClicked);

        iconButton.append("circle")
            .attr("cy", yPos-5);

        iconButton.append("text")
            .attr("class", "fa")
            .attr("x", "-0.4em")
            .attr("y", yPos-1)
            .text(icon_tint);

        return iconButton;
    }
             
    function addResetFilteringButton(yPos){

        function onHover(axis) {
            axis.dragDisabled = true;
            showTooltip("Click to remove the filter");
        }

        function onOut(axis) {
            hideTooltip();
            axis.dragDisabled = false;
        }

        var iconButton = _gAxes.append("g")
            .attr("class", "button")
            .on("mouseover", onHover)
            .on("mouseout", onOut)
            .on("click", onResetZoomButtonClicked);

        iconButton.append("circle")
            .attr("cy", yPos-5);

        iconButton.append("text")
            .attr("class", "fa")
            .attr("x", "-0.55em")
            .attr("y", yPos-1)
            .style("font-size", "8px")
            .text(icon_filter);

        iconButton.append("text")
            .attr("class", "fa")
            .attr("x", "-0.65em")
            .attr("y", yPos-1)
            .style("font-size", "9px")
            .text(icon_slash);

        return iconButton;
    }
    
    function addDim1SelectionButton(yPos){

        function onHover(axis) {
            axis.dragDisabled = true;
            showTooltip("Click to select this dimension <br> as the X axis of the plots");
        }

        function onOut(axis) {
            hideTooltip();
            axis.dragDisabled = false;
        }

        var iconButton = _gAxes.filter(a => (a.dimension.property == "characteristic"))
            .append("g")
            .attr("class", "button")
            .on("mouseover", onHover)
            .on("mouseout", onOut)
            .on("click", onDim1ButtonClicked);

        iconButton.append("circle")
            .attr("cy", yPos-5);

        iconButton.append("text")
            .attr("x", "-0.3em")
            .attr("y", yPos-1.5)
            .style("font-size", "12px")
            .style("font-family", "Bree Serif")
            // .style("font-weight", "900")
            .text("1");

        return iconButton;
    }
    
    function addDim2SelectionButton(yPos){

        function onHover(axis) {
            axis.dragDisabled = true;
            showTooltip("Click to select this dimension <br> as the Y axis of the plots");
        }

        function onOut(axis) {
            hideTooltip();
            axis.dragDisabled = false;
        }

        var iconButton = _gAxes.filter(a => (a.dimension.property == "characteristic"))
            .append("g")
            .attr("class", "button")
            .on("mouseover", onHover)
            .on("mouseout", onOut)
            .on("click", onDim2ButtonClicked);

        iconButton.append("circle")
            .attr("cy", yPos-5);

        iconButton.append("text")
            .attr("x", "-0.3em")
            .attr("y", yPos-1.5)
            .style("font-size", "12px")
            .style("font-family", "Bree Serif")
            // .style("font-weight", "900")
            .text("2");

        return iconButton;
    }
    
    function addMergeButton() {

        // function onHover() {
        //     axis.dragDisabled = true;
        //     // showTooltip(onColorButtonHoverMessage(axis));
        // }

        // function onOut() {
        //     hideTooltip();
        //     axis.dragDisabled = false;
        // }

        function onMergeButtonClicked() {
            console.log("merge button clicked");
            onMergingStateChange();
            _mergeButton.classed("selected", isMerged);
        }

        _mergeButton = _svg.append("g")
            .attr("class", "button")
            .on("mouseover", a => showTooltip("Click to merge the lines <br> according to ribbons"))
            .on("mouseout", a => hideTooltip())
            .on("click", onMergeButtonClicked);

        _mergeButton.append("circle")
            .attr("cx", _width - 66)
            .attr("cy", _height/2);

        _mergeButton.append("text")
            .attr("class", "fa")
            .attr("x", _width - 70)
            .attr("y", _height/2 + 3)
            .text(icon_angle_double_right);
    }
    
    function drawCategoricalAxis(g, axis) {
        
        g.selectAll(".category").remove();

        var nestedDimensions = dimensions.filter(dim => (dim.property == "referential" && dim.isNested));

        if (nestedDimensions.length != 0 && !axis.dimension.isNested)
            return;
        
        var categories = axis.domain;

        var positions = {};
        var sizes = {};
        
        categories.forEach(function(cat) {
            
            var size = axis.sizeScale(axis.counts[cat]);
            var position = axis.yScale(cat) - size;
            
            positions[cat] = position;
            sizes[cat] = size;
        });
        // console.log(axis.counts);
        // console.log(positions);
        // console.log(sizes);

        var gCategories = g.selectAll(".category")
            .data(categories).enter()
            .append("g")
                .attr("class", "category")
                .attr("transform", function (c) { return "translate(0, " + positions[c] + ")";});

        gCategories.append("rect")
            .attr("fill", axisColor)
            .attr("x", -2)
            .attr("y", 0)
            .attr("height", c => sizes[c])
            .attr("width", 4);

        gCategories.append("text")
            .attr("transform", function(c) { return "translate(0, " + sizes[c]/2 + ")";})
            .attr("x", function(cat) {
                var n = cat.length;
                return (n * -5 - 9);
            })
            .text(function(cat) {return cat;});
    }
    
    function getRefAxes() {
        return _gAxes.filter(a => (a.dimension.isVisible && (a.dimension.property == "referential")))
            .sort(function(a, b) {
                return d3.ascending(a.position, b.position)
            });
    }
    
    function getCharAxes() {
        return _gAxes.filter(a => (a.dimension.isVisible && a.dimension.property == "characteristic"))
            .sort(function(a, b) {
                return d3.ascending(a.position, b.position)
            });
    }
    
    function computeRibbonsAndJunctionsDataStructure(tree, selected) {

        _ribbonsDataStructure = [];
        _junctionDataStructure = [];

        // var yScale = d3.scaleLinear()
        //     .domain([0, totalSize])
        //     .range([0, _height]);
        
        var rec = function (node) {
            
            var axis = node.dimension.axis;
            var width = axis.sizeScale(node.values.length);
            var category = node.category;
            
            var x = axis.position;
            
            if (!(axis.key in _tempYPositions))
                _tempYPositions[axis.key] = {};
            if (!(category in _tempYPositions[axis.key]))
                _tempYPositions[axis.key][category] = axis.yScale(category);
            
            var y = _tempYPositions[axis.key][category];
            _tempYPositions[axis.key][category] = _tempYPositions[axis.key][category] - width;

            var meanValue = {};
            _gAxes.filter(a => (a.dimension.property == "referential"))
                .each(a => meanValue[a.key] = node.values[0][a.key]);

            _gAxes.filter(a => a.dimension.property == "characteristic")
                .each(a => meanValue[a.key] = d3.mean(node.values.filter(d => d[coloredDimension.key] && d[a.key]), d => d[a.key]));

            if (!node.isLeaf) {
                
                var tempY = y;
                node.nodes.forEach(function (n) {
                    
                    var destination = rec (n);

                    var nbNaN = n.values.filter(d => !d[coloredDimension.key]).length;
                    var nanWidth = axis.sizeScale(nbNaN);
                    var otherWidth = axis.sizeScale(n.values.length - nbNaN);
                    
                    // _ribbonsDataStructure.push({x0: x, y0: tempY, x1: destination.x, y1: destination.y, width: destination.width, meanValue: destination.meanValue, selected: selected});
                    _ribbonsDataStructure.push({x0: x, y0: tempY, x1: destination.x, y1: destination.y, width: nanWidth, meanValue: destination.meanValue, selected: false});
                    _ribbonsDataStructure.push({x0: x, y0: tempY-nanWidth, x1: destination.x, y1: destination.y-nanWidth, width: otherWidth, meanValue: destination.meanValue, selected: selected});
                    tempY = tempY - destination.width;
                                        
                });
            }
            else {

                if (isMerged) {
                    _junctionDataStructure.push(width);
                }
            }
            
            return {x: x, y: y, width: width, meanValue: meanValue};
        }
        
        tree.nodes.forEach(function(n) {
            rec(n);
        });
    }

    function col2num(d) {
        if (!d[coloredDimension.key]) return 1;
        return 2;
    }
    
    function sortByIs(a, b) {
       return col2num(a) - col2num(b);
    }

    function drawRibbonPath(r) {
        var path = [];

        path.push("M");
        path.push([r.x0, r.y0]);
        path.push("L");
        path.push([r.x1, r.y1]);
        path.push("v");
        path.push(-r.width);
        path.push("L");
        path.push([r.x0, r.y0-r.width]);
        path.push("Z");

        return (path).join("");
    }

    function drawCurvedPath(source, destination, width) {
        var path = [];
        
        var x0, y0, x, y;

        path.push("M");
        path.push([source.x, source.y]);
        
        x0 = source.x;
        y0 = source.y;
        x = destination.x;
        y = destination.y;
        
        var cp1x = x - 0.88*(x-x0);
        var cp1y = y0;
        var cp2x = x - 0.12*(x-x0);
        var cp2y = y;
        
        path.push("C");
        path.push(cp1x);
        path.push(" ");
        path.push(cp1y);
        path.push(" ");
        path.push(cp2x);
        path.push(" ");
        path.push(cp2y);
        path.push(" ");
        path.push(x);
        path.push(" ");
        path.push(y);
        
        x0 = x;
        y0 = y - 3;
        x = source.x;
        y = source.y - width;
        
        var cp1x = x - 0.88*(x-x0);
        var cp1y = y0;
        var cp2x = x - 0.12*(x-x0);
        var cp2y = y;
        
        path.push("C");
        path.push(cp1x);
        path.push(" ");
        path.push(cp1y);
        path.push(" ");
        path.push(cp2x);
        path.push(" ");
        path.push(cp2y);
        path.push(" ");
        path.push(x);
        path.push(" ");
        path.push(y);
        
        path.push("Z");

        return (path).join("");
    }
    
    function drawLine(datum) {

        _gSelectedLines.append("path")
            .datum(datum)
            .attr("class", "path")
            .attr("fill", "none")
            .attr("stroke-width", _strokeWidth)
            .attr("opacity", 0.3)
            .attr("stroke", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor)
            .attr("d", d => linePath(d));
    }

    function linePath(d) {
        
        var path = [];
        
        path.push("M");

        if (!isMerged) {
            var refAxes = getRefAxes().data();
            var lastRefAxis = refAxes[refAxes.length - 1];

            var x0 = lastRefAxis.position;
            var y0 = _tempYPositionsLastRefAxis[d[lastRefAxis.key]];
            _tempYPositionsLastRefAxis[d[lastRefAxis.key]] -= _barUnit;

            path.push([x0, y0]);
            path.push("L");
        }

        _gAxes.filter(a => (a.dimension.isVisible && a.dimension.property == "characteristic"))
            .sort(function(a, b) {return d3.ascending(a.dimension.order, b.dimension.order)})
            .each(function (axis, i) {
        
            val = d[axis.key];

            var xn = axis.position;
            var yn = 0;

            if(!val) {

                yn = _tempYPositions[axis.key];
                _tempYPositions[axis.key] -= _barUnit;
            }
            else {
                yn = axis.yScale(val);
            }

            path.push([xn, yn]);
            path.push("L");
        });

        // console.log(path);

        path.pop(); 
        
        return path.join(""); 
    }

    function invertYScale(axis, brushExtend) {
        
        var extend = [];
        
        if (axis.dimension.type == "nominal" || axis.dimension.type == "ordinal") {
            
            var min = _height;
            axis.domain.forEach(function(cat) {
                var pos = axis.yScale(cat);
                var m = Math.abs(pos - brushExtend[1]);
                if (m < min) {
                    min = m;
                    extend[1] = cat;
                }
            });
            
            min = _height;
            axis.domain.slice(0).reverse().forEach(function(cat) {
                
//                if (cat == extend[1]) {
//                    extend[0] = extend[1];
//                    min = 0;
//                }
                var pos = axis.yScale(cat) - axis.sizeScale(axis.counts[cat]);
                var m = Math.abs(pos - brushExtend[0]);
                if (m < min) {
                    min = m;
                    extend[0] = cat;
                }
            });
        }
        if (axis.dimension.type == "quantitative") {
            extend[0] = axis.yScale.invert(brushExtend[0]);
            extend[1] = axis.yScale.invert(brushExtend[1]);
        }
        
        return extend;
    }
    
    











































    // parallelCoordinates.isBackgroundVisibleChanged = function() {

    //     updateBackground();
    // }
    
    // parallelCoordinates.isDataAveragedChanged = function() {
        
    //     var currentDim = getDimensionFromName(value);
    //     currentDim.averaged = checked;
        
    //     var nestedDimensions = dimensions.filter(dim => (dim.type == types["Ordinal"] && dim.averaged));
        
    //     if (nestedDimensions.length == 0) {
    //         currentData = currentData;
    //         updateSelection();
    //         updateDisplay();
    //         return;
    //     }
        
    //     var deepNesting = function (data, dimList) {
            
    //         if (dimList.length == 0) {
    //             var m = {};
    //             dimensions.forEach(function(dim) {
    //                 if (dim.type == types["Number"])
    //                     m[dim.key] = d3.mean(data, v => v[dim.key]);
    //                 else
    //                     m[dim.key] = null;
    //             });
    //             nestedDimensions.forEach(function(dim) {
    //                 m[dim.key] = data[0][dim.key];
    //             });
    //             return [m];
    //         }
            
    //         var nestedData = d3.nest()
    //             .key(d => d[dimList[0].key])
    //             .entries(data);
            
    //         var result = [];
    //         nestedData.forEach(function(d) {
    //             var m = deepNesting(d.values, dimList.slice(1));
    //             result = result.concat(m);
    //         });
            
    //         return result;
    //     }
        
    //     currentData = deepNesting(currentData, nestedDimensions.slice(0));
        
    //     updateSelection();
    //     updateDisplay();
    // }
    
//    parallelCoordinates.onBackgroundVisibilityChange = function() {
//        
//        if (checked) {
//            backgroundCanvas.style("display", "none");
//        }
//        else {
//            backgroundCanvas.style("display", "block");
//        }
//    }

//    parallelCoordinates.onDimensionsChange = function() {
//        var dim = getDimensionFromName(value);
//        dim.visibility = checked;
//        
//
//        visibleDimensions = dimensions.filter(dim => dim.visibility);
//        refreshAxes();
//        
//        _svg.selectAll(".axis .brush")
//            .filter(function(d) {
//                return (d3.brushSelection(this) && d == dim);
//            })
//            .each(function(d) {
//                d3.select(this).call(d.brush.move, null)
//            });
//        updateSelection();
//        
//        updateBackground();
//        updateDisplay();
//    }
    return parallelCoordinates;        

}