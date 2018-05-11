/* global d3: false, getUrlForPhoto: false, $: false */
/*jslint browser: true, indent: 4 */


function Galleries(htmlID) {
    "use strict";
    var self = this,
        width, height,
        div;

    self.margin = {top: 10, right: 0, bottom: 0, left: 0};

    self.loading = function () {
        div.select("#spinner").style("display", "inline");
    };

    self.init = function () {
        width = self.width !== undefined ? self.width : document.getElementById(htmlID.slice(1)).offsetWidth - self.margin.left - self.margin.right;
        height = self.height !== undefined ? self.height :  $(window).height() - 200 - self.margin.top - self.margin.bottom;


        div = d3.select(htmlID).append("div")
        //     .attr("id", "innerTreeMap");
        // div.style("position", "relative")
        //     .style("width", (width + self.margin.left + self.margin.right) + "px")
        //     .style("height", (height + self.margin.top + self.margin.bottom) + "px")
        //     .style("left", self.margin.left + "px")
        //     .style("top", self.margin.top + "px");

        // div.append("div")
        //     .attr("id", "spinner")
        //     .style("position", "absolute")
        //     .append("div")
        //         .attr("id", "spinnerBG")
        //         .style("width", (width ) + "px")
        //         .style("height", (height ) + "px")
        //         .style("left", "0px")
        //         .style("top", "0px" );

        // div.select("#spinner")
        //     .append("img")
        //     .attr("src", "img/spinner.gif")
        //     .style("display", "inline")
        //     .style("position", "absolute")
        //     .style("left", (self.margin.left + width/2) + "px")
        //     .style("top", (self.margin.top +  height/2) + "px");


        // treemap.size([width, height]);
        // self.loading();
    }; //init


    self.update = function (data) {

        var galleries = d3.selectAll(".gallery")
            .data(data, function (d) {return d.id;});

        var galleriesEnter = galleries.enter()
            .append("div")
            .attr("class", "gallery")
            .attr("id", function (d) { return "gallery"+d.id; });

        galleriesEnter.append("div")
            .attr("class", "title");

        galleriesEnter.append("img")
            .attr("class", "cover");

        galleries.exit().remove();

        galleries.select(".cover")
            .attr("src", function (d) {return d.primary_photo_extras.url_m; });

        galleries.select(".title")
            .text(function (d) { return d.title._content; });


    }; //update


    return self;
}

