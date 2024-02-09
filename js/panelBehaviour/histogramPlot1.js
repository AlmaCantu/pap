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

function Histogram1 () {

    var _width;
    var _height;

    var _gPlot;
    
    var _xScale;
    var _yScale;

    var _gSelectedBins;
    var _gUnselectedBins;

    var _bins;
    var _binsList;

    const margin = {top: 5, right: 5, bottom: 60, left: 60};
        
    var nbTicks = 70;

    function histogram1(container) {

        _width = container.attr("width") - margin.left - margin.right;
        _height = container.attr("height") - margin.top - margin.bottom;
        
        // Create svg
        var svg = container.append("svg")
        .attr("width", _width + margin.left + margin.right)
        .attr("height", _height + margin.top + margin.bottom);

        _warningMessage = svg.append("text")
            .attr("transform", "translate(" + (_width + margin.left + margin.right)/2 + "," + (_height + margin.top + margin.bottom)/2 + ")")
            .style("text-anchor", "middle")
            .text("Select a visible dimension");

        _gPlot = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        _warningMessage.attr("visibility", "hidden");

        _gUnselectedBins = _gPlot.append("g");
        _gSelectedBins = _gPlot.append("g");

    }
    
    // Init

    histogram1.initialize = function () {
        
        if (!selectedDimension1.isVisible) {
            _warningMessage.attr("visibility", "visible");
            _gPlot.attr("visibility", "hidden");
        }
        else {
            // updateColorScale(); 
            updateYScale();        
            updateYAxis();      
            updatehistogramData();
            updateXScale();
            updateXAxis();
            updateBins();
        }
    }
    
    // Event

    /// External
    
    histogram1.updateColoration = function() {
        updateYScale();        
        updateYAxis();       
        updatehistogramData();
        updateXScale();
        updateXAxis();
        updateBins();
    }

    histogram1.hideDisplay = function () {
        _warningMessage.attr("visibility", "visible");
        _gPlot.attr("visibility", "hidden");
    }

    histogram1.updateScalesAndDisplay = function() {       
        
        updateYScale();        
        updateYAxis();       
        updatehistogramData();
        updateXScale();
        updateXAxis();
        updateBins();
    }

    histogram1.updateSelectedDimensions = function() {

        if (selectedDimension1.isVisible) {
            _warningMessage.attr("visibility", "hidden");
            _gPlot.attr("visibility", "visible");
        }
        
        updateYScale();        
        updateYAxis();      
        updatehistogramData();
        updateXScale();
        updateXAxis();
        updateBins();
    }

    // Method

    function updateYScale() {
        
        var dataset = displayedData;
        var dimension = selectedDimension1;

        // Update y scale
        _yScale = d3.scaleLinear()
            .domain(computeDomain(dimension, dataset))
            .range([_height, 0]);
    }
    
    function updateYAxis() {

        var dimension = selectedDimension1;
        
        /// Remove y axis
        _gPlot.selectAll(".y.axis").remove();

        // Update y axis
        _gPlot.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(_yScale))
            .append("text")
                .attr("text-anchor", "middle")
                .attr("x", -_height/2)
                .attr("y", -40)
                .attr("transform", "rotate(-90)")
                .text(dimension.label ? dimension.label : dimension.key);
    }
    
    function updatehistogramData() {

        var dimension = selectedDimension1;

        var histogram1 = d3.histogram()
            .value(function(d) { return d[dimension.key]; })
            .domain(_yScale.domain())
            .thresholds(_yScale.ticks(nbTicks));

        _bins = histogram1(displayedData.filter( function(d) {return !d[coloredDimension.key]}));

        _binsList = [];
        
        if (coloredDimension.property == "categorical") {
            var categories = coloredDimension.domain;
            // console.log(categories);
            categories.forEach(function (cat) {
                _binsList.push(histogram1(displayedData.filter( function(d) {return d[coloredDimension.key] === cat} )));
            });
        }
        else {
            _binsList.push(histogram1(displayedData.filter( function(d) {return d[coloredDimension.key]})));
        }
            
    }
    
    function updateXScale() {

        var domain = Math.max(
            d3.max(_binsList, function(b) { return d3.max( b, function(d) { return d.length; })}),
            d3.max(_bins, function(d) { return d.length; })
        );

        _xScale = d3.scaleLinear()
            .domain([0, domain])
            .range([0, _width]);
        
        // Update x scale

        // if (coloredDimension.property == "categorical")
        //     _xScale = d3.scaleLinear()
        //         .domain([0, d3.max(_binsList, function(b) { return d3.max( b, function(d) { return d.length; })})])
        //         .range([0, width]);
            
        // if (coloredDimension.property == "numercial")
        //     _xScale = d3.scaleLinear()
        //         .domain([0, d3.max(_bins, function(d) { return d.length; })])
        //         .range([0, width]);
    }
    
    function updateXAxis() {
        
        // Remove x axis
        _gPlot.selectAll(".x.axis").remove();

        // Update x axis
        _gPlot.append("g")
            .attr("class", "x axis")
            .attr("transform", function(d) { return "translate(0, " + _height + ")"; })
            .call(d3.axisBottom(_xScale))
            .append("text")
                .attr("x", _width/2)
                .attr("y", 40)
                .text("Number of data");
    }
    
    function updateBins() {
        
        // Remove bars
        _gPlot.selectAll("rect").remove();
        
        // Update histogram1 rectangles
        _binsList.forEach(function (b, i) {
            
            _gSelectedBins.selectAll(".test")
                .data(b).enter()
                .append("rect")
                    .attr("class", "hist")
                    .attr("transform", function(d) { return "translate(0, " + (_yScale(d.x1) - 2.5) + ")"; })
                    .attr("width", function(d) { return _xScale(d.length); })
                    .attr("height", 5)
                    .style("opacity", 0.6);
        });


        _gUnselectedBins.selectAll("rect")
            .data(_bins).enter()
            .append("rect")
                .attr("fill", nanColor)
                .attr("transform", function(d) { return "translate(0, " + (_yScale(d.x1) - 2.5) + ")"; })
                .attr("width", function(d) { return _xScale(d.length); })
                .attr("height", 5)
                .style("opacity", 0.6);


        updateBinsColor();
            
    }

    function updateBinsColor() {

        _gSelectedBins.selectAll(".hist")
            .attr("fill", function (dta) {
                if (coloredDimension.property == "categorical") {
                    if (dta.length > 0)
                        return (dta[0][coloredDimension.key] ? coloredDimension.colorScale(dta[0][coloredDimension.key]) : nanColor);
                    return;
                }
                if (coloredDimension.property == "quantitative") {
                    return (coloredDimension.colorScale(d3.mean(dta, d => d[coloredDimension.key])));
                    // return _colorScale(d3.mean(dta, d => d[coloredDimension.key]));
                }
            });
    }
    
    return histogram1;

}