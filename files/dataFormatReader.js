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

class DataFormatReader {

    #filePath;
    #onReady;

    // dataPath;

    defaultColoredDimension;
    defaultShapeDimension;
    defaultSelectedDimension1;
    defaultSelectedDimension2;
    dimensions;

    // isColorDistributed;
    // isZoomFocused;

    // defaultVisibilities;

    constructor(filePath, dims, onReady) {
        this.#filePath = filePath;
        this.dimensions = dims;
        this.#onReady = onReady;
    }
    
    // Method

    initialize() {
            
        var self = this;
        
        d3.xml(this.#filePath, function(xmlData) {
            self.readXmlData(xmlData);
        });
        
    }

    readXmlData(xmlData) {

        var defaultColoredDimensionKey;
        var defaultSelectedDimension1Key;
        var defaultSelectedDimension2Key;
        
        // var filePathElement = xmlData.getElementsByTagName("filepath")[0];
        // this.dataPath = filePathElement.childNodes[0].nodeValue;
               
        // var preselectionsElement = xmlData.getElementsByTagName("preselections")[0];
        // // console.log(colorationElement);
        // if (preselectionsElement) {
            
        //     var colorationElement = preselectionsElement.getElementsByTagName("coloration")[0];
        //     if (colorationElement)
        //         defaultColoredDimensionKey = colorationElement.childNodes[0].nodeValue;
            
        //     var dimension1Element = preselectionsElement.getElementsByTagName("dim1")[0];
        //     if (dimension1Element)
        //         defaultSelectedDimension1Key = dimension1Element.childNodes[0].nodeValue;
            
        //     var dimension2Element = preselectionsElement.getElementsByTagName("dim2")[0];
        //     if (dimension2Element)
        //         defaultSelectedDimension2Key = dimension2Element.childNodes[0].nodeValue;
        // }

        // var statesElement = xmlData.getElementsByTagName("states")[0];
        // // console.log(selectionElement);
        // if (statesElement) {

        //     var isColorDistributedElement = statesElement.getElementsByTagName("isColorDistributed")[0];
        //     if (isColorDistributedElement)
        //         this.isColorDistributed = (isColorDistributedElement.childNodes[0].nodeValue == "true");
        //     else
        //         this.isColorDistributed = true;
            
        //     var isFocusedElement = statesElement.getElementsByTagName("isFocused")[0];
        //     if (isFocusedElement)
        //         this.isZoomFocused = (isFocusedElement.childNodes[0].nodeValue == "true");
        //     else
        //         this.isZoomFocused = false;
        // }

        // this.dimensions = [];
        // this.defaultVisibilities = [];
        
        var dimensionsElements = xmlData.getElementsByTagName("dimensions")[0];
        var dimensionElements = dimensionsElements.getElementsByTagName("dimension");
        for (var i = 0; i< dimensionElements.length; i++) {
                
            var dimensionElement = dimensionElements[i];

            // var dimension = {};

            // var visibility = true;

            var key = dimensionElement.getAttribute("key");
            // if (key) {
                // dimension.key = key;
            // }
            // else {
            //     dimension.nature = "computed";
            // }

            

            for (var j = 0; j < this.dimensions.length; j++) {
                if (this.dimensions[j].key == key) {
                    
                    var descriptionElement = dimensionElement.getElementsByTagName("description")[0];
                    if (descriptionElement)
                        this.dimensions[j].label = descriptionElement.childNodes[0].nodeValue;
                        
                    var propertyElement = dimensionElement.getElementsByTagName("property")[0];
                    if (propertyElement)
                        this.dimensions[j].property = propertyElement.childNodes[0].nodeValue;

                    if(this.dimensions[j].property == "referential")
                        this.dimensions[j].isNested = false;

                    var typeElement = dimensionElement.getElementsByTagName("type")[0];
                    if (typeElement)
                        this.dimensions[j].type = typeElement.childNodes[0].nodeValue;
                    else
                        if (this.dimensions[j].property == "referential")
                            this.dimensions[j].type = "nominal";
                        
                    var visibilityElement = dimensionElement.getElementsByTagName("visibility")[0];
                    if (visibilityElement)
                        this.dimensions[j].isVisible = (visibilityElement.childNodes[0].nodeValue != "hidden");
                    else
                        this.dimensions[j].isVisible = true;

                    var categoriesElement = dimensionElement.getElementsByTagName("categories")[0];
                    if (categoriesElement) {
                        this.dimensions[j].domain = [];
                        var categoryElements = categoriesElement.getElementsByTagName("category");
                        for (var j = 0; j< categoryElements.length; j++) {
                            this.dimensions[j].domain.push(categoryElements[j].childNodes[0].nodeValue);
                        }
                    }

                    var parametersElement = dimensionElement.getElementsByTagName("parameters")[0];
                    if (parametersElement) {

                        this.dimensions[j].parameters = {};

                        var parameterElements = parametersElement.getElementsByTagName("parameter");
                        for (var j = 0; j< parameterElements.length; j++) {

                            var key = parameterElements[j].getAttribute("key");
                            var type = parameterElements[j].getAttribute("type");

                            this.dimensions[j].parameters[type] = key;
                        }
                    }

                    // var minElement = dimensionElement.getElementsByTagName("min")[0];
                    // if (minElement)
                    //     this.dimensions[j].min = parseFloat(minElement.childNodes[0].nodeValue);

                    // var maxElement = dimensionElement.getElementsByTagName("max")[0];
                    //     if (maxElement)
                    //         this.dimensions[j].max = parseFloat(maxElement.childNodes[0].nodeValue);

                    // if (defaultColoredDimensionKey == key)
                    //     this.defaultColoredDimension = this.dimensions[j];

                    // if (defaultShapeDimensionKey == key)
                    //     this.defaultShapeDimension = this.dimensions[j];

                    // if (defaultSelectedDimension1Key == key)
                    //     this.defaultSelectedDimension1 = this.dimensions[j];

                    // if (defaultSelectedDimension2Key == key)
                    //     this.defaultSelectedDimension2 = this.dimensions[j];
                }
            }

            // if (!("property" in dimension))
            //     dimension.property = "characteristic";

            // if (!("type" in dimension))
            //     if (dimension.property == "characteristic")
            //         dimension.type = "quantitative";
            //     else
            //         dimension.type = "nominal";

            // if (!("nature" in dimension))
            //     dimension.nature = "measured";

            // if (!("isVisible" in dimension))
            //     dimension.isVisible = true;

            // this.dimensions.push(dimension);
            // this.defaultVisibilities.push(visibility);

        }
        
        this.#onReady();
    }

}