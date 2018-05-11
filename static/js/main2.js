/*jslint browser: true, indent: 4 */
/* global d3: false, $: false, alert: false, TreeMap: false , FlickrUtils: true, console: true, utils: true */

"use strict"

function initialize() {

	var url = "photos?sortBy=count_faves&hasGeo=0";
	d3.json(url, function(err, json) { console.log(json); })
}