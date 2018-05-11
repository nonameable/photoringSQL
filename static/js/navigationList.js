/* global d3: false, getUrlForPhoto: false, $: false */
/*jslint browser: true, indent: 4 */


function navigationList(selection) {
    "use strict";
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = 760,
        height = 120,
        focalShadow = 100,
        vecinitySize = 5,
        barWH = 50,
        // barWH = 25,
        // barWH = 1,
        pointR = 10,
        maxValues = height / barWH,


        label = function(d) { return d; },
        colScale = d3.scale.category20,
        direction = "vertical",
        xyScale = d3.fisheye.scale(d3.scale.linear),
        whScale,
        xyFocus,
        onClick = function () {},
        chart = {},
        data,
        currentValueI,
        currentValue,
        mouseFocusI;

    var svg = selection.
                append("g").attr("class", "navList");

        svg.append("rect")
            .attr("id", "navListbg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .style("fill", "white");

    var locationLayer = svg.append("g")
        .attr("id", "locationLayer")
        .attr("opacity", 1);

    // var locationBarLayer = d3.select(htmlID).append("canvas")
    //       .attr("id", "canvasDimensions")
    //       .attr("width", w*0.2)
    //       .attr("height", h);

    // var context = locationBarLayer.node().getContext("2d");

    // // Create an in memory only element of type 'custom'
    // var detachedContainer = document.createElement("custom");

    // // Create a d3 selection for the detached container. We won't
    // // actually be attaching it to the DOM.
    // var dataContainer = d3.select(detachedContainer);


    function filterData(centerI) {
        return function(d) {
            var abs = Math.abs(d.i - centerI);
            return Math.abs(d.i - currentValueI) < 1 || abs < vecinitySize || //not in the vecinity
                    Math.abs(xyScale(d.i) - xyScale(centerI)) >= focalShadow; //close to the focus

            // return 1;
        };
    }


    function pos(d) {
        // return fish({x:xyScale(d.i), y:0}).x;
        var abs = Math.abs(d.i - mouseFocusI);
        // if   {
        //     return xyScale(d,i)
        // }
        return (data.length < maxValues ||  //if we have a small number of labels
                abs >= vecinitySize ? //or we are in the vecinity
                    xyScale(d.i) : // use the normal scale
                    xyFocus(d.i) // otherwise use the artificial focus scale
            ) - barWH/2;
        // return xyScale(d.i);
    }



    function x(d) {
        return direction==="horizontal" ? pos(d) : 0;
    }

    function yBar(d) {
        return direction==="vertical" ? pos(d)  : -whScale(d.binCount);
    }

    function yText(d) {
        return direction==="vertical" ? pos(d)  : 0;
    }

    function barWidth(d) {
        return direction==="vertical" ? whScale(d.binCount) : (barWH-2);
    }

    function barHeight(d) {
        return direction==="horizontal" ? whScale(d.binCount) : (barWH-2) ;
    }

    chart.update = function(mdata, mcurrentValue) {

        // data = data.slice(0, 100);
        data = mdata;
        currentValue = mcurrentValue;
        console.log("navList.update data.length=" + data.length + " currentValue " + currentValue);
        mouseFocusI = currentValueI;
        redraw();
    };

    function redraw() {

        selection
            .attr("width", width)
            .attr("height", height);

        // Update the outer dimensions.
        svg.attr("width", width)
                .attr("height", height);
        svg.select("#navListbg")
            .attr("width", width)
            .attr("height", height)
            .on("mousemove", updateFocus)
            .on("mouseout", function (d) {
                console.log("moouse out");
                mouseFocusI = currentValueI;
                redraw();
            });


        // Update the inner dimensions.
        var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var values = data.map(label);
        currentValueI = values.indexOf(currentValue);

        var distortion = data.length  / maxValues;

        // xyScale = d3.fisheye.scale(d3.scale.linear)
        xyScale.range([10, direction === "vertical" ? height - 10 : width - 10])
                        .domain([0, data.length])
                        // .focus(300)
                        // .distortion(distortion);

        // xyScale = d3.scale.linear()
        //                 .range([10, direction === "vertical" ? height - 10 : width - 10])
        //                 .domain([0, data.length]);
        xyFocus  = d3.scale.linear()
                        .range([xyScale(mouseFocusI) - focalShadow, xyScale(mouseFocusI) + focalShadow])
                        .domain([mouseFocusI - vecinitySize, mouseFocusI + vecinitySize]);


        // var fish = d3.fisheye.circular().radius(15000).focus([xyScale(currentValueI), 0]);

        // xyScale.domainFocus(currentValueI);


        var mod = data.length < maxValues ?
                1: Math.floor(data.length / maxValues);

        // mod = 1;
        var binCount = 0;

        var sample = data.filter(function (d, i) {
                var cond = (mouseFocusI - vecinitySize <= i && i <= mouseFocusI + vecinitySize) || //Is the item in the vecinity?
                        i%mod === 0 || i === currentValueI || i === mouseFocusI ; //otherwise just sample
                d.i= i;

                binCount += d.count;
                d.binCount = d.count;
                if (cond) {
                        d.binCount = binCount;
                        binCount = 0;
                        return true;
                } else {

                        return false;
                }
                // // return  i%mod === 0; //otherwise just sample
                // return 1;
        });


        whScale = d3.scale.linear()
                        .range([0, 100])
                        .domain([0, d3.max(data, function (d) { return d.binCount; }) ]);

        var filteredSample = sample.filter(filterData(mouseFocusI))
            .sort(function (a, b) { //to draw the selected item last
                return a.i === currentValueI ? 1:
                    b.i === currentValueI ? -1 :
                    0;
            });
        // filterData(currentValueI)

        var locBarSel = locationLayer.selectAll(".dimBar")
                .data(filteredSample,
                        label);

        locBarSel.enter()
                .append("rect")
                .attr("class", "dimBar");

        locBarSel
                .attr("x", x)
                .attr("y", yBar)
                .attr("width", barWidth )
                .attr("height", barHeight)
                // .style("fill", function (d) { return colScale(label(d)); })
                .on("click", onClick)
                .on("mousemove", updateFocus);

        locBarSel.exit()
                .remove();


        var locPointSel = locationLayer.selectAll(".dimPoint")
                .data(filteredSample.filter(function (d) { //only those in the vecinity
                    var abs = Math.abs(d.i - currentValueI);
                    return  abs <= vecinitySize;
                }),
                        label);

        locPointSel.enter()
                .append("circle")
                .attr("class", "dimPoint");

        locPointSel

                .attr("cx", function (d,i) {
                    return x(d,i) - (direction==="vertical"?  barWH/2 : 0);
                 })
                .attr("cy", function (d,i) {
                    return yBar(d,i) + (direction==="vertical" ? barWH/2 : 0);
                 })
                .attr("r", function (d) {
                    return d.i === currentValueI ? pointR : pointR / 2 ;
                })
                .style("fill", function (d) { return colScale(label(d)); })
                .on("click", onClick)
                .on("mousemove", updateFocus);

        locPointSel.exit()
                .remove();

        // var locBarSel = dataContainer.selectAll(".dimBar")
        //     .data(sample, label);

        // locBarSel.enter()
        //     .append("custom")
        //     .attr("class", "rect dimBar");

        // locBarSel
        //     .attr("y", function (d) {
        //         // return fish({x:xyScale(d.i), y:0}).x;
        //         var abs = Math.abs(d.i - currentValueI);
        //         return (abs < vecinitySize ? xyFocus(d.i) : xyScale(d.i)) - 10;
        //         // return xyScale(d.i);
        //     })
        //     .attr("x", 0)
        //     .attr("width", function (d) {
        //         return whScale(d.count);
        //     })
        //     .attr("fillStyle", "#eee")
        //     .attr("height", 10)
        //     .on("click", jumpToDimensionValue);

        // locBarSel.exit()
        //     .remove();

        // drawCanvas();

        var locsSel = locationLayer.selectAll(".dimValue")
                .data(filteredSample,
                        label);

        locsSel.enter()
                .append("text")
                .attr("class", "dimValue");

        locsSel
                .attr("y", 0)
                .attr("x", 0)
                .attr("dy", direction === "vertical" ? barWH * 3/5  : 0 )
                .attr("dx", direction === "vertical" ? 0 : barWH * 3/5 )
                .style("font-weight", function (d, i) {
                        return  d.i === currentValueI ? "bold" : "normal";
                })
                // .style("font-size", function (d, i) {
                //         var abs = Math.abs(d.i - currentValueI);
                //         return  (abs < vecinitySize ? 20 - abs : 8) + "px";
                // })
                .text(label)
                .attr("transform", function (d) {
                    if ( direction === "horizontal" ) {
                        return "translate(" + x(d) + "," + yText(d) + ") rotate(-45)";
                    } else {
                        return "translate(" + x(d) + "," + yText(d) + ")";
                    }
                })
                .on("click", onClick)
                .on("mousemove", updateFocus);

        locsSel.exit()
                .remove();



    }

    function updateFocus(d) {


        var mouse = d3.mouse(document.getElementById("navListbg"));
        xyScale.focus(mouse[1]);
        mouseFocusI = Math.round(xyScale.scale().invert(mouse[1]));
        mouseFocusI = Math.min(mouseFocusI, data.length -1 );
        mouseFocusI = Math.max(mouseFocusI, 0);

        // console.log("Mouse move " + mouse[1]  + " - " + mouseFocusI );
        // console.log(data[mouseFocusI]);

        redraw();
    }
    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        maxValues = height / barWH;
        return chart;
    };

    chart.label = function(_) {
        if (!arguments.length) return label;
        label = _;
        return chart;
    };

    chart.direction = function(_) {
        if (!arguments.length) return direction;
        direction = _;
        return chart;
    };


    chart.focalShadow = function(_) {
        if (!arguments.length) return focalShadow;
        focalShadow = _;
        return chart;
    };

    chart.vecinitySize = function(_) {
        if (!arguments.length) return vecinitySize;
        vecinitySize = _;
        return chart;
    };

    chart.onClick = function(_) {
        if (!arguments.length) return onClick;
        onClick = _;
        return chart;
    };

    chart.colorScale = function(_) {
        if (!arguments.length) return colScale;
        colScale = _;
        return chart;
    };


    return chart;
}

