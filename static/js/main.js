/*jslint browser: true, indent: 4, multistr: true */
/* global d3: false, $: false, alert: false, TreeMap: false , FlickrUtils: true, console: true, utils: true*/

function getWindowSize() {
    var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
    return {width: x, height:y};
}

var photoRing = '<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> \
        <g id="ring" sketch:type="MSArtboardGroup" fill="#500095"> \
            <path d="M500,950 C748.528137,950 950,748.528137 950,499.999999 C950,251.471863 748.528137,50 500,50 C251.471862,50 50,251.471863 50,499.999999 C50,748.528137 251.471862,950 500,950 L500,950 Z M500,924.197248 C734.277671,924.197248 924.197248,734.277671 924.197248,499.999999 C924.197248,265.722329 734.277671,75.8027523 500,75.8027523 C265.722329,75.8027523 75.8027523,265.722329 75.8027523,499.999999 C75.8027523,734.277671 265.722329,924.197248 500,924.197248 L500,924.197248 Z" id="Ring" sketch:type="MSShapeGroup"></path> \
            <path d="M402.624938,60.6038634 L439.128091,24.1007108 L559.576484,24.1007108 L597.375062,61.8992892 L402.624938,60.6038634 Z" id="Path" sketch:type="MSShapeGroup"></path> \
        </g> \
    </g>';
//<object originalPhotos="plot1.svg" width="500" height="320" type="image/svg+xml" />


//Main
(function () {
    "use strict";

    var DEBUG = false;

    var NUM_LABELS = 10;

    var NUM_COLS = 1;
    var NUM_ROWS = 1;

    var MAX_PAGE_SIZE = 7;

    var PAGE_GAP = 0;

    var showRing = false;

    var currentPhotoI = 0;
    var originalPhotos =[];
    var data;
    var reloading = false;
    var direction = "vertical";

    var zoom = d3.behavior.zoom()
        .scaleExtent([1,20])
        .on("zoom", zoomed);
    var drag = d3.behavior.drag()
        .on("dragstart", onDragStart)
        .on("dragend", onDragEnd);


    var xDragStart; // To keep track of dragging

    // var dimensionTypes = ["camera", "autotag","tag", "month taken", "album"];
    // var dimensionTypes = ["bookdecade", "booksubject", "bookauthor", "bookyear",  "tag", "autotag"];
    var dimensionTypes = ["autotag"];
    // var dimensions = ["bookdecade", "booksubject", "bookauthor", "bookyear",  "tag"];
    // var dimensions = ["camera", "autotag","tag", "month taken", "album"];

    var ignoredDimensions = ["month created", "month taken", "month/year taken",
        "month/year created", "bookleafnumber", "booksponsor"];
    var dimensions;
    var currentDimension;
    var changingDimensionCount = 0; //Counter used to loop through the dimensions,
    //when the photo doesn't have the other dimensions
    var redraw = true; // Should we redraw after getting new originalPhotos?

    var showDimensionValues = false;

    var htmlID = "#mainContainer";
    var htmlIDNavList = "#leftPane";
    var margin = {top: 0, right: 0, bottom: 0, left: 0};
    var totalW, totalH, w, h; //all set in updateScreenSize();



    var hammermc = new Hammer(document.getElementById("mainContainer"));
    hammermc.on('pinch', function(ev) {
        console.log(ev);
    });

    hammermc.on('rotatestart rotatemove', function (ev) {
        var initAngle, newAngle;
        var currentAngle = ringAngleScale(currentDimension.split(":")[0]);

        if(ev.type == 'rotatestart') {
            initAngle = currentAngle;
        }

        newAngle = initAngle + ev.rotation;

        dimensions.sort(function (a, b) {
            return Math.abs(ringAngleScale(a) - newAngle) < Math.abs(ringAngleScale(b) - newAngle);
        });
        currentDimension = ringAngleScale.reverse(newAngle);
        updateRing();
    });


    var svg = d3.select(htmlID)
        .append("svg");
    var svgNavList = d3.select(htmlIDNavList)
        .append("svg");
    var photosLayer = svg.append("g")
        .attr("id", "photosLayer")
        .call(zoom)
        .call(drag);

    svg.append("defs")
        .append("g")
        .attr("id", "ring")
        .html(photoRing);

    var ringLayer = svg.append("g")
        .attr("id", "ringLayer")
        .attr("opacity", 0.5);

    ringLayer.append("use")
        .attr("id", "ringInstance")
        .attr('xlink:href', "#ring")
        .attr("transform", "translate(" + ringX()  +
                "," +  ringY() +
                ") scale(" + ringSize() + ") ");


    var dimName = d3.select("#dimensionName");

    updateScreenSize();

    var ringNeedsUpdate = false;

    var ringAngleScale = d3.scale.ordinal().rangePoints([0, 330]);

    // var photowidth =  (w * 0.8) / NUM_COLS;
    var photowidth =  (h * 0.8) / NUM_ROWS;
    var xScale = d3.scale.linear();
    var pageScale = d3.scale.linear().domain([0,4]);
    var yScale = d3.scale.linear();

    var colScale = d3.scale.category20();

    var navMargin = {top: 0,
        right: 0, bottom: 0, left: 25};
    var navList = navigationList(svgNavList)
        .label(function (d) { return d.dimension_value; })
        // .width(totalW)
        .width(document.getElementById(htmlIDNavList.slice(1)).offsetWidth)
        .height(h + margin.top + margin.bottom - navMargin.top)
        .direction(direction)
        .margin(navMargin)
        // .numLabels(NUM_LABELS)
        // .margin({top: (h + margin.top + margin.bottom -10), right: 0, bottom: 0, left: 25})
        .onClick(jumpToDimensionValue);




    function updateScreenSize () {
        var wSize = getWindowSize();
        totalW = wSize.width / 24 * 18;
        totalH = wSize.height - 80; //Give some space for the icons

        margin = direction === "vertical" ?
            {top: 0, right: 0, bottom: 0, left: 0} :
            {top: 0, right: 0, bottom: 200, left: 0};

        w = totalW - margin.left - margin.right;
        h = totalH - margin.top - margin.bottom ;



        svg.style("width", totalW - 1 + "px")
            .style("height", (h + margin.top + margin.bottom - 5) + "px");

        photosLayer.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // updateRing();

        // updateWithCurrentPhoto();

        // dimName.style("left", 20 + "px" )
        //         .style("top", (margin.top + document.getElementById("mainContainer").offsetTop) + "px");
                // .style("top", ((direction === "vertical") ?
                //     (margin.top + document.getElementById("mainContainer").offsetTop) :
                //     ((h + margin.top + margin.bottom) - 70))+ "px");
                //horizontal
                // .style("top", (h + margin.top + margin.bottom) - 70 + "px");

        console.log("Update Screen size totalW " + totalW + " totalH " + totalH);
    }

    $(window).on("resize", function() {
        updateScreenSize();
        // reload();
    });

    setupButtons();


    function setupButtons() {
        d3.select("#previousDimensionButton").on("click", previousDimension);
        d3.select("#nextDimensionButton").on("click", nextDimension);
        d3.select("#previousSectionButton").on("click", previousDimensionValue);
        d3.select("#previousPhotoButton").on("click", previousPhoto); //previousPage
        d3.select("#nextPhotoButton").on("click", nextPhoto); //nextPage
        d3.select("#nextSectionButton").on("click", nextDimensionValue);
        d3.select("#zoomOutButton").on("click", zoomOut);
        d3.select("#zoomInButton").on("click", zoomIn);
        // d3.select("#searchButton").on("click", previousDimension);

    }

    //Returns true if there is an error
    var checkForErrorsInResponse = function (error, mdata) {
        if (error || mdata.error) {
            if (mdata && mdata.error ==="NO_PHOTO" && changingDimensionCount !== 0) {
                //This photo doesn't have that dimension, try again
                console.log("Dimension wasn't found, trying next one");
                reloading = false;

                //Have we exhausted our options?
                if (Math.abs(changingDimensionCount) >= (dimensions.length - 1) ) {
                    changingDimensionCount = 0;
                    alert("This photo doesn't have more dimensions");
                    return true;
                } else {
                    if (changingDimensionCount>0) {
                        nextDimension();
                    } else {
                        previousDimension();
                    }
                }
                return true;
            } else {
                alert("Error getting originalPhotos");
                reloading = false;
                console.error(error);
                if (mdata && mdata.exception) {
                    console.error(mdata.exception);
                }
                return true;
            }

        }

        if (mdata.photos.length === 0) {
            reloading = false;
            alert("No photos found!");
            return true;
        }

        return false;
    };

    var callbackPhotos = function (error, mdata) {
        if (checkForErrorsInResponse(error, mdata)) {
            console.log("error in response inside callbackPhotos")
            return;
        }

        if (redraw) {
            currentPhotoI = mdata.center;
            console.log("currentPhotoI: " + currentPhotoI);
        }

        data = mdata;
        //If we make it this far, we were able to
        changingDimensionCount = 0;


        if (redraw) {
            originalPhotos = mdata.photos;
        } else {
            originalPhotos = originalPhotos.concat(mdata.photos);
        }

        console.log("---------------- MDATA --------------------");
        console.log(mdata);
        console.log("------------------------------------");

        console.log(" callbackPhotos originalPhotos.length " + originalPhotos.length);

    	// originalPhotos.forEach(function (d) {
    	// 	d.farm = (+d.server.slice(0,1) + 1) % 10;
    	// });

        updateWithCurrentPhoto();

        setInputEvents();

        reloading = false;
    };

    var callbackPhotosLeft = function (error, mdata) {
        if (checkForErrorsInResponse(error, mdata)) {
            return;
        }

        data = mdata;

        if (redraw) {
            originalPhotos = mdata.photos;
        } else {
            originalPhotos = mdata.photos.concat(originalPhotos);
            currentPhotoI += mdata.photos.length; //move the currentPhotoI
        }

        console.log(" callbackPhotosLeft originalPhotos.length " + originalPhotos.length);

        // originalPhotos.forEach(function (d) {
        //     d.farm = (+d.server.slice(0,1) + 1) % 10;
        // });

        updateWithCurrentPhoto();

        reloading = false;
    };

    var setInputEvents = function () {

        d3.select("body").on("keydown", function (e) {
            if (reloading) return;
            if (DEBUG) console.log(d3.event.keyCode);
            if (d3.event.keyCode===39) { //right
                if (d3.event.shiftKey) {
                    nextDimensionValue();
                } else if (d3.event.altKey) {
                    nextPhoto();
                } else {
                    nextPage();
                }

            } else if (d3.event.keyCode===37) { //left
                if (d3.event.shiftKey) {
                    previousDimensionValue();
                } else if (d3.event.altKey) {
                    previousPhoto();
                } else {
                    previousPage();
                }
            } else if (d3.event.keyCode===38) { //up
                previousDimension();
            } else if (d3.event.keyCode===40) { //down
                nextDimension();
            } else if (d3.event.keyCode===189) { //+
                zoomIn();
            } else if (d3.event.keyCode===187) { //-
                zoomOut();
            } else if (d3.event.keyCode===68) { //d
                DEBUG = !DEBUG;
                updateWithCurrentPhoto();
            } else if (d3.event.keyCode===72) { //d
                direction = direction === "horizontal" ? "vertical" : "horizontal";
                updateScreenSize();
                updateWithCurrentPhoto();
            }


        });

        d3.select("#searchQuery").on("change", search);
    };




    function ringX() {
        return (margin.left + w / 2 - Math.min(w,h) / 2 / NUM_COLS);
    }

    function ringY() {
        return ( margin.top  + h /2 - Math.min(w,h) / 2 / NUM_ROWS );
    }

    function ringSize() {
        return Math.min(w,h) / 1000 / NUM_COLS;
    }

    var textX = function (d) {
        var centerX = totalW/2,
            r = Math.min(w,h)*0.8/2;
        return  centerX  +
            (direction === "vertical" ? -1 :  1) *
            r * Math.cos(ringAngleScale(d.split(":")[0]) * Math.PI / 180);
    };
    var textY = function (d) {
        // var centerY = margin.top +(h)/2,
        var centerY = totalH/2,
            r = Math.min(w,h)*0.8/2;
        return  centerY +
            (direction === "vertical" ? 1 :  -1) *
            r * Math.sin(ringAngleScale(d.split(":")[0]) * Math.PI / 180);
    };
    var textAnchor = function (d) {
        var dName = d.split(":")[0];
        return ringAngleScale(dName) === 180 || ringAngleScale(dName) === 0  ? "middle" :
            (ringAngleScale(dName) > 0 && ringAngleScale(dName) < 180) ?
                "start" :
                "end";
    };

    var yPhoto = function (d,i) {
        var page = Math.floor(i/(NUM_ROWS*NUM_COLS)) ; //Page number
        var pageI = i  % (NUM_ROWS*NUM_COLS) ; // Page position
        // console.log("yPhoto " + Math.floor(pageI / NUM_COLS) + " pageI " + pageI  +  " page " + page + " i " + i );


        return yScale(Math.floor(pageI / NUM_COLS)) +
            (direction === "vertical" ? pageScale(page) :  0);

        //horizontal
        // return yScale(Math.floor(pageI / NUM_COLS));
    };

    var xPhoto = function (d,i) {
        var page = Math.floor(i/(NUM_ROWS*NUM_COLS)); //Page number
        var pageI = i  % (NUM_ROWS*NUM_COLS); // Page position

        return xScale(pageI % NUM_COLS) +
            (direction === "horizontal" ? pageScale(page) :  0);

        //horizontal
        //return xScale(pageI % NUM_ROWS) + pageScale(page);
    };

    function onClickPhoto(d) {
        if (reloading) return;
        currentPhotoI = originalPhotos.indexOf(d);
        updateWithCurrentPhoto();
    }

    function updateRing() {
        console.log("-----Dimensions in map ------");
        console.log(dimensions);
        console.log("-----------");
        ringAngleScale.domain(dimensions.map(function (d) { return d.split(":")[0]; }));

        ringLayer.select("#ringInstance")
            .transition().duration(1000)
            .attr("transform", "translate(" + ringX()  +
                "," +  ringY() +
                ") scale(" + ringSize() + ") ");


        var ringTransition = ringLayer
        .transition().duration(100)
            .style("opacity", 0.5)
        .transition().duration(250)
            .call(function () {
                d3.select("#ring").transition()
                    .attrTween("transform", function (d, i, a) {
                        return d3.interpolateString(a,
                            "rotate("+ ringAngleScale(currentDimension.split(":")[0]) +", 500, 500)"
                    );
                });
            });

        if (!showRing) {
            ringTransition.transition().duration(2000)
                .style("opacity", 0) ;
        }
        //Text
        var selDimLab = ringLayer.selectAll(".dimensionLabel")
            .data(dimensions);
        selDimLab.enter()
            .append("text")
            .attr("class", "dimensionLabel")
            .on("click", onClickOnDimensionValue);
        selDimLab.text(function (d) { return d.split(":")[0] + ": " + atob(d.split(":")[1]); })
            .attr("x", textX)
            .attr("y", textY)
            .style("background-color", "white")
            .attr("text-anchor", textAnchor)
            .style("font-weight", function (d) {
                return d === currentDimension ? "bold" : "normal";
            })
            .style("font-size", function (d) {
                return d === currentDimension ? "150%" : "";
            })
            ;
        selDimLab.exit().remove();

    }

    function updateDimensionsOptions (photos) {

        console.log("!!!!!!!%%%%%%%%%%%%%%%%%%%%% dimensions %%%%%%%%%%%%%%%%%%%");
        console.log(dimensions);
        console.log("!!!!!!!!!%%%%%%%%%%%%%%%%%%%% current dimension %%%%%%%%%%%%%%%%%%%");
        console.log(currentDimension);
        // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        // console.log("---------&&&&currentPhotoI &&&&&------------");
        // console.log(originalPhotos[currentPhotoI]);
        // console.log("---------&&&&&&&&&------------");

        
        dimensions = originalPhotos[currentPhotoI]
            .all_tags.split(",")
            .filter(function (d) { return ignoredDimensions.indexOf(d.split(":")[0])=== -1; });

        // console.log("!!!!!!!%%%%%%%%%%%%%%%%%%%%% dimensions AFTER %%%%%%%%%%%%%%%%%%%");
        // console.log(dimensions);

        if (currentDimension === undefined) {
            console.log("entra al if dentro de updateDimOptions. currentDimension es undefined")
            currentDimension = dimensions[0];
        }
        // console.log("---------&&&& ??? currentDimension &&&&&------------");
        // console.log(currentDimension);
        // console.log("---------&&&&&&&&&------------");


        // t creo que nunca entra aqui
        if (dimensions.indexOf(currentDimension)===-1) {
            console.log("weird code reached due to base64 enconding");
            var dimensionName = currentDimension.split(":");
            // console.log("---------&&&& dimension Name &&&&&------------");
            // console.log(dimensionName);
            // console.log("---------&&&&&&&&&------------");
            //Find other dimension value for this dimension name
            var dimNameI = dimensions.map(function (d) { return d.split(":"); }).indexOf(dimension_name);
            if (dimNameI!== -1) {
                currentDimension = dimensions[dimNameI];
            } else {
                //I give up :(. Not anymore.
                
                currentDimension = dimensions[0];
                console.log("se rinde :( currentDimension queda:")
                console.log(currentDimension)
            }

        }

        var dimensionNames = d3.set(dimensions.map(function (d) {
                    return d.split(":")[0];
                })).values();
        var dimSel = d3.select("#dimensionNameSelect").selectAll("option")
            .data(dimensionNames, function (d) { return d});

        dimSel.enter().append("option");
        dimSel.text(function (d) { return d; });
        dimSel.exit().remove();

        dimName.text(originalPhotos[currentPhotoI].dimension_name);
    }

    function update(photos, pos) {
        console.log("start update")
        if (currentPhotoI!==undefined && originalPhotos[currentPhotoI]) {
            //Why does currentPhotoI become undefined?????
            var currentPhoto = originalPhotos[currentPhotoI];
            currentDimension = currentPhoto.dimension_name + ":" + btoa(currentPhoto.dimension_value);
        }
        updateDimensionsOptions(photos);
        // if (ringNeedsUpdate) {
            updateRing();
            ringNeedsUpdate = false;
        // }

        //Update scales
        var pageSize = (Math.min(w,h)*0.8 - PAGE_GAP );

        // photowidth =  pageSize / NUM_COLS;
        photowidth =  pageSize / Math.max(NUM_ROWS, NUM_COLS) ;

        pageScale.range([
            (direction === "vertical" ? h: w) /2 -  (5/2 * pageSize) - (2 * PAGE_GAP) ,
            (direction === "vertical" ? h: w) /2 +  (3/2 * pageSize) + (2 * PAGE_GAP) ] );

        xScale.domain([0, NUM_COLS])
            .range(direction === "vertical" ?
                    [(w - pageSize)/2,
                    (w - pageSize)/2 + pageSize] :
                    [ 0, pageSize]
                );
            //horizontal
            // .range([ 0, pageSize]);
        console.log("update photowidth" + photowidth + " pageSize " + pageSize);


        yScale.domain([0, NUM_ROWS])
            .range(direction === "vertical" ?
                    [0, pageSize] :
                    [(h - pageSize)/2, (h - pageSize)/2 + pageSize]
                );
            //horizontal
            // .range([(h - pageSize)/2,
            //     (h - pageSize)/2 + pageSize]);

        var selPhotos = photosLayer.selectAll(".photo")
            .data(photos, function (d) { return "" + d.photo_id + "|" + d.dimension_name + "|" + d.dimension_value ; });

        var selPhotosEnter = selPhotos.enter()
            .append("g")
                .attr("class", "photo")
                .attr("transform", function (d, i) {
                    return "translate (" + xPhoto(d, i) + "," + yPhoto(d, i) + ")";
                })
                .on("click", onClickPhoto);
        selPhotosEnter.append("rect");
        selPhotosEnter.append("image");



        if (DEBUG) {
            selPhotosEnter.append("text");
        }


        selPhotos.select("image")
        .attr("xlink:href", function (d) {
            return d.ThumbnailURL; //FlickrUtils.getImgForPhoto(d.photo_id, d.server, d.farm, d.secret, photowidth);
        });

        selPhotos.select("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", photowidth + 1 )
            .attr("height", photowidth + 1 )
            .style("fill", function (d) {
                return colScale(d.dimension_value);
            });

        selPhotos.transition().duration(250)
            .attr("transform", function (d, i) {
                return "translate (" + xPhoto(d, i) + "," + yPhoto(d, i) + ")";
            }).select("image")
            .attr("width" , photowidth - 5)
            .attr("height" , photowidth - 5)
            // .attr("opacity", function (d) {
            //     return d.photo_id !== originalPhotos[currentPhotoI].photo_id ?
            //         0.3 :
            //         1;
            // });
        if (DEBUG) {
            var pages = photosLayer.selectAll(".page")
                .data([0,1,2,3,4]);
            var pagesEnter = pages.enter().append("g")
                .attr("class", "page");
            pagesEnter.append("rect");
            pagesEnter.append("text");
            pages.select("rect").transition().duration(500)

                .attr("x", function (d) { return xScale(0) +
                    (direction === "vertical" ? 0 :  pageScale(d)); })
                .attr("y", function (d) { return yScale(0) +
                    (direction === "vertical" ? pageScale(d) : 0 );  })
                //Horizontal
                // .attr("x", function (d) { return xScale(0) + pageScale(d); })
                // .attr("y", function (d) { return yScale(0); })
                .attr("stroke", "steelblue")
                .attr("fill", "none")
                .attr("width", pageSize)
                .attr("height", pageSize);
            pages.select("text")
                .attr("x", function (d) { return xScale(0) +
                    (direction === "vertical" ? 0 :  pageScale(d)); })
                .attr("y", function (d) { return yScale(0) +
                    (direction === "vertical" ? pageScale(d):  0 ); })
                //Horizontal
                // .attr("x", function (d) { return xScale(0) + pageScale(d); })
                // .attr("y", function (d) { return yScale(0) + 20; })
                .style("font-size", 50)
                .style("fill", "purple")
                .text(function (d) { return d; } );
        } else {
            photosLayer.selectAll(".page").remove();
        }

        if (DEBUG) {
            selPhotos.select("text")
                .attr("y", photowidth/2)
                .attr("x", photowidth/2)
                .style("font-size", 50)
                .style("fill", "red")
                .text( function (d) { return d.pos; });
        } else {
             selPhotos.selectAll("text").remove();
        }

        selPhotos.exit().remove();

        if (data.dimension_values) {
            // updateDimensions(data.dimension_values);

            navList
                .direction(direction)
                .width(document.getElementById(htmlIDNavList.slice(1)).offsetWidth)
                .height(totalH)
                .colorScale(colScale)
                // .margin(navMargin)
                .update(data.dimension_values,
                originalPhotos[currentPhotoI].dimension_value);
        }
        reloading = false;
        console.log("finish update")
    }

    function previousDimension() {
        if (reloading) return;
        reloading = true;
        var nextDimensionIndex =  (dimensions.indexOf(currentDimension) - 1 + dimensions.length) % dimensions.length;
        changingDimensionCount-=1;
        currentDimension = dimensions[nextDimensionIndex];

        var currentPhotoID=originalPhotos[currentPhotoI].photo_id;
        console.log("previousDimension currentPhotoI = " + currentPhotoI + " changingDimensionCount" + changingDimensionCount);
        ringNeedsUpdate = true;
        reload(currentPhotoID, atob(currentDimension.split(":")[1]), true);
    }

    function nextDimension() {
        if (reloading) return;
        reloading = true;
        console.log("%%%%%%%%%%%%%%%%%%%%% dimensions %%%%%%%%%%%%%%%%%%%");
        console.log(dimensions);
        console.log("%%%%%%%%%%%%%%%%%%%%% current dimension %%%%%%%%%%%%%%%%%%%");
        console.log(currentDimension);
        console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");

        var nextDimensionIndex =  (dimensions.indexOf(currentDimension) + 1) % dimensions.length;
        changingDimensionCount+=1;
        currentDimension = dimensions[nextDimensionIndex];

        var currentPhotoID=originalPhotos[currentPhotoI].photo_id;
        console.log("nextDimension currentPhotoI = " + currentPhotoI + " changingDimensionCount " + changingDimensionCount);
        ringNeedsUpdate = true;
        reload(currentPhotoID, atob(currentDimension.split(":")[1]), true);
    }

    function onClickOnDimensionValue(d) {
        if (reloading) return;
        reloading = true;
        var nextDimensionIndex =  dimensions.indexOf(d);
        currentDimension = dimensions[nextDimensionIndex];

        var currentPhotoID=originalPhotos[currentPhotoI].photo_id;
        console.log("onClickOnDimensionValue currentPhotoI = " + currentPhotoI + " changingDimensionCount" + changingDimensionCount);
        ringNeedsUpdate = true;
        reload(currentPhotoID, atob(currentDimension.split(":")[1]), true);
    }

    function previousPage() {
        if (reloading) return;
        reloading = true;
        currentPhotoI-= NUM_ROWS * NUM_COLS;
        console.log("previousPage " + currentPhotoI);
        updateWithCurrentPhoto();
    }

    function nextPage() {
        if (reloading) return;
        currentPhotoI+= NUM_ROWS * NUM_COLS;
        console.log("nextPage " + currentPhotoI);
        updateWithCurrentPhoto();
    }

    function previousPhoto() {
        if (reloading) return;
        reloading = true;
        currentPhotoI-= 1;
        console.log("previousPhoto " + currentPhotoI);
        updateWithCurrentPhoto();
    }

    function nextPhoto() {
        if (reloading) return;
        currentPhotoI+= 1;
        console.log("nextPhoto " + currentPhotoI);
        updateWithCurrentPhoto();
    }

    function nextDimensionValue() {
        if (reloading) return;
        reloading = true;
        var values = data.dimension_values.map(function (d) { return d.dimension_value; });
        var currentValueI = values.indexOf(originalPhotos[currentPhotoI].dimension_value);
        var nextValueI = currentValueI + 1;

        if (nextValueI > data.dimension_values.length) nextValueI = 0;
        var newDimensionID = data.dimension_values[nextValueI].min_dimension_id;
        console.log("next dimension_value: " + data.dimension_values[nextValueI].dimension_value);
        // reloadWithDimensionId(newDimensionID);
        currentDimension = data.dimension_values[nextValueI].dimension_name + ":" + data.dimension_values[nextValueI].dimension_value;
        reloadWithDimensionId(newDimensionID);
        // reloadWithDimensionValue(data.dimension_values[nextValueI].dimension_value);
    }

    function previousDimensionValue() {
        if (reloading) return;
        reloading = true;
        var values = data.dimension_values.map(function (d) { return d.dimension_value; });
        var currentValueI = values.indexOf(originalPhotos[currentPhotoI].dimension_value);
        var nextValueI = currentValueI - 1;

        if (nextValueI < 0 ) nextValueI =  data.dimension_values.length;
        var newDimensionID = data.dimension_values[nextValueI].min_dimension_id;
        console.log("previous dimension_value: " + data.dimension_values[nextValueI].dimension_value);
        currentDimension = data.dimension_values[nextValueI].dimension_name + ":" + data.dimension_values[nextValueI].dimension_value;
        reloadWithDimensionId(newDimensionID);

        // reloadWithDimensionValue(data.dimension_values[nextValueI].dimension_value);
    }

    function jumpToDimensionValue(d) {
        if (reloading) return;
        reloading = true;
        var values = data.dimension_values.map(function (d) { return d.dimension_value; });
        var currentValueI = values.indexOf(d.dimension_value);
        var newDimensionID = data.dimension_values[currentValueI].min_dimension_id;
        currentDimension = d.dimension_name + ":" + d.dimension_value;
        console.log("jumpToDimensionValue dimension_value: " + data.dimension_values[currentValueI].dimension_value);
        reloadWithDimensionId(newDimensionID);
    }

    function updateWithCurrentPhoto() {
        if (originalPhotos.length <= (currentPhotoI + NUM_COLS * NUM_ROWS * 5) ) {
            getMorePhotos(false);
            return;
        } else if ( (currentPhotoI - NUM_COLS * NUM_ROWS) <0)  {
            getMorePhotosLeft(false);
            return;
        }

        var dataToShow = originalPhotos.slice(Math.max(0, currentPhotoI - Math.floor(NUM_COLS * NUM_ROWS * 2.5)),
            currentPhotoI + Math.floor(NUM_COLS * NUM_ROWS * 2.5));
        dataToShow.forEach(function (d, i) {
            // d.pos = i + (currentPhotoI < 2*NUM_COLS*NUM_ROWS ? currentPhotoI : NUM_COLS*NUM_ROWS*2);
            d.pos = i + (currentPhotoI < 2.5*NUM_COLS*NUM_ROWS ?
                Math.floor(2.5 * NUM_COLS * NUM_ROWS - currentPhotoI) :
                0);
            // d.pos = i + 2*NUM_COLS*NUM_ROWS;
        });
        update(dataToShow);
    }

    function getCurrentDimensionName() {
        var dimension_name;
        if (currentDimension === undefined) {
            dimension_name = dimensionTypes[0];
        } else {
            dimension_name = currentDimension.split(":")[0];
        }
        return dimension_name;
    }

    function reloadRandom() {
        var url = "getRandomPhotos";
        d3.json(url, callbackPhotos);
    }

    function reload(photo_id, dimension_value, mRedraw) {
        var dimension_name = getCurrentDimensionName();

        var url = "getPhotos?";
        var firstParam = true;

        if (dimension_name!==undefined) {
            url += "dimension=" + encodeURIComponent(dimension_name);
            firstParam= false;
        }
        if (dimension_value!==undefined) {
            if (!firstParam) { url+="&"; }
            url += "dimension_value=" + encodeURIComponent(dimension_value);
            firstParam = false;
        }
        reloading = true;
        if (photo_id) {
            if (!firstParam) { url+="&";}
            url +="current_photo_id=" + photo_id;
            firstParam = false;
        }
        redraw = mRedraw !== undefined ? mRedraw: true;
        console.log("reload photo_id=" + photo_id + " dimension_value=" +
            dimension_value + " dimension_name=" + dimension_name + " url=" + url);
        d3.json(url, callbackPhotos);
    }

    function reloadWithDimensionValue(dimension_value, mRedraw) {
        return reload(undefined, dimension_value, mRedraw);
    }

    function reloadWithDimensionId(dimension_id, mRedraw) {
        reloading = true;
        // console.log("reloadWithDimensionId dimension_id=" + dimension_id );
        var url = "getPhotos?dimension=" + getCurrentDimensionName();
        redraw = mRedraw !== undefined ? mRedraw: true;

        url +="&dimension_id=" + dimension_id;
        console.log("reloadWithDimensionId dimension_id=" + dimension_id  + " url=" + url);
        d3.json(url, callbackPhotos);

    }

    function reloadWithDimensionIdRight(dimension_id, mRedraw) {
        reloading = true;
        // console.log("reloadWithDimensionId dimension_id=" + dimension_id );
        var url = "getNextPhotos?dimension=" + getCurrentDimensionName();
        redraw = mRedraw !== undefined ? mRedraw: true;

        url +="&dimension_id=" + dimension_id;
        console.log("reloadWithDimensionId Right dimension_id=" + dimension_id  + " url=" + url);
        d3.json(url, callbackPhotos);

    }

    function reloadWithDimensionIdLeft(dimension_id, mRedraw) {
        reloading = true;
        var url = "getPreviousPhotos";
        redraw = mRedraw !== undefined ? mRedraw: true;

        url +="?dimension_id=" + dimension_id;
        console.log("reloadWithDimensionIdLeft dimension_id=" + dimension_id  + " url=" + url);
        d3.json(url, callbackPhotosLeft);
    }


    function zoomIn() {
        if (reloading) return;

        if (NUM_COLS< MAX_PAGE_SIZE && NUM_ROWS<MAX_PAGE_SIZE) {
            reloading = true;
            NUM_ROWS += 2;
            NUM_COLS += 2;
            updateWithCurrentPhoto();

        }
    }

    function zoomOut() {
        if (reloading) return;

        if (NUM_COLS>1 && NUM_ROWS>1) {
            reloading = true;
            NUM_ROWS -= 2;
            NUM_COLS -= 2;
            updateWithCurrentPhoto();
        }
    }

    function zoomed() {
        if (reloading) return;
        var newCols = Math.floor(zoom.scale()) * 2 - 1;
        if (newCols >= 1 && newCols < MAX_PAGE_SIZE) {
            reloading = true;
            NUM_COLS = newCols;
            NUM_ROWS = NUM_COLS;
            updateWithCurrentPhoto();
            console.log("Zoom " + NUM_COLS);
        } else {
            console.log("Zoomed out of range " + zoom.scale());
        }

    }

    function onDragStart() {
        console.log("Drag start x " + d3.event.sourceEvent.x + " y " + d3.event.sourceEvent.y);
        xDragStart = d3.event.sourceEvent.x;
    }

    function onDragEnd() {
        console.log("Drag end x " + d3.event.sourceEvent.x + " y " + d3.event.sourceEvent.y);
        if (d3.event.sourceEvent.x < xDragStart) {
            nextPage();
        } else  if (d3.event.sourceEvent.x > xDragStart) {
            previousPage();
        }
    }

    function search() {
        var query = d3.select("#searchQuery").property("value");
        console.log("Search " + query);
        reload(undefined, query, true);
    }

    function getMorePhotos(redraw, ID) {
        redraw = redraw === undefined ? false: redraw;
        ID = ID === undefined ? originalPhotos[originalPhotos.length-1].dimension_id: ID;
        console.log("getting more photos redraw="+ redraw + " dimension_id " + ID);
        reloadWithDimensionIdRight(ID, redraw);
    }


    function getMorePhotosLeft(redraw, ID) {
        redraw = redraw === undefined ? false: redraw;
        ID = ID === undefined ? originalPhotos[0].dimension_id: ID;
        console.log("getting more photos LEFT redraw="+ redraw + " dimension_id " + ID);
        reloadWithDimensionIdLeft(ID, redraw);
    }

    ringNeedsUpdate = true;
    reloadRandom(); // initial


    // function drawCanvas() {

    //   // clear canvas
    //   context.fillStyle = "#fff";
    //   context.rect(0, 0,
    //     locationBarLayer.attr("width"),
    //     locationBarLayer.attr("height"));
    //   context.fill();

    //   var elements = dataContainer.selectAll("custom.rect");
    //   elements.each(function(d) {
    //     var node = d3.select(this);

    //     context.beginPath();
    //     context.fillStyle = node.attr("fillStyle");
    //     context.rect(node.attr("x"), node.attr("y"), node.attr("width"), node.attr("height"));
    //     context.fill();
    //     context.closePath();

    //     });
    // }
}()); //main
