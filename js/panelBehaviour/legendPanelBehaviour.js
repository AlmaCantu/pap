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

function LegendPanelBehaviour () {

    var _width;
    var _height;
    const margin = {top: 70, right: 0, bottom: 90, left: 70};

    var _colorEncodingSvg;
    var _filteringInfoSvg;

    var _tooltip;

    function legendPanelBehaviour(container) {

        _width = container.attr("width");
        _height = container.attr("height");

        // Create svg
        var div = container.append("div");

        // div.append("h3")
        //     .text("Color Encoding");

        _colorEncodingSvg = div.append("svg")
            .attr("width", 30)
            .attr("height", _height)
                .append("g");
                // .attr("transform", "translate(0," + _height + ")");

        // div.append("h3")
        //     .text("Filtered Data");

        _filteringInfoSvg = div.append("svg")
            .attr("width", 30)
            .attr("height", _height)
                .append("g");
                // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                
        _tooltip = d3.select("body").append("div")
        .style("display", "none")
        .attr("class", "tooltip");
    }

    legendPanelBehaviour.initialize = function () {
        updateContent();
    }

    // Event
    /// External
    
    legendPanelBehaviour.updateColoration = function () {
        updateContent();
    }
    
    legendPanelBehaviour.updateDataSelection = function () {
        updateContent();
    }

    // Method

    function updateContent() {

        // Remove existing legends
        _colorEncodingSvg.selectAll(".title").remove();
        _colorEncodingSvg.selectAll(".value").remove();
        _colorEncodingSvg.selectAll(".label").remove();

        _colorEncodingSvg.append("text")
            .attr("class", "title")
            .attr("x", -_height)
            .attr("y", 15)
            .attr("transform", "rotate(-90)")
            .text("Coloration:");

        // _colorEncodingSvg.append("text")
        //     .attr("class", "title")
        //     .attr("x", 100)
        //     .attr("y", 15)
        //     .style("font-weight", "bold")
        //     .style("fill", "#097DB3")
        //     .text((coloredDimension.label ? coloredDimension.label : coloredDimension.key));


        if (coloredDimension.property == "referential") {
    
            var categories = coloredDimension.domain;
            // var coloredDimension.colorScale = getcoloredDimension.colorScale(coloredDimension);

            function onHover(category) {
                showTooltip(category);
            }
    
            function onOut() {
                hideTooltip();
            }
    
            categories.forEach(function (category, i) {
    
                _colorEncodingSvg.append("circle")
                    .attr("class", "value")
                    .attr("cx", 12)
                    .attr("cy", _height - (margin.bottom + 5 + (i * 18)))
                    .attr("r", 5)
                    .attr("fill", coloredDimension.colorScale(category))
                    .on("mouseover", function() {onHover(category);})
                    .on("mouseout", function() {onOut();});
        
                // _colorEncodingSvg.append("text")
                //     .attr("class", "label")
                //     .attr("transform", "translate(-35, " + (-37 + (i * 18)) + ")")
                //     .text(category);
            });
        }
        else {

            const f = d3.format(".2f");
            
            var domain = coloredDimension.domain;
            // console.log("--------------------");
            // console.log(domain);
            // console.log("--------------------");

            // var width = _colorEncodingSvg.attr("width");
            // console.log(width);
        
            var cs = d3.scaleLinear()
                .domain([_height - margin.bottom, margin.top])
                .range(domain);
    
            n = 100;
            var step = (_height - margin.bottom - margin.top) / n;
            // console.log(step);
            for (let i = _height - margin.bottom; i > margin.top; i = i - step) {

                _colorEncodingSvg.append("rect")
                    .attr("class", "value")
                    .attr("x", 7)
                    .attr("y", i)
                    .attr("width", 10)
                    .attr("height", step + 0.05)
                    .attr("fill", coloredDimension.colorScale(cs(i)));
            }
            
            _colorEncodingSvg.append("text")
                .attr("class", "label")
                .attr("x", margin.bottom - _height)
                .attr("y", 15)
                .attr("transform", "rotate(-90)")
                .style("font-size", "9px")
                .text(f(domain[0]));
    
            _colorEncodingSvg.append("text")
                .attr("class", "label")
                .attr("x", -margin.top)
                .attr("y", 15)
                .attr("transform", "rotate(-90)")
                .attr("text-anchor", "end")
                .style("font-size", "9px")
                .style("fill", "white")
                .text(f(domain[1]));
        }

        // -------------------------------------------------------
        
        _filteringInfoSvg.selectAll(".label").remove();
        _filteringInfoSvg.selectAll(".value").remove();

        _filteringInfoSvg.append("text")
            .attr('class', 'label')
            .attr("x", -_height)
            .attr("y", 15)
            .attr("transform", "rotate(-90)")
            .text("Visible data:");

        var coeff = currentData.length / fullData.length;

        n = 100;
        var length = _height - margin.bottom - margin.top;
        var step = length / n;
        // console.log(step);
        for (let i = _height - margin.bottom; i > margin.top; i = i - step) {
            _filteringInfoSvg.append("rect")
                .attr("class", "value")
                .attr("x", 7)
                .attr("y", i)
                .attr("width", 10)
                .attr("height", step + 0.05)
                .attr("fill", (((_height - margin.bottom - i)/length) < coeff) ? "#097DB3" : "#C8E2EE");
        }

        _filteringInfoSvg.append("text")
            .attr("class", "label")
            .attr("x", margin.bottom - _height)
            .attr("y", 15)
            .attr("transform", "rotate(-90)")
            .style("font-size", "9px")
            .style("fill", "white")
            .text(currentData.length + " / " + fullData.length);

    }

    function showTooltip(txt) {
        // console.log(d3.select("body").node());
        var m = d3.mouse(d3.select("body").node());
        // console.log(m);
        _tooltip
            .style("display", null)
            .style("left", m[0] + 20 + "px")
            .style("top", m[1] + 20 + "px")
            .html(txt);
    }
    
    function hideTooltip() {
        _tooltip.style("display", "none");
    }

    return legendPanelBehaviour;
}