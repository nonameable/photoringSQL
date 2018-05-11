/*jslint browser: true, indent: 4 */
/* global d3: false, $: false, console: true, utils: true*/
"use strict";

//For interestingness
var VIEWS_CAP = 25,
    FAVORITES_CAP = 100,
    COMMENTS_CAP = 36;

var FlickrUtils = {};

FlickrUtils.getImgForPhoto = function (ID, server_ID, farm_ID, secret, size) {
    //TODO escape variables for security
    // return "https://farm" + farm_ID + "\.staticflickr.com/" + server_ID+ "/" + ID + "_" + secret + "_m.jpg";
    var u =  "https://farm".concat(Math.floor(farm_ID).toString());
    u +=  ".staticflickr.com/".toString() + server_ID+ "/" + ID + "_" + secret;
    size = size !== undefined ? size : 319;
    if (size <= 75) {
        u += "_s.jpg";
    } else if (size <= 150) {
        u += "_q.jpg";
    } else if (size <= 240) {
        u += "_m.jpg";
    } else if (size <= 320) {
        u += "_n.jpg";
    // } else if (size <= 500) {
    //     u += '\.jpg';
    } else if (size <= 640) {
        u += "_z.jpg";
    // } else if (size <= 800) {
    //     u += "_c.jpg";
    // } else if (size <= 1024) {
    //     u += "_b.jpg";
    // } else if (size <= 1600) {
    //     u += "_h.jpg";
    // } else if (size <= 2048) {
    //     u += "_k.jpg";
    } else {
        u += "_z.jpg";
    }
    return u;
};


FlickrUtils.getUrlForPhoto = function (ID, owner_ID) {
    //TODO escape variables for security
    return "https://www.flickr.com/photos/" + owner_ID + "/" + ID;
};

FlickrUtils.getAPIURL = function (key, secret, token, method, format) {
    // method = "flickr.stats.getPopularPhotos";
    // format = "json";
    var s = secret +
        "api_key" + key +
        "auth_token" + token +
        "method" + method +
        "format" + format;
    var u = "https://api.flickr.com/services/rest/?";
    u += "method=" + method ;
    u += "&api_key=" + key ;
    u += "&format=" + format ;
    u += "&auth_token=" + token ;
    u += "&api_sig=" + MD5(s);
    return u;
};

/**
*
*  MD5 (Message-Digest Algorithm)
*  http://www.webtoolkit.info/
*
**/

var MD5 = function (string) {

    function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
    }

    function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
     }

     function F(x,y,z) { return (x & y) | ((~x) & z); }
     function G(x,y,z) { return (x & z) | (y & (~z)); }
     function H(x,y,z) { return (x ^ y ^ z); }
    function I(x,y,z) { return (y ^ (x | (~z))); }

    function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }

    function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    };

    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray = Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
            lWordCount = (lByteCount-(lByteCount % 4))/4;
            lBytePosition = (lByteCount % 4)*8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
    };

    function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
            lByte = (lValue>>>(lCount*8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
    }

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    }

    var x = Array();
    var k,AA,BB,CC,DD,a,b,c,d;
    var S11=7, S12=12, S13=17, S14=22;
    var S21=5, S22=9 , S23=14, S24=20;
    var S31=4, S32=11, S33=16, S34=23;
    var S41=6, S42=10, S43=15, S44=21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

    for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
    }

    var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

    return temp.toLowerCase();
};

FlickrUtils.getGenericUrl = function (argsObj) {
    var url = "call.php?format=json&nojsoncallback=1&curl&auth_token=" + utils.getParameterByName("t");

    var argN, argV;
    for (argN in argsObj) {
        argV = argsObj[argN];
        url += "&" + argN + "=" + argV;
    }
    return url.replace(" ", "%20");
};

FlickrUtils.getUrl = function (sort, type, date, user, keyword, page, per_page) {
    var url;

    if (type === "search") {
        url = "call.php?method=flickr.photos.search&sort=interestingness-desc&safe_search=1&extras=count_views%2Ccount_faves%2Ccount_comments%2Cpath_alias&format=json&nojsoncallback=1&curl&auth_token="+ utils.getParameterByName("t");
    } else if (type === "magic") {
        url = "call.php?method=flickr.cameraroll.tags.getInitialData&curl&format=json&nojsoncallback=1&auth_token=" + utils.getParameterByName("t");
    } else if (type === "stats") {
        url = "call.php?method=flickr.stats.getPopularPhotos&curl&format=json&nojsoncallback=1&auth_token=" + utils.getParameterByName("t");
    } else {
        url = "call.php?method=flickr.interestingness.getList&safe_search=1&extras=count_views%2Ccount_faves%2Ccount_comments%2Cpath_alias&format=json&nojsoncallback=1&curl";
    }
    if (date !== undefined && date !== "") {
        url += "&date="+date;
    }

    if (user !== undefined && user !== "") {
        url += "&user_id="+user;
    }

    if (keyword !== undefined && keyword !== "") {
        url += "&text="+keyword.replace(" ", "+");
    }

    if (page !== undefined) {
        url += "&page="+page;
    }
    if (per_page !== undefined) {
        url += "&per_page="+per_page;
    } else {
        url += "&per_page=100";
    }

    if (type !== "search" && sort !== undefined) {
        url += "&sort="+sort;
    }

    return url;
};

FlickrUtils.getPhotosetsUrl = function (page, per_page) {
    var url;
    // license, date_upload, date_taken, owner_name, icon_server, original_format, last_update, geo, tags, machine_tags, o_dims, views, media, path_alias, url_sq, url_t, url_s, url_m, url_o

    url = "call.php?method=flickr.photosets.getList&format=json&nojsoncallback=1&curl&auth_token=" + + utils.getParameterByName("t");
    if (page !== undefined) {
        url += "&page="+page;
    }
    if (per_page !== undefined) {
        url += "&per_page="+per_page;
    } else {
        url += "&per_page=100";
    }

    url += "primary_photo_extras=license, date_upload, date_taken,icon_server, last_update, geo, tags, machine_tags, views, media, path_alias, url_sq, url_t, url_s, url_m, url_o";

    return url;
};


FlickrUtils.getTree = function (photos, attr, numPhotos, showPublic, showFamily, showFriends, showPrivate) {
    var children = [];
    var totalSize = 0;
    if (attr === undefined) {
        attr = "views";
    }
    if (numPhotos === undefined) {
        numPhotos = -1;
    }



    photos.forEach(function (d) {
        if ((!showPublic && d.ispublic) ||
            (!showFamily && d.isfamily) ||
            (!showPrivate && !d.isfamily && !d.ispublic && !d.isfriends) || //private is all in 0
            (!showFriends && d.isfriends) ) {
            return;
        }
        var node = {
            "id": d.id,
            "name": d.title,
            "img": function (w) { return FlickrUtils.getImgForPhoto(d.id, d.server, d.farm, d.secret, w); },
            "url": FlickrUtils.getUrlForPhoto(d.id, d.owner),

            "views":  d.stats!== undefined ? d.stats.views : d.count_views!==undefined ? +d.count_views : -1,
            "favorites":  d.stats!== undefined ? d.stats.favorites : d.count_faves!==undefined ? +d.count_faves :-1,
            "comments":  d.stats!== undefined ? d.stats.comments : d.count_comments!==undefined ? +d.count_comments :-1,


            "originalObj": d
        };

        node.sUrl = "http://research2.corp.gq1.yahoo.com/ykal/FlickrV/upload.php?id=&url=" + node.img;
        node.pInterestingness = Math.min(node.views, VIEWS_CAP) + Math.min(node.favorites, FAVORITES_CAP) + Math.min(node.comments, COMMENTS_CAP);
        node.value = node[attr] ;
        totalSize+=node.value;
        if (node.value <= 0 ) { node.value=1; } //To show some photos

        children.push(node);
        node.label = node.name + "<span class='hFiller'/>";
        node.labelValue = attr === "views" ? "<strong>" : "";
        node.labelValue += " <img src='img/view.png' alt='views count'/> " + node.views;
        node.labelValue += attr === "views" ? "</strong>" : "";
        node.labelValue += attr === "favorites" ? "<strong>" : "";
        node.labelValue += " <img src='img/fav.png' alt='favarites count'/> " + node.favorites;
        node.labelValue += attr === "favorites" ? "</strong>" : "";
        node.labelValue += attr === "comments" ? "<strong>" : "";
        node.labelValue += " <img src='img/comment.png' alt='comments count'/> " + node.comments;
        node.labelValue += attr === "comments" ? "</strong>": "";
        node.labelValue += attr === "pInterestingness" ? "<strong>" : "";
        node.labelValue += " I: " + node.pInterestingness;
        node.labelValue += attr === "pInterestingness" ? "</strong>": "";

    });

    children = children.sort(function (a, b) {
        return d3.descending(a[attr], b[attr]);
    });
    return {"name": "photos",
        "children": numPhotos !==-1 ? children.slice(0, numPhotos) : children, //Show all photos or just a selection
        "value": totalSize
    };
};


FlickrUtils.getPhotos = function (dataJson) {
    var photos;

    if (dataJson.hasOwnProperty("photos")) {
        photos = dataJson.photos.photo;
    } else if (dataJson.hasOwnProperty("photo")) {
        photos = dataJson.photo;
    } else {
        // alert("json file doesn't have a photos attribute, check the javascript console for a dump");
        console.error("json file doesn't have a photos attribute " + (dataJson.message!==undefined? dataJson.message : dataJson) );
        return;
    }

    photos.forEach(function (d) {
        d.views = d.stats!== undefined ? d.stats.views : d.count_views!==undefined ? +d.count_views : -1;
        d.favorites = d.stats!== undefined ? d.stats.favorites : d.count_faves!==undefined ? +d.count_faves :-1;
        d.comments = d.stats!== undefined ? d.stats.comments : d.count_comments!==undefined ? +d.count_comments :-1;
    });

    return photos;
};