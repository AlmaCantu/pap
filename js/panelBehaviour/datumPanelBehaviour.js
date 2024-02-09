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

function DatumPanelBehaviour () {

    var _datum;
    
    const margin = {top: 5, right: 10, bottom: 60, left: 80};

    function datumPanelBehaviour(container) {

        var width = container.attr("width") - margin.left - margin.right;
        var height = container.attr("height") - margin.top - margin.bottom;

        container.attr("style", "width: " + (width + margin.left + margin.right) + "px; height: " + (height + margin.top + margin.bottom - 30) + "px; overflow-y: auto");
    
        // Create svg
        _svg = container.append("svg")
            .attr("width", width + margin.left + margin.right - 20)
            .attr("height", (5 * height) + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    datumPanelBehaviour.initialize = function () {
        // console.log(dimensions);

        _svg.selectAll(".label")
            .data(dimensions)
            .enter()
            .append("text")
                .attr("class", "label")
                .attr("x", -80)
                .attr("y", (d, i) => 20 + i * 20)
                .text(function(dim) {
                    var str = (dim.label ? dim.label : dim.key);
                    if (str.length > 25) {
                        str = str.substring(0,20);
                        str = str + "(...)"
                    }
                    
                    return (str + ":");
                });

        displayChecking();
    }
    
    // Event
    /// Internal
    
    datumPanelBehaviour.datumSelected = function(datum) {

        _datum = datum;

        console.log(_datum);
        
        if(!displayChecking())
            return;
        
        // Remove existing values
        _svg.selectAll(".value").remove();

        const f = d3.format(".2f");
        
        if (datum)
            // Update values
            _svg.selectAll(".value")
                .data(dimensions)
                .enter()
                .append("text")
                    .attr("class", "value")
                    .attr("x", 80)
                    .attr("y", (d, i) => 20 + i * 20)
                    .style('fill', function(dim) {
                        if ("min" in dim)
                            return (+datum[dim.key] >= dim.min ? 'black' : 'red');
                        if ("max" in dim)
                            return (+datum[dim.key] <= dim.max ? 'black' : 'red');
                        return 'black';
                    })
                    .text(dim => (dim.property == "quantitative") ? f(+datum[dim.key]) : datum[dim.key]);
    }
    
    datumPanelBehaviour.selectedDataChanged = function () {

        if (!d3.set(displayedSelectedData).has(_datum))
            _datum = null;
        
        if(!displayChecking())
            return;
    }

    datumPanelBehaviour.visibleDimensionsChanged = function () {
        
        if(!displayChecking())
            return;
    }

    function displayChecking() {

        var toDisplay = false;

        if (!selectedDimension1 || !selectedDimension2) {
            _svg.selectAll(".value").remove();
        }
        else {
            if (!_datum) {
                _svg.selectAll(".value").remove();
            }
            else {
                toDisplay = true;
            }
        }

        return toDisplay;
    }

    return datumPanelBehaviour;
}