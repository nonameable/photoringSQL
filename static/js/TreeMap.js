/* global d3: false, getUrlForPhoto: false, $: false */
/*jslint browser: true, indent: 4 */


function TreeMap(htmlID) {
    "use strict";
    var self = this,
        width, height,
        color = d3.scale.category20c(),
        treemap,
        fScale,
        div;

    self.margin = {top: 10, right: 0, bottom: 0, left: 0};
    var TEXT_HEIGHT = 40;
    var MIN_SIZE_FOR_TEXT = 100;

    self.chainedAnimations = true;


    fScale = d3.scale.linear()
        .domain([10, 30000])
        .range([0.7, 10.0]);

    treemap = d3.layout.treemap()
        .sticky(true)
        .value(function (d) { return d.size; })
        .sort(function (a, b) { return d3.ascending(a.size, b.size); });

    self.padding = treemap.padding;
    self.treemap = treemap;
    self.loading = function () {
        div.select("#spinner").style("display", "inline");
    };

    self.init = function () {
        width = self.width !== undefined ? self.width : document.getElementById(htmlID.slice(1)).offsetWidth - self.margin.left - self.margin.right;
        height = self.height !== undefined ? self.height :  $(window).height() - 200 - self.margin.top - self.margin.bottom;


        div = d3.select(htmlID).append("div")
            .attr("id", "innerTreeMap");
        div.style("position", "relative")
            .style("width", (width + self.margin.left + self.margin.right) + "px")
            .style("height", (height + self.margin.top + self.margin.bottom) + "px")
            .style("left", self.margin.left + "px")
            .style("top", self.margin.top + "px");

        div.append("div")
            .attr("id", "spinner")
            .style("position", "absolute")
            .append("div")
                .attr("id", "spinnerBG")
                .style("width", (width ) + "px")
                .style("height", (height ) + "px")
                .style("left", "0px")
                .style("top", "0px" );

        div.select("#spinner")
            .append("img")
            .attr("src", "img/spinner.gif")
            .style("display", "inline")
            .style("position", "absolute")
            .style("left", (self.margin.left + width/2) + "px")
            .style("top", (self.margin.top +  height/2) + "px");


        treemap.size([width, height]);
        self.loading();
    };


    self.update = function (root) {
        div.select("#spinner")
            .style("display", "none");

        var nodes = treemap.nodes(root);

        treemap.sticky(true);
        var node = div.selectAll(".node")
            .data(nodes, function (d) { return d.id; } );

        fScale.domain(d3.extent(nodes, function (d) {
            return d.value;
        }));

        function nodeEnter() {
            console.log("Node Enter");
            var nodeDiv = node.enter()

                .append("div")
                .attr("class", function (d) { return "node treemapNode treemapNode" + d.id; })
                .attr("id", function (d) { return "node" + d.id; })
                .on("mouseover", function (d, i) {
                    if (d.children) { //don't hover on parents
                        return;
                    }
                    if (d.onMouseOver) {
                        return d.onMouseOver(d, i, this);
                    } else {
                        // d3.select("#albums").classed("selected", true);
                        d3.select(htmlID).classed("selected", true);
                        d3.selectAll(".treemapNode"+d.id).classed("selected", true);
                    }
                })
                .on("mouseout", function (d, i) {
                    if (d.children) { //don't hover on parents
                        return;
                    }
                    if (d.onMouseOut) {
                        return d.onMouseOut(d, i, this);
                    } else {
                        // d3.select("#albums").classed("selected", false);
                        d3.select(htmlID).classed("selected", false);
                        d3.selectAll(".treemapNode").classed("selected", false);
                    }
                })
                .on("click", function (d, i) {
                    if (d.children) { //for parents remove pointer events
                        return;
                    }
                    if (d.onClick) {
                        return d.onClick(d, i, this);
                    } else {
                        if (d3.event.shiftKey && d.sUrl) {
                            window.open(d.sUrl,'_blank');
                        } else if (d.url) {
                            window.open(d.url,'_blank');
                        }
                    }
                })
                .each(function (d) {
                    d.position = position;
                    if (d.children) { //for parents remove pointer events
                        d3.select(this)
                            .style("pointer-events", "none");
                    }
                })
                .style("width", "0px")
                .style("height", "0px");


            nodeDiv.each(function (d) {
                if (d.children) {//Do not add the nodeText to the parent nodes
                    return;
                }

                var nodeDiv = d3.select(this);

                nodeDiv.append("div")
                    .attr("class", "nodeBG");

                nodeDiv.append("div")
                    .attr("class", "nodeText")
                    // .style("font-size", function (d) {
                    //     return d.children ? null : fScale(d.value) + "em";
                    // })
                    .append("div")
                    .attr("class", "nodeTextTitle");
                nodeDiv.select(".nodeText")
                    .append("div")
                    .attr("class", "nodeTextValue");
            });

            nodeDiv
                .transition()
                .call(position);
        } //nodeEnter

        function nodeUpdate() {
            // nodeDiv.call(position);
            console.log("Node Update");
            node
                // .data(treemap.nodes)
                .transition()
                // .duration(1500)
                .call(position);

            node.select(".nodeTextTitle")
                .html(function (d) {
                        return d.children ? null : d.label;
                    });
            node.select(".nodeTextValue")
                .html(function (d) {
                        return d.children ? null : d.labelValue;
                    });
                // .transition()
                // .duration(1500)
                // .style("font-size", function (d) { return d.children ? null : fScale(d.value) + "em"; });
        } // nodeUpdate

        function nodeExit() {
            console.log("Node Exit");
            node.exit()
                .style("opacity", "1")
                .transition()
                .duration(750)
                .style("opacity", "0")
                .remove();
        } //nodeExit

        if (self.chainedAnimations) {
            //Chain the events nicely
            d3.transition().duration(500).each(function () {
                //Exit
                nodeExit();
            }).transition().duration(500).each(function () {

                //Update
                nodeUpdate();
            }).transition().duration(500).each(function () {
                //Enter
                nodeEnter();
            });
        } else {
            nodeExit();
            nodeUpdate();
            nodeEnter();
        }

    };



    var position = function (sel) {
        sel
            .transition()
            .duration(750)
            .style("left", function(d) { return d.x + "px"; })
            .style("top", function(d) { return d.y + "px"; })
            .style("width", function(d) { return Math.max(0, d.dx -1 ) + "px"; })
            .style("height", function(d) { return Math.max(0, d.dy -1) + "px"; });
        sel.select(".nodeBG")
            // .style("background-size", function (d) {
            //         return Math.max(0, d.dx - 1) + "px " + Math.max(0, d.dy - 1) + "px";
            //     })
            .style("background-color", function (d) { return d.children ? null : color(d.name); })
            .style("background-image", function (d) {
                if (d.img) {
                    return "url("+ d.img +")";
                } else {
                    return "";
                }
            });

        sel.select(".nodeText")
            .style("position", "relative")
            // .style("visibility", function (d) { return  (d.dx < MIN_SIZE_FOR_TEXT) ? "hidden" : "visible"; })
            .style("left", function(d) { return 0 + "px"; })
            .style("top", function(d) { return  Math.max(0, d.dy - 1) - TEXT_HEIGHT + "px"; });

        sel.select(".nodeTextTitle")
            .style("width", function(d) { return  Math.max(0, d.dx - 1) + "px"; });

    };

    self.nodePosition = position;
    return self;
}

