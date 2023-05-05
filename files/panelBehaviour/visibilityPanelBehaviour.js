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

function VisibilityPanelBehaviour () {
    
    var _div;
    var _gInput;
    
    const margin = {top: 5, right: 5, bottom: 5, left: 5};

    function visibilityPanelBehaviour(container) {

        var width = container.attr("width") - margin.left - margin.right;
        var height = container.attr("height") - margin.top - margin.bottom;

        container.attr("style", "width: " + (width + margin.left + margin.right) + "px; height: " + (height + margin.top + margin.bottom - 30) + "px; overflow-y: auto");
    
        // Create svg
        _div = container
            .style("overflow-y", "scroll")
            .style("overflow-x", "hidden")
            .append("div")
                .attr("width", width + margin.left + margin.right - 20)
                .attr("height", (5 * height) + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    visibilityPanelBehaviour.initialize = function () {

        _gInput = _div.selectAll(".dimension")
            .data(dimensions).enter()
            .append('g');
    
        _gInput.append('input')
            .attr('type', 'checkbox')
            .attr('value', d => d.key)
            .each(function(d) {
                if (d.isVisible)
                    d3.select(this).attr('checked', '')
            })
            .on('change', onVisibleDimensionsChange)
            .on("mouseover", d => showTooltip("Click to " + (d.isVisible ? "hide " : "show ") + (d.label ? d.label : d.key)))
            .on("mouseout", hideTooltip);
    
        _gInput.append('label')
            .text(d => (d.label ? d.label : d.key));
    
        _gInput.append('br');
    
       // var sltDimensionsVisibility = d3.select('#sltDimensionsVisibility');
    
       // sltDimensionsVisibility.on('click', onDimensionsVisibilityChange);
        
    }

    return visibilityPanelBehaviour;
}