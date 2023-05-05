// Parallel Sets by Jason Davies, http://www.jasondavies.com/
// Functionality based on http://eagereyes.org/parallel-sets
(function() {
    
    d3.parsets = function() {
    
        var event = d3.dispatch("sortDimensions", "sortCategories");
        var dimensions_ = autoDimensions;
        var dimensionFormat = String;
        var tooltip_ = defaultTooltip;
        var categoryTooltip = defaultCategoryTooltip;
        var value_;
        var spacing = 20;
        var width = 600;
        var height = 200;
        var margin = {top: 10, right: 10, bottom: 10, left: 10};
        var tension = 1;
        var tension0;
        var duration = 500;
        var xscale;
        var yscale;
        var myData;
        
        var dimensions = [];
        
        var yAxis = d3.axisLeft();
        
        var order = {};
        order["Disease"] = [ 'CL', 'PD'];
        order["Period"] = [ '18', '36', '54', '72'];
        order["Type of movement (sec)"] = [ 'under10', '10to30', '30to60', 'over60'];
        
        var ribbonOrder = [];

        function parsets(svg) {

            var canvas = svg.append("g")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

            canvas.each(function(data, i) {

                var g = d3.select(this);
                var ordinal = d3.scaleOrdinal();
                var dragging = false;
                var dimensionNames = dimensions_.call(this, data, i);
                
                //console.log(dimensionNames);
                
                
                var tree = {children: {}, count: 0};
                var nodes;
                var total;
                var ribbon;
                
                xscale = d3.scalePoint()
                    .domain(d3.range(dimensionNames.length))
                    .range([0, width]);
                
                //console.log(dimensionNames);
                
                var deepNesting = function (data, dimList) {
            
                    if (dimList.length == 0) {
                        var m = {};
                        m["count"] = data.length;
                        m["value"] = {};
                        dimensionNames.forEach(function(dim) {
                            m["value"][dim] = data[0][dim];
                        });
                        return [m];
                    }

                    var nestedData = d3.nest()
                        .key(d => d[dimList[0]])
                        .entries(data);

                    var result = [];
                    nestedData.forEach(function(d) {
                        var m = deepNesting(d.values, dimList.slice(1));
                        result = result.concat(m);
                    });

                    return result;
                }
                
                myData = deepNesting(data, dimensionNames.slice(0));
                
                var a = {};
                myData.forEach(function (d) {
                    dimensionNames.forEach(function (n) {
                        if (!(n in a))
                            a[n] = {};
                        
                        var v = d.value[n];
                        //console.log(a[n]);
                        if (!(v in a[n]))
                            a[n][v] = 0;
                    
                        a[n][v] = a[n][v] + d.count;
                    });
                    
                });
                
                var sum = getTotalA(myData);
                
                yscale = d3.scalePoint()
                    .domain(d3.range(sum))
                    .range([0, height]);
                
                var xref = {};
                var sca = {};
                Object.keys(a).forEach(function(attr) {
                    
                    if (!(attr in sca))
                       sca[attr] = 0;
                    
                    xref[attr] = {};
                    Object.keys(a[attr]).forEach(function(val) {
                        xref[attr][val] = sca[attr];
                        sca[attr] = sca[attr] + yscale(a[attr][val]);
                    });
                    
                })
                
//                console.log(myData);
//                console.log(a);
//                console.log(xref);

                //d3.select(window).on("mousemove.parsets." + ++parsetsId, unhighlight);

                if (tension0 == null)
                    tension0 = tension;

                g.append("g")
                    .attr("class", "ribbon");
//                
//                g.selectAll(".ribbon-mouse")
//                    .enter()
//                    .append("g")
//                        .attr("class", "ribbon-mouse");
                
//                g.selectAll(".ribbon, .ribbon-mouse")
//                    .data(["ribbon", "ribbon-mouse"], String)
//                    .enter()
//                    .append("g")
//                    .attr("class", String);

                updateDimensions();

                if (tension != tension0) {
                    var t = d3.transition(g);
                    if (t.tween)
                        t.tween("ribbon", tensionTween);
                    else
                        tensionTween()(1);
                }

                function tensionTween() {
                var i = d3.interpolateNumber(tension0, tension);
                return function(t) {
                tension0 = i(t);
                ribbon.attr("d", ribbonPath);
                };
                }

                function updateDimensions() {



                    ///////////////////////////////////////////////////////

                    // Cache existing bound dimensions to preserve sort order.
//                    var dimensionD = g.selectAll("g.dimension");
//                    var cache = {};
//                    
//                    console.log(dimensionD); 
//
//                    dimensionD.each(function(d) { cache[d.name] = d; });
//
//                    dimensionNames.forEach(function(d) {
//                        if (!cache.hasOwnProperty(d)) {
//                            cache[d] = {name: d, categories: []};
//                        } 
//                        dimensions.push(cache[d]);
//                    });
                    
                    dimensionNames.forEach(function(d) {
                        dimensions.push({name: d, categories: []});
                    });
                    
                    //dimensions.sort(compareY);

                    //console.log(dimensions);    

                    // Populate tree with existing nodes.
                    g.select(".ribbon")
                        .selectAll("path")
                            .each(function(d) {

                                var path = d.path.split("\0");
                                var node = tree;
                                var n = path.length - 1;

                                for (var i = 0; i < n; i++) {
                                    var p = path[i];
                                    node = node.children.hasOwnProperty(p) ? node.children[p]
                                    : node.children[p] = {children: {}, count: 0};
                                }
                                node.children[d.name] = d;
                            });

                    tree = buildTree(tree, data, dimensions.map(d => d.name), value_);
                    cache = dimensions.map(function(d) {

                        var t = {};

                        d.categories.forEach(function(c) {
                            t[c.name] = c;
                        });

                        return t;
                    });
                    
                    


//                    console.log("test1");

                    ribbon = g.select(".ribbon")
                    //              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .selectAll("path")
                    //.data(nodes, function(d) { return d.path; }).enter()
                        .data(myData).enter()
                        .append("path");
                    
                    
//                    order des axe
//                    dimesnions
                    
                    //ordre des ribons
//                    var ribbonsOrders;
                    
//                    ribbonsOrders.for each
                    console.log(ribbon.data());
//                    
//                    var dim = "Period";
//                    ribbon.sort(function(a, b){
//                        console.log(b.value[dim]);
//                        return order[dim].indexOf(b.value[dim]) - order["Period"].indexOf(a.value[dim])
//                    });
//                    console.log("-------------------------------");
//                    
//                    console.log(order[dim].indexOf("18"));
//                    console.log(order[dim].indexOf("72"));
//                    console.log(ribbon.data());
                    
                    ribbonOrder = [];
                    ribbonOrder.push("Type of movement (sec)");
                    ribbonOrder.push("Period");
                    
                    ribbonOrder.reverse().forEach(function (dim) {
                        orderRibbonAccordingTo(dim);
                    });

                    (function categories(d, i) {
                        if (!d.children) return;
                        
                        var dim = dimensions[i];
                        var t = cache[i];
                        
                        for (var k in d.children) {
                            if (!t.hasOwnProperty(k)) {
                                dim.categories.push(t[k] = {name: k});
                            }
                            categories(d.children[k], i + 1);
                        }
                    })(tree, 0);

                    ordinal.domain([]).range(d3.range(dimensions[0].categories.length));
                    nodes = layout(tree, dimensions, ordinal);
                    total = getTotal(dimensions);

                    dimensions.forEach(function(d, i) {
                        d.count = total;
                        d.x = xscale(i);
                    });

                    ///////////////////////////////////////////////////////



                    //          var xscale = d3.scalePoint()
                    //            .domain(d3.range(dimension.length))
                    //            .range([0, width]);

                    var dimension = g.selectAll("dimension")
                        .data(dimensions).enter()
                        .append("g")
                            .attr("class", "dimension")
                            .attr("transform", function(d) { return "translate(" + d.x + ", 0)"; });
                    //                    .on("mousedown.parsets", cancelEvent);

                    dimension.each(function(d) {
                        d.y0 = d.y;
                        d.categories.forEach(function(d) { d.x0 = d.x; });
                    });

                    dimension.append("text")
                        .attr("class", "title")
                        .text(dimensionFormatName);
                    
                    dimension.append("text")
                        .attr("class", "title")
                        .text(dimensionFormatName);
                    
                    dimension.append("line")
                        .style("fill", "none")
                        .style("stroke", "#ccc")
                        .style("troke-width", 1)
                        .attr("y2", height);

                    dimension.call(d3.drag()
                        .on("start", function(d) {
                            dragging = true;
//                            d.y0 = d.y;
                        })
                        .on("drag", function(d) {
                        
                            var posx = d3.event.x
                            d.x = posx;
                        
                            // update ribbon and categories
                            for (var i = 1; i < dimensions.length; i++) {
                                if (dimensions[i].x < dimensions[i - 1].x) {
                                    
                                    dimensions.sort(function(a, b) { return a.x - b.x; });
                        
                                    dimensions.forEach(function(dim, i) {
                                        dim.x = xscale(i);
                                    });
                                    
                                    ordinal.domain([]).range(d3.range(dimensions[0].categories.length));
                                    
                                    nodes = layout(tree = buildTree({children: {}, count: 0}, data, dimensions.map(d => d.name), value_), dimensions, ordinal);
                                    total = getTotal(dimensions);
                                    g.selectAll(".ribbon, .ribbon-mouse").selectAll("path").remove();
                                    updateRibbons();
                                    updateCategories(dimension);
                                    
                                    dimension
                                        .attr("transform", d => "translate(" + d.x + ", 0)")
                                        .transition();
                                    break;
                                }
                            }
                        
                            d3.select(this)
                                .attr("transform", "translate(" + d.x + ", 0)")
                                .transition();

//                            ribbon.filter(function(r) {return r.source.dimension === d || r.target.dimension === d; })
//                                .attr("d", ribbonPath);
                            ribbon.attr("d", ribbonPath);
                        })
                        .on("end", function(d) {
                            dragging = false;
                        
                            dimensions.forEach(function(dim, i) {
                                dim.x = xscale(i);
                            });
                        
                            dimension
                                .attr("transform", d => "translate(" + d.x + ", 0)")
                                .transition();
                        
                            ribbon.attr("d", ribbonPath);
                        })
                    );

                    dimension.transition().duration(duration)
                        .attr("transform", function(d) { return "translate(" + d.x + ", 0)"; })
                        .tween("ribbon", ribbonTweenY);

                    updateCategories(dimension);
                    updateRibbons();
                }
                
                
                    
                function orderRibbonAccordingTo(dim) {
                    ribbon = ribbon.sort(function(a, b){
                        return order[dim].indexOf(a.value[dim]) - order[dim].indexOf(b.value[dim])
                    })
                }

                function updateRibbons() {
                    
                    var pos = {};
                    ribbon.each(function(d) {
                        
                        
                        if (!("position" in d))
                            d.position = {};
                        
                        if (!("size" in d))
                            d.size = {};
                        
                        dimensions.forEach(function(dim) {
                            
                            if (!(dim.name in pos))
                                pos[dim.name] = {};
                            
                            var val = d.value[dim.name];
                            if (!(val in pos[dim.name]))
                                pos[dim.name][val] = 0;
                            
                            var dx = yscale(d.count);
                            d.position[dim.name] = xref[dim.name][val] + pos[dim.name][val];
                            d.size[dim.name] = dx;
                            
                            pos[dim.name][val] = pos[dim.name][val] + dx;
                        });
                        
                        
                        //console.log(d);
                    });
                    
                    ribbon.attr("class", function(d) { return "category-" + d.major; })
                        .classed("selected", true)
                        .attr("d", ribbonPath);
                    

                    //ribbon.sort(function(a, b) { return b.count - a.count; });
                }

                // Animates the x-coordinates only of the relevant ribbon paths.
                function ribbonTweenX(d) {
                var nodes = [d],
                r = ribbon.filter(function(r) {
                var s, t;
                if (r.source.node === d) nodes.push(s = r.source);
                if (r.target.node === d) nodes.push(t = r.target);
                return s || t;
                }),
                i = nodes.map(function(d) { return d3.interpolateNumber(d.x0, d.x); }),
                n = nodes.length;
                return function(t) {
                for (var j = 0; j < n; j++) nodes[j].x0 = i[j](t);
                r.attr("d", ribbonPath);
                };
                }

                // Animates the y-coordinates only of the relevant ribbon paths.
                function ribbonTweenY(d) {
//                    var r = ribbon.filter(function(r) { return r.source.dimension.name == d.name || r.target.dimension.name == d.name; });
//                    var i = d3.interpolateNumber(d.y0, d.y);
//                    
//                    return function(t) {
//                        d.y0 = i(t);
//                        r.attr("d", ribbonPath);
//                    };
                }

                // Highlight a node and its descendants, and optionally its ancestors.
                function highlight(d) {
                    if (dragging) return;


//                    console.log("d");
//                    console.log(d);

                    var highlight = [];
                    (function recurse(d) {
                    highlight.push(d);
                    for (var k in d.children) recurse(d.children[k]);
                    })(d);
                    highlight.shift();

                    //          if (ancestors)
                    //              while (d) highlight.push(d), d = d.parent;

                    //         highlight.push(d);


                    ribbon.filter(function(d) {
                        var active = highlight.indexOf(d.node) >= 0;
                        if (active) this.parentNode.appendChild(this);
                        return active;
                    }).classed("selected", true);
                }

                // Unhighlight all nodes.
                function unhighlight() {
                if (dragging) return;
                ribbon.classed("active", false);
                hideTooltip();
                }



                function onArrowClick (cat) {

//                    console.log("Wouhou");
//                    console.log(cat);
                    
                    ribbonOrder = [];
                    ribbonOrder.push(cat.dimension.name);
                    dimensions.forEach(function (dim) {
                        ribbonOrder.push(dim.name);
                    });
                    
                    ribbonOrder.reverse().forEach(function (dim) {
                        orderRibbonAccordingTo(dim);
                    });
                    
                    //orderRibbonAccordingTo(cat.dimension.name);

                    ribbon.classed("selected", false);
                    ribbon.filter(function (rib) {
                        
                        return (rib.value[cat.dimension.name] == cat.name)
                        
                    }).classed("selected", true);
                }

                function updateCategories(g) {

//                    console.log(g.data());

                    // displayed area
                    var category = g.selectAll(".category")
                    .data(function(d) { return d.categories; }, function(d) { return d.name; })
                    .enter()
                    .append("g")
                    .attr("class", "category");


//                    console.log("testSB");

                    // selectable area
                    category.attr("transform", function(d) { return "translate(0, " + d.x + ")"; });

                    //category.exit().remove();

                    category.append("rect")
                        .attr("height", function(d) { return d.dx; })
                        .attr("x", -10)
                        .attr("width", 20)
                        .attr("class", function(d) {
                            return "category-" + (d.dimension === dimensions[0] ? ordinal(d.name) : "background")
                        })
                        .on('click', onArrowClick);

                    category.append("line")
                        .style("stroke-width", 1)
                        .style("stroke", "#ccc")
                        .attr("x1", -3)
                        .attr("x2", 3)
                        .attr("y1", function(d) { return d.dx; })
                        .attr("y2", function(d) { return d.dx; });

                    category.append("text")
                        .attr("dx", "-.3em")
                        .attr("transform", function(d) { return "translate(-8, " + (d.dx / 2) + ")"; })
                        .attr("text-anchor", "end")
                        .text(truncateText(function(d) { return d.name; }, function(d) { return d.dx; }));



                    //category.select("rect");

                    //          category.select("line")
                    //              .attr("y2", function(d) { return d.dx; });
                    //            
                    //          category.select("text")
                    //              .attr("transform", function(d) { return "translate(-8, " + (d.dx / 2) + ")"; })
                    //              .attr("text-anchor", "end")
                    //              .text(truncateText(function(d) { return d.name; }, function(d) { return d.dx; }));


                }

            });
        }

        parsets.dimensionFormat = function(_) {
        if (!arguments.length) return dimensionFormat;
        dimensionFormat = _;
        return parsets;
        };

        parsets.dimensions = function(_) {
        if (!arguments.length) return dimensions_;
        dimensions_ = constant(_);
        return parsets;
        };

        parsets.value = function(_) {
        if (!arguments.length) return value_;
        value_ = constant(_);
        return parsets;
        };

        parsets.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return parsets;
        };

        parsets.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return parsets;
        };

        parsets.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return parsets;
        };

        parsets.spacing = function(_) {
        if (!arguments.length) return spacing;
        spacing = +_;
        return parsets;
        };

        parsets.tension = function(_) {
        if (!arguments.length) return tension;
        tension = +_;
        return parsets;
        };

        parsets.duration = function(_) {
        if (!arguments.length) return duration;
        duration = +_;
        return parsets;
        };

        parsets.tooltip = function(_) {
        if (!arguments.length) return tooltip;
        tooltip = _ == null ? defaultTooltip : _;
        return parsets;
        };

        parsets.categoryTooltip = function(_) {
        if (!arguments.length) return categoryTooltip;
        categoryTooltip = _ == null ? defaultCategoryTooltip : _;
        return parsets;
        };

        function constant(x) {
        return function() {
        return x;
        };
        }

        var body = d3.select("body");
        var tooltip = body.append("div")
        .style("display", "none")
        .attr("class", "parsets tooltip");

        return rebind(parsets, event, "on").value(1);
        //.width(960).height(600);

        function rebind(target, source) {
        var i = 1,
        n = arguments.length,
        method;
        while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
        return target;
        };

        function d3_rebind(target, source, method) {
        return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
        };
        }

        function dimensionFormatName(d, i) {
        return dimensionFormat.call(this, d.name, i);
        }

        //    function showTooltip(html) {
        //      var m = d3.mouse(body.node());
        //      tooltip
        //          .style("display", null)
        //          .style("left", m[0] + 30 + "px")
        //          .style("top", m[1] - 20 + "px")
        //          .html(html);
        //    }

        function hideTooltip() {
        tooltip.style("display", "none");
        }

        function transition(g) {
        return duration ? g.transition().duration(duration).ease(parsetsEase) : g;
        }

        function layout(tree, dimensions, ordinal) {
            var nodes = [];
            var nd = dimensions.length;
            var y0 = 45;
            var dy = (height - y0 - 2) / (nd - 1);

            dimensions.forEach(function(d, i) {
                d.categories.forEach(function(c) {
                c.dimension = d;
                c.count = 0;
                c.nodes = [];
                });
                d.y = y0 + i * dy;
            });
            
            // Compute per-category counts.
            var total = (function rollup(d, i) {
                if (!d.children) return d.count;
                var dim = dimensions[i],
                total = 0;
                dim.categories.forEach(function(c) {
                var child = d.children[c.name];
                if (!child) return;
                c.nodes.push(child);
                var count = rollup(child, i + 1);
                c.count += count;
                total += count;
                });
                return total;
            })(tree, 0);

            // Stack the counts.
            dimensions.forEach(function(d) {
                d.categories = d.categories.filter(function(d) { return d.count; });
                var x = 0,
                p = spacing / (d.categories.length - 1);
                d.categories.forEach(function(c) {
                c.x = x;
                c.dx = c.count / total * (height - spacing);
                c.in = {dx: 0};
                c.out = {dx: 0};
                x += c.dx + p;
                });
            });

            var dim = dimensions[0];
            dim.categories.forEach(function(c) {
                var k = c.name;
                if (tree.children.hasOwnProperty(k)) {
                recurse(c, {node: tree.children[k], path: k}, 1, ordinal(k));
                }
            });

            function recurse(p, d, depth, major) {
                var node = d.node,
                dimension = dimensions[depth];
                dimension.categories.forEach(function(c) {
                var k = c.name;
                if (!node.children.hasOwnProperty(k)) return;
                var child = node.children[k];
                child.path = d.path + "\0" + k;
                var target = child.target || {node: c, dimension: dimension};
                target.x = c.in.dx;
                target.dx = child.count / total * (height - spacing);
                c.in.dx += target.dx;
                var source = child.source || {node: p, dimension: dimensions[depth - 1]};
                source.x = p.out.dx;
                source.dx = target.dx;
                p.out.dx += source.dx;

                child.node = child;
                child.source = source;
                child.target = target;
                child.major = major;
                nodes.push(child);
                if (depth + 1 < dimensions.length) recurse(c, child, depth + 1, major);
                });
            }
            
            return nodes;
        }

        // Dynamic path string for transitions.
//        function ribbonPath(d) {
//            var s = d.source;
//            var t = d.target;
//            
////            return ribbonPathString(s.node.x0 + s.x0, s.dimension.y0, s.dx, t.node.x0 + t.x0, t.dimension.y0, t.dx, tension0);
//            return ribbonPathString(s.node.x0 + s.x0, s.dimension.x, s.dx, t.node.x0 + t.x0, t.dimension.x, t.dx, tension0);
//
//        }
        function ribbonPath(d) {
            var path = [];
            
            path.push("M");
            path.push([dimensions[0].x, d.position[dimensions[0].name]]);
            
            for (var i = 1; i < dimensions.length; i++) {
                path.push("L");
                path.push([dimensions[i].x, d.position[dimensions[i].name]]);
            }
            
            path.push("v");
            path.push(d.size[dimensions[dimensions.length-1].name]);
            
            for (var i = dimensions.length-2; i >= 0 ; i--) {
                path.push("L");
                path.push([dimensions[i].x, d.position[dimensions[i].name] + d.size[dimensions[i].name]]);
            }
                
            path.push("Z");
            
//            console.log(path);
            
            return (path).join("");
            
//          // for each dimention do that then merge
            //return ribbonPathString(s.node.x0 + s.x0, s.dimension.x, s.dx, t.node.x0 + t.x0, t.dimension.x, t.dx, tension0);

        }

        // Static path string for mouse handlers.
        function ribbonPathStatic(d) {
            var s = d.source;
            var t = d.target;
            
            return ribbonPathString(s.node.x + s.x, s.dimension.y, s.dx, t.node.x + t.x, t.dimension.y, t.dx, tension);
        }

        function ribbonPathString(sx, sy, sdx, tx, ty, tdx, tension) {
            var m0, m1;
            
            return ([
            "M", [sy, sx],
            "L", [ty, tx],
            "v", tdx,
            "L", [sy, sx + sdx],
            "Z"]).join("");
        }

        function compareY(a, b) {
        a = height * a.y, b = height * b.y;
        return a < b ? -1 : a > b ? 1 : a >= b ? 0 : a <= a ? -1 : b <= b ? 1 : NaN;
        }
    };
             
    d3.parsets.tree = buildTree;

    function autoDimensions(d) {
        return d.length ? d3.keys(d[0]).sort() : [];
    }

    function cancelEvent() {
    d3.event.stopPropagation();
    d3.event.preventDefault();
    }

    function getTotal(dimensions) {
    return dimensions[0].categories.reduce(function(a, d) {
    return a + d.count;
    }, 0);
    }
    
    function getTotalA(list) {
        
        var nb = 0;
        
        list.forEach(function(el) {
            nb = nb + el.count;
        })
        
        return nb;
        
    }

    // Given a text function and width function, truncates the text if necessary to
    // fit within the given width.
    function truncateText(text, width) {
    return function(d, i) {
    var t = this.textContent = text(d, i),
    w = width(d, i);
    if (this.getComputedTextLength() < w) return t;
    this.textContent = "…" + t;
    var lo = 0,
    hi = t.length + 1,
    x;
    while (lo < hi) {
    var mid = lo + hi >> 1;
    if ((x = this.getSubStringLength(0, mid)) < w) lo = mid + 1;
    else hi = mid;
    }
    return lo > 1 ? t.substr(0, lo - 2) + "…" : "";
    };
    }

    var percent = d3.format("%"),
    comma = d3.format(",f"),
    parsetsEase = "elastic",
    parsetsId = 0;

    // Construct tree of all category counts for a given ordered list of
    // dimensions.  Similar to d3.nest, except we also set the parent.
    function buildTree(root, data, dimensions, value) {
    zeroCounts(root);

    var n = data.length;
    var nd = dimensions.length;

    for (var i = 0; i < n; i++) {

    var d = data[i];
    var v = value(d, i);
    var node = root;

    for (var j = 0; j < nd; j++) {

    var dimension = dimensions[j];
    var category = d[dimension];
    var children = node.children;

    node.count += v;
    node = children.hasOwnProperty(category) ? children[category]
    : children[category] = {
    children: j === nd - 1 ? null : {},
    count: 0,
    parent: node,
    dimension: dimension,
    name: category
    };
    }
    node.count += v;
    }
    return root;
    }

    function zeroCounts(d) {
    d.count = 0;
    if (d.children) {
    for (var k in d.children) zeroCounts(d.children[k]);
    }
    }

    function identity(d) { return d; }

    function translateY(d) { return "translate(0," + d.y + ")"; }
    function translateX(d) { return "translate(" + d.y + ", 0)"; }

    function defaultTooltip(d) {
    var count = d.count,
    path = [];
    while (d.parent) {
    if (d.name) path.unshift(d.name);
    d = d.parent;
    }
    return path.join(" → ") + "<br>" + comma(count) + " (" + percent(count / d.count) + ")";
    }

    function defaultCategoryTooltip(d) {
    return d.name + "<br>" + comma(d.count) + " (" + percent(d.count / d.dimension.count) + ")";
    }
})();