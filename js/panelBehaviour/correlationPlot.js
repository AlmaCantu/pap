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

function CorrelationPlot () {
    
    var _width;
    var _height;

    var _gPlot;
    var _warningMessage;
    
    var _xScale;
    var _yScale;

    var linkButtonIcon;

    
    const icon_link = '\uf0c1';
    const icon_unlink = '\uf127';

    var axesLinked = false;

    const margin = {top: 5, right: 5, bottom: 60, left: 60};

    // Initialization

    function correlationPlot(container) {

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
    }

    correlationPlot.initialize = function () {

        // Draw linking button
        var linkButton = _gPlot.append("g")
            .attr("class", "button active")
            .attr("transform", "translate( -40 ," + (_height + 40) + ")")
            .on("click", onLinkClick);

        linkButtonIcon = linkButton.append("text")
            .attr("class", "fa")
            .text(icon_unlink);

        updateScales();
        updateAxes();
        updateLines();
        updatePointsDisplay();
        updatePointsColor();
        updateHistograms();
    }

    // Event
    /// Internal
    function onClick(d) {

        if (!d3.select(this).classed("selected"))
            onDatumSelected(d);
        else
            onDatumSelected(null);
    }

    function onLinkClick(d) {
        axesLinked = !axesLinked;

        if (axesLinked)
            linkButtonIcon.text(icon_link);
        else
            linkButtonIcon.text(icon_unlink);
        
        updateScales();
        updateAxes();
        updatePointsDisplay();
        updateLines();
        
    }
    
    /// External

    correlationPlot.updateColoration = function () {
        updatePointsColor();
    }

    correlationPlot.hideDisplay = function () {
        _warningMessage.attr("visibility", "visible");
        _gPlot.attr("visibility", "hidden");
    }

    correlationPlot.updateScalesAndDisplay = function () {
        updateScales();
        updateAxes();
        updateLines();
        updatePointsDisplay();
        updateHistograms();
    }

    correlationPlot.updateSelectedDimensions = function () {

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
    
    correlationPlot.datumSelected = function(datum) {

        _gPlot.selectAll('.point').classed("selected", false);
        _gPlot.selectAll(".point").filter(d => d == datum).classed("selected", true);
        
    }

    // Method

    function updateScales() {
        
        var dataset = displayedData;

        var xExtend = d3.extent(dataset.filter(d => d[selectedDimension1.key]).map(d => +d[selectedDimension1.key]));
        var yExtend = d3.extent(dataset.filter(d => d[selectedDimension2.key]).map(d => +d[selectedDimension2.key]));

        var xMin, xMax, yMin, yMax;

        if (axesLinked) {
            var min = d3.min([xExtend[0], yExtend[0]]);
            var max = d3.max([xExtend[1], yExtend[1]]);

            xMin = min;
            xMax = max;
            yMin = min;
            yMax = max;
        }
        else {
            xMin = xExtend[0];
            xMax = xExtend[1];
            yMin = yExtend[0];
            yMax = yExtend[1];
        }
        
        // Update x scale
        var k = selectedDimension1.key;
        _xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([0, _width]);
        
        // Update y scale
        k = selectedDimension2.key;
        _yScale = d3.scaleLinear()
            .domain([yMin, yMax])
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
                .text(selectedDimension1.label ? selectedDimension1.label : selectedDimension1.key);

        // Update y axis
        _gPlot.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(_yScale))
            .append("text")
                .attr("text-anchor", "middle")
                .attr("x", -_height/2)
                .attr("y", -40)
                .attr("transform", "rotate(-90)")
                .text(selectedDimension2.label ? selectedDimension2.label : selectedDimension2.key);
    }
    
    function updatePointsDisplay() {
        
        var dataset = displayedData;
        
        // Remove existing points
        _gPlot.selectAll(".point").remove();
        
        // Update points
        _gPlot.selectAll(".point")
            .data(dataset.filter(d => d[selectedDimension1.key] && d[selectedDimension2.key] && typeof d[selectedDimension1.key] !== 'undefined' && typeof d[selectedDimension2.key] !== 'undefined'))
            .enter()
            .append("circle")
                .attr("class", "point")
                .attr("cx", d => _xScale(+d[selectedDimension1.key]))
                .attr("cy", d => _yScale(+d[selectedDimension2.key]))
                .attr("fill", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor)
                .attr("opacity", 0.7)
                .attr("r", 2)
                .on("click", onClick);
    }
    
    function updatePointsColor() {
        
        _gPlot.selectAll(".point")
            .attr("fill", d => d[coloredDimension.key] ? coloredDimension.colorScale(d[coloredDimension.key]) : nanColor);
    }

    function updateLines() {

        
        // Remove existing lines
        _gPlot.selectAll(".line").remove();
        _gPlot.selectAll(".legend").remove();
        
        var dataset = displayedData;

        // var data1 = dataset.filter(d => d[selectedDimension1.key] && d[selectedDimension2.key] && typeof d[selectedDimension1.key] !== 'undefined' && typeof d[selectedDimension2.key] !== 'undefined')
        //     .map(d => +d[selectedDimension1.key]);
        // var data2 = dataset.filter(d => d[selectedDimension2.key] && d[selectedDimension2.key] != "NaN").map(d => +d[selectedDimension2.key]);

        const f = d3.format(".2f");
        
        if (axesLinked) {

            var timeSerie = dataset.filter(d => d[selectedDimension1.key] && d[selectedDimension2.key] && typeof d[selectedDimension1.key] !== 'undefined' && typeof d[selectedDimension2.key] !== 'undefined')
                .map(d => [+d[selectedDimension1.key], +d[selectedDimension2.key]]);

            var [coeff, correlatedIntercept, correlatedTrend] = pearsonCorrelation(timeSerie);


            if (!coeff)
                return;

            var xExtend = d3.extent(dataset.filter(d => d[selectedDimension1.key]).map(d => +d[selectedDimension1.key]));
            var yExtend = d3.extent(dataset.filter(d => d[selectedDimension2.key]).map(d => +d[selectedDimension2.key]));

            var xMin, xMax, yMin, yMax;

            xMin = xExtend[0];
            xMax = xExtend[1];
            yMin = yExtend[0];
            yMax = yExtend[1];

            // Lines
            
            /// Identity
            _gPlot.append("line")
                .attr('class', 'line')
                .attr('stroke', 'lightgrey')
                .attr('x1', 0)
                .attr('x2', _width)
                .attr('y1', _height)
                .attr('y2', 0);

            /// Linear regression
            _gPlot.append("line")
                .attr('class', 'line')
                .attr('stroke', 'grey')
                .attr('x1', _xScale(xMin))
                .attr('x2', _xScale(xMax))
                .attr('y1', _yScale(correlatedTrend*yMin+correlatedIntercept))
                .attr('y2', _yScale(correlatedTrend*yMax+correlatedIntercept));

            // Legend

            /// Pearson coefficient
            _gPlot.append("text")
                .attr('class', 'legend')
                .attr("x", 20)
                .attr("y", 20)
                .style("font-size", "10px")
                .on("mouseover", a => showTooltip("Pearson coefficient"))
                .on("mouseout", hideTooltip)
                .text("r = " + f(coeff));

            /// Linear regression
            _gPlot.append("line")
                .attr('class', 'line')
                .attr('stroke', 'grey')
                .attr('x1', 20)
                .attr('x2', 40)
                .attr('y1', 35)
                .attr('y2', 35);
            var equationLabel = "y = " + f(correlatedIntercept) + " + " + f(correlatedTrend) + " * x";
            _gPlot.append("text")
                .attr('class', 'legend')
                .attr("x", 50)
                .attr("y", 38)
                .style("font-size", "10px")
                .text("linear regression: " + equationLabel);
   
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
                .text("identity");
        }

        /// Nb of points
        _gPlot.append("text")
            .attr('class', 'legend')
            .attr("x", _width - 40)
            .attr("y", _height - 20)
            .style("font-size", "10px")
            .on("mouseover", a => showTooltip("Number of elements"))
            .on("mouseout", hideTooltip)
            .text("nb. " + dataset.length);
    }

    function updateHistograms() {
        
        var histData1 = getHistogramData(selectedDimension1, _xScale);
        var histData2 = getHistogramData(selectedDimension2, _yScale);
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

    function getHistogramData(selectedDimension, scale) {

        var dataset = displayedData;

        var histogram = d3.histogram()
            .value(function(d) { return d[selectedDimension.key]; })
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

    function pearsonCorrelation(timeSerie) {
        
        var serieLength = timeSerie.length;

        var y1Sum = 0;
        var squareY1Sum = 0;
        var y2Sum = 0;
        var squareY2Sum = 0;
        // below sums are for trend lines and correlation
        var y1Y2Sum = 0;
        
        timeSerie.forEach(function(d){
            var dy1 = d[0];
            var dy2 = d[1];
            y1Sum += dy1;
            squareY1Sum += Math.pow(dy1, 2);
            y2Sum += dy2;
            squareY2Sum += Math.pow(dy2, 2);
            y1Y2Sum += (dy1)*(dy2);
        });
        
        var y1Mean = y1Sum/serieLength;
        var y2Mean = y2Sum/serieLength;
        var y1Variance = squareY1Sum/serieLength - Math.pow(y1Mean, 2);
        var y2Variance = squareY2Sum/serieLength - Math.pow(y2Mean, 2);
        var y1StdDev = Math.pow(y1Variance, 0.5)
        var y2StdDev = Math.pow(y2Variance, 0.5)
        
        var y1Y2Covariance = y1Y2Sum/serieLength - y1Mean*y2Mean;
        var correlatedTrend = y1Y2Covariance/(y1Variance);
        var correlatedIntercept = y2Mean - correlatedTrend*y1Mean;
        
        var correleationCoefficient = y1Y2Covariance/(y1StdDev*y2StdDev);

        return [correleationCoefficient, correlatedIntercept, correlatedTrend];
    }

    return correlationPlot;
}