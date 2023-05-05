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

function BlandAltmanPlot () {

    var _width;
    var _height;

    var _gPlot;
    var _warningMessage;

    var _xFun;
    var _yFun;
    
    var _xScale;
    var _yScale;
    
    const margin = {top: 5, right: 5, bottom: 60, left: 60};

    function blandAltmanPlot(container) {

        _width = container.attr("width") - margin.left - margin.right;
        _height = container.attr("height") - margin.top - margin.bottom;

        // Create svg
        var svg = container.append("svg")
            .attr("width", _width + margin.left + margin.right)
            .attr("height", _height + margin.top + margin.bottom);

        _warningMessage = svg.append("text")
            .attr("transform", "translate(" + (_width + margin.left + margin.right)/2 + "," + (_height + margin.top + margin.bottom)/2 + ")")
            .style("text-anchor", "middle")
            .text("Select two visible variables");

        _gPlot = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        _warningMessage.attr("visibility", "hidden");

        _xFun = function(d, dim1, dim2) {
            return (d[dim1.key] && d[dim2.key] ? (+d[dim1.key] + +d[dim2.key]) / 2 : NaN);
        }
    
        _yFun = function(d, dim1, dim2) {
            return (d[dim1.key] && d[dim2.key] ? +d[dim1.key] - +d[dim2.key] : NaN);
        }
    }
    
    // Init

    blandAltmanPlot.initialize = function () {
        
        
        if (!selectedDimension1 || !selectedDimension2) {
            _warningMessage.attr("visibility", "visible");
            _gPlot.attr("visibility", "hidden");
        }
        else {
            updateScales();
            updateAxes();
            updateLines();
            updatePointsDisplay();
            updatePointsColor();
            updateHistograms();
        }
    }

    // Event

    /// Internal
    function onClick(d) {

        if (!d3.select(this).classed("selected"))
            onDatumSelected(d);
        else
            onDatumSelected(null);
    }
    
    /// External   

    
    blandAltmanPlot.updateColoration = function () {
        updatePointsColor();
    }

    blandAltmanPlot.hideDisplay = function () {
        _warningMessage.attr("visibility", "visible");
        _gPlot.attr("visibility", "hidden");
    }

    blandAltmanPlot.updateScalesAndDisplay = function () {
        updateScales();
        updateAxes();
        updateLines();
        updatePointsDisplay();
        updateHistograms();
    }

    blandAltmanPlot.updateSelectedDimensions = function () {

        if (selectedDimension1.isVisible && selectedDimension2.isVisible) {
            _warningMessage.attr("visibility", "hidden");
            _gPlot.attr("visibility", "visible");
        }

        updateScales();
        updateAxes();
        updateLines();
        updatePointsDisplay();
        updateHistograms();
    }

    blandAltmanPlot.datumSelected = function(datum) {

        _gPlot.selectAll('.point').classed("selected", false);
        _gPlot.selectAll(".point").filter(d => d == datum).classed("selected", true);
        
    }

    // Method

    function updateScales() {
        
        var dataset = displayedData;

        var data2 = dataset.map(d => _yFun(d, selectedDimension1, selectedDimension2));
        var mean = d3.mean(data2);
        var deviation = d3.deviation(data2);
        
        // Update x scale
        _xScale = d3.scaleLinear()
            .domain(d3.extent(dataset.map(d => _xFun(d, selectedDimension1, selectedDimension2))))
            .range([0, _width]);
        
        // Update y scale
        var domain = d3.extent(dataset.map(d => _yFun(d, selectedDimension1, selectedDimension2)));
        // console.log(domain);
        // console.log(mean-(3*deviation));
        // console.log(mean+(3*deviation));
        domain[0] = d3.min([domain[0], mean-(3*deviation)]);
        domain[1] = d3.max([domain[1], mean+(3*deviation)]);
        // console.log(domain);
        _yScale = d3.scaleLinear()
            .domain(domain)
            .range([_height, 0]);

    }
    
    function updateAxes() {
        
        // Remove existing axes
        _gPlot.selectAll(".axis").remove();
        
        // Update x axis
        _gPlot.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + _height + ")")
            .call(d3.axisBottom(_xScale))
            .append("text")
                .attr("x", _width/2)
                .attr("y", 40)
                .text("Mean of " + (selectedDimension1.label ? selectedDimension1.label : selectedDimension1.key)
                + " and "
                + (selectedDimension2.label ? selectedDimension2.label : selectedDimension2.key));

        // Update y axis
        _gPlot.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(_yScale))
            .append("text")
                .attr("text-anchor", "middle")
                .attr("x", -_height/2)
                .attr("y", -40)
                .attr("transform", "rotate(-90)")
                .text("Diff. of " + (selectedDimension1.label ? selectedDimension1.label : selectedDimension1.key)
                + " and "
                + (selectedDimension2.label ? selectedDimension2.label : selectedDimension2.key));
    }
    
    function updatePointsDisplay() {
        
        var dataset = displayedData;
        
        // Remove existing points
        _gPlot.selectAll(".point").remove();
    
        // Update pointdots
        _gPlot.selectAll(".point")
            .data(dataset.filter(d => d[selectedDimension1.key] && d[selectedDimension2.key] && typeof d[selectedDimension1.key] !== 'undefined' && typeof d[selectedDimension2.key] !== 'undefined'))
            .enter()
            .append("circle")
                .attr("class", "point")
                .attr("cx", function(d) { return _xScale(_xFun(d, selectedDimension1, selectedDimension2)); })
                .attr("cy", function(d) { return _yScale(_yFun(d, selectedDimension1, selectedDimension2)); })
                .attr("fill", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor)
                .attr("opacity", 0.7)
                .attr("r", 2)
                .on("click", onClick);
    }
    
    function updatePointsColor() {
        
        // Update pointdots
        _gPlot.selectAll(".point")
            .attr("fill", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor);
    }

    function updateLines() {

        // Remove existing lines
        _gPlot.selectAll(".line").remove();
        _gPlot.selectAll(".legend").remove();

        var dataset = displayedData;

        var data1 = dataset.map(d => _xFun(d, selectedDimension1, selectedDimension2));
        var data2 = dataset.map(d => _yFun(d, selectedDimension1, selectedDimension2));

        var mean = d3.mean(data2);
        var deviation = d3.deviation(data2);
        var upperLimit = mean + (1.96 * deviation);
        var lowerLimit = mean - (1.96 * deviation);

        const f = d3.format(".2f");

        // Lines

        /// Identity
        _gPlot.append("path")
            .attr('class', 'line')
            .attr('stroke', 'lightgrey')
            .attr('d', d3.line()([[0, _yScale(0)], [_width, _yScale(0)]]));

        /// Biais
        var meanLine = d3.line()
            .x(x => _xScale(x))
            .y(_yScale(mean));

        _gPlot.append("path")
            .datum([d3.min(data1), d3.max(data1)])
            .attr('class', 'line')
            .attr('stroke', 'grey')
            .attr('d', meanLine);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", _width)
            .attr("y", _yScale(mean) - 5)
            .attr("text-anchor", "end")
            .style("font-size", "10px")
            .text(f(mean) + " (mean diff.)");

        /// Upper limit
        var sdTopLine = d3.line()
        .x(x => _xScale(x))
        .y(_yScale(upperLimit));

        _gPlot.append("path")
        .datum([d3.min(data1), d3.max(data1)])
            .attr('class', 'line')
            .attr('stroke', 'grey')
            .attr('stroke-dasharray', '4 4')
            .attr('d', sdTopLine);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", _width)
            .attr("y", _yScale(upperLimit) - 5)
            .attr("text-anchor", "end")
            .style("font-size", "10px")
            .text(f(upperLimit) + " (+1.96SD)");
        
        /// Lower limit
        var sdBottomLine = d3.line()
            .x(x => _xScale(x))
            .y(_yScale(lowerLimit));

        _gPlot.append("path")
        .datum([d3.min(data1), d3.max(data1)])
            .attr('class', 'line')
            .attr('stroke', 'grey')
            .attr('stroke-dasharray', '4 4')
            .attr('d', sdBottomLine);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", _width)
            .attr("y", _yScale(lowerLimit) - 5)
            .attr("text-anchor", "end")
            .style("font-size", "10px")
            .text(f(lowerLimit) + " (-1.96SD)");

        // Legend

        /// Nb of points
        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", _width - 40)
            .attr("y", _height - 20)
            .style("font-size", "10px")
            .on("mouseover", a => showTooltip("Number of elements"))
            .on("mouseout", hideTooltip)
            .text("nb. " + dataset.length);

        /// Biais
        _gPlot.append("line")
            .attr('class', 'line')
            .attr('stroke', 'grey')
            .attr('x1', 20)
            .attr('x2', 40)
            .attr('y1', 20)
            .attr('y2', 20);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", 50)
            .attr("y", 23)
            .style("font-size", "10px")
            .text("bias");

        /// LoA
        _gPlot.append("line")
            .attr('class', 'line')
            .attr('stroke', 'grey')
            .attr('stroke-dasharray', '4 4')
            .attr('x1', 20)
            .attr('x2', 40)
            .attr('y1', 35)
            .attr('y2', 35);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", 50)
            .attr("y", 38)
            .style("font-size", "10px")
            .text("95% limits of agreement");

        /// Identity
        _gPlot.append("line")
            .attr('class', 'line')
            .attr('stroke', 'lightgrey')
            .attr('x1', 20)
            .attr('x2', 40)
            .attr('y1', 50)
            .attr('y2', 50);

        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", 50)
            .attr("y", 53)
            .style("font-size", "10px")
            .text("identify");
    }

    function updateHistograms() {
        
        var histData1 = getHistogramData(_xFun, _xScale);
        var histData2 = getHistogramData(_yFun, _yScale);
        var max = d3.max([d3.max(histData1, d => d.length), d3.max(histData2, d => d.length)]);
        var histScale = getHistogramScale(max);
        
        // Remove existing bars
        _gPlot.selectAll(".barX").remove();
        _gPlot.selectAll(".barY").remove();
        
        // Update bars
        _gPlot.selectAll(".barX")
            .data(histData1)
            .enter()
            .append("rect")
                .attr("class", "barX")
                .attr("fill", "#ccc")
                .attr("transform", function(d) { return "translate(" + _xScale(d.x1) + ", " + (_height - 5 - histScale(d.length)) + ")"; })
                .attr("width", 5)
                .attr("height", function(d) { return histScale(d.length); })
                .style("opacity", 0.6);

        _gPlot.selectAll(".barY")
            .data(histData2)
            .enter()
            .append("rect")
                .attr("class", "barY")
                .attr("fill", "#ccc")
                .attr("transform", function(d) { return "translate(5, " + _yScale(d.x1) + ")"; })
                .attr("width", function(d) { return histScale(d.length); })
                .attr("height", 5)
                .style("opacity", 0.6);
    }

    function getHistogramData(fun, scale) {

        var dataset = displayedData;

        var histogram = d3.histogram()
            .value(function(d) { return fun(d, selectedDimension1, selectedDimension2); })
            .domain(scale.domain())
            .thresholds(scale.ticks(30));

        return histogram(dataset);      
    }
    
    function getHistogramScale(max) {

        var histScale = d3.scaleLinear()
            .domain([0, max])
            .range([0, 33]);

        return histScale; 
    }

    return blandAltmanPlot;
}