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

function InformationPanelBehaviour () {

    var _width;

    var _selectionInfoDiv;

    var _tooltip;

    var isAll = true;

    function informationPanelBehaviour(container) {

        _width = container.attr("width");
        var height = container.attr("height");

        // Create svg
        var div = container.append("div");

        // div.append("h3")
        //     .text("Selected Variables");

        _selectionInfoDiv = div.append("svg")
            .attr("width", _width)
            .attr("height", height)
            .attr("xmlns:xhtml", "http://www.w3.org/1999/xhtml")
                .append("g");

        _tooltip = d3.select("body").append("div")
            .style("display", "none")
            .attr("class", "tooltip");
    }

    informationPanelBehaviour.initialize = function () {
        updateContent();
    }

    // Event
    /// External

    informationPanelBehaviour.updateDisplayedVariables = function () {
        updateContent();
    }

    informationPanelBehaviour.updateDisplayedData = function() {
        updateContent();
    }

    
    informationPanelBehaviour.isAllStateChanged = function(sumIsAll) {
        isAll = sumIsAll;
        updateContent();
    }


    // Method

    function updateContent() {

        var dataset = displayedData;

        // Remove existing contents
        _selectionInfoDiv.selectAll(".label").remove();
        _selectionInfoDiv.selectAll(".table").remove();
        _selectionInfoDiv.selectAll(".button").remove();

        // Display labels

        // _selectionInfoDiv.append("text")
        //     .attr("class", "label")
        //     .attr("y", 15)
        //     .text("v1:");

        // _selectionInfoDiv.append("text")
        //     .attr("class", "label")
        //     .attr("x", 20)
        //     .attr("y", 15)
        //     .style("font-weight", "bold")
        //     .style("fill", "#097DB3")
        //     .text(selectedDimension1.label ? selectedDimension1.label : selectedDimension1.key);

        // _selectionInfoDiv.append("text")
        //     .attr("class", "label")
        //     .attr("y", 30)
        //     .text("v2:");

        // _selectionInfoDiv.append("text")
        //     .attr("class", "label")
        //     .attr("x", 20)
        //     .attr("y", 30)
        //     .style("font-weight", "bold")
        //     .style("fill", "#097DB3")
        //     .text(selectedDimension2.label ? selectedDimension2.label : selectedDimension2.key);


        // -------------------------------------------------------

        // Display table

        function onHover(category) {
            showTooltip(category);
        }

        function onOut() {
            hideTooltip();
        }

        var table = _selectionInfoDiv.append("foreignObject")
                .attr("x", "0")
                .attr("y", "15")
                .attr("width", _width)
                .attr("height", 250)
                .append('xhtml:table')
                    .attr("class", "table");

        var categories = (coloredDimension.property == "categorical" ? coloredDimension.domain : []);

        var nbColumns = categories.length;

        var rowDimensions = dimensions.filter(dim => dim.isVisible && (dim.property == "quantitative")).sort((a, b) => a.order - b.order);

        var summaryData;
        const f = d3.format(".2f");

        if (nbColumns > 5 || nbColumns == 0 || isAll) {
            summaryData = getSummaryTable(dataset, rowDimensions);
        }
        else {
            summaryData = {};
            categories.forEach(function(cat) {
                
                var data = dataset.filter(d => d[coloredDimension.key] == cat);
                summaryData[cat] = getSummaryTable(data, rowDimensions);
            });
        }

        // append the header row
        var thead1 = table.append('tr');
        if (nbColumns > 5 &&  !isAll) {

            // var label = coloredDimension.label ? coloredDimension.label : coloredDimension.key;
            // if (label.length > 20) {
            //     label = label.substring(0,15);
            //     label = label + "(...)"
            // }
            thead1.append('th')
                .text("Per color");

            thead1.append('th')
                .attr("colspan", 2)
                .text("All categories (> 5)");
        }
        if (nbColumns <= 5 && nbColumns > 0 &&  !isAll) {
            
            // var label = coloredDimension.label ? coloredDimension.label : coloredDimension.key;
            // if (label.length > 20) {
            //     label = label.substring(0,15);
            //     label = label + "(...)"
            // }
            thead1.append('th')
                .text("Per color");

            categories.forEach(function(cat) {

                var label = cat;

                if (nbColumns > 1) {
                    if (label.length > 20) {
                        label = label.substring(0,15);
                        label = label + "(...)"
                    }
                }

                thead1.append('th')
                    .style('color', coloredDimension.colorScale(cat))
                    .attr("colspan", 2)
                    .on("mouseover", a => showTooltip(cat))
                    .on("mouseout", hideTooltip)
                    .text(label);
            });
        }

        var thead2 = table.append('tr');

        thead2.append('th')
            .text("Metrics");

        if (nbColumns > 5 || nbColumns == 0 || isAll) {
            thead2.append('th')
                    .text("Mean");
            thead2.append('th')
                .style('color', 'darkgrey')
                .text("95% CI");
        }
        else {
            for (let i = 0; i < nbColumns; i++) {
                thead2.append('th')
                    .text("Mean");
                thead2.append('th')
                    .style('color', 'darkgrey')
                    .text("95% CI");
            }
        }

        // console.log(rowDimensions);

        // create a row for each object in the data        
        var tbody;

        rowDimensions.forEach(function (dim) {

            tbody = table.append('tr');

            var label = dim.label ? dim.label : dim.key;
            if (label.length > 20) {
                label = label.substring(0,15);
                label = label + "(...)"
            }

            tbody.append('td')
                .on("mouseover", a => showTooltip(dim.label ? dim.label : dim.key))
                .on("mouseout", hideTooltip)
                .text(label);

            if (nbColumns > 5 || nbColumns == 0 || isAll) {
                // console.log(summaryData);
                
                tbody.append('td')
                    .text(summaryData[dim.key]["Mean"]);

                tbody.append('td')
                    .style('color', 'darkgrey')
                    .style('font-size', '10px')
                    .text(summaryData[dim.key]["CI"]);
            }
            else {
                // console.log(summaryData);
                d3.keys(summaryData).forEach(function(cat) {
                    tbody.append('td')
                        .text(summaryData[cat][dim.key]["Mean"]);

                    tbody.append('td')
                        .style('color', 'darkgrey')
                        .style('font-size', '8px')
                        .text(summaryData[cat][dim.key]["CI"]);
                });
            }

        });

        // -------------------------------------------------------


        function save() {
            
            var exportData = [];
            exportData.push([(selectedDimension1.label ? selectedDimension1.label : selectedDimension1.key),
                (selectedDimension2.label ? selectedDimension2.label : selectedDimension2.key)]);
            d3.map(dataset, d => exportData.push([+d[selectedDimension1.key], +d[selectedDimension2.key]]));

            var filterData = [];
            filterData.push(["variable", "categories", "min", "max"]);
            d3.map(dimensions.filter(dim => dim.isVisible), function(dim) {
                if(dim.brush.length != 0)
                    if(dim.property == "categorical")
                        filterData.push([dim.label ? dim.label : dim.key, dim.brush.join(" "), "", ""]);
                    else
                        filterData.push([dim.label ? dim.label : dim.key, "", dim.brush[0], dim.brush[1]]);
            });

            exportTableToCsv(exportData, filterData);
        } 

        var exportButton = _selectionInfoDiv.append('g')
            .attr("class", "button")
            .attr("transform", "translate(" + (_width - 40) + ", 300)")
            .on("mouseover", a => showTooltip("Export the currenlty displayed data <br> for further analyses"))
            .on("mouseout", hideTooltip)
            .on("click", save);

        exportButton.append("rect")
            .attr("x", -10)
            .attr("y", -13)
            .attr("width", 50)
            .attr("height", 20);

        exportButton.append("text")
            .text("Export");

        exportButton.classed("active", true);
    }

    function getSummaryTable(dataset, dimensions) {

        const f = d3.format(".2f");

        var summaryTable = {};    
        var data;

        dimensions.forEach(function (dim) {

            data = dataset.filter(d => d[dim.key]);

            var mean = d3.mean(data, (d => +d[dim.key]));
            var sd = d3.deviation(data, (d => +d[dim.key]));
            var sampleSize = data.length;
            var z = 1.96;

            var ci = [mean+(z*(sd/Math.sqrt(sampleSize))), mean-(z*(sd/Math.sqrt(sampleSize)))];
            // console.log(ci);
            // console.log([f(ci[0]), f(ci[1])]);

            var datum = {};
            datum["Mean"] = f(mean);
            datum["CI"] = "[" + f(ci[1]) + ", " + f(ci[0]) + "]";
            
            summaryTable[dim.key] = datum;
        });

        return summaryTable;

    }

    function showTooltip(txt) {
        // console.log(d3.select("body").node());
        var m = d3.mouse(d3.select("body").node());
        _tooltip
            .style("display", null)
            .style("left", m[0] + 20 + "px")
            .style("top", m[1] + 20 + "px")
            .html(txt);
    }
    
    function hideTooltip() {
        _tooltip.style("display", "none");
    }

    function exportTableToCsv(table, filter) {

        // console.log(table);
        // console.log(filter);

        var csvContent = "data:text/csv;charset=utf-8,";

        csvContent += "Filter Applied\r\n";

        filter.forEach(function(rowArray) {
            for(i = 0; i < rowArray.length; i++) {
                if (rowArray[i] != null) {
                    // console.log(rowArray[i]);
                    rowArray[i] = rowArray[i].toString().replace('/,/g', ';');
                }
            }
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });

        csvContent += "\r\n";

        csvContent += "Selected Data\r\n";
    
        table.forEach(function(rowArray) {
            for(i = 0; i < rowArray.length; i++) {
                if (rowArray[i] != null) {
                    // console.log(rowArray[i]);
                    rowArray[i] = rowArray[i].toString().replace('/,/g', ';');
                }
            }
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });
    
        // var filteredByParameters = "";
        // filteredBy.forEach(function(str) {
        //     filteredByParameters += str + '_';
        // });
        // filteredByParameters = filteredByParameters.slice(0, -1);
    
        var date = new Date(Date.now());
        // var filename = title + "-" + date.toISOString() + "-study_" + study + "-filter_" + filteredByParameters;
        var filename = "exportedTVSData_" + date.toISOString();

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename + ".csv");
        document.body.appendChild(link);
    
        link.click();
    
    }

    return informationPanelBehaviour;
}