/*jslint browser: true, devel: true, indent: 4, multistr: true */
/* global d3, require */


var config  = require('./config');

var express = require('express');
var mysql      = require('mysql');

var app = express();


// configure URL for AmazonRDS or Local mySQL database
connectionURL= process.env.MYSQL_DATABASE_URL || config.mySQLURL;

// var mysqlParams = {
//   host     : 'localhost',
//   user     : 'root',
//   password : 'simplePass',
//   database : 'photoring2',
// };

function getMysqlConnection() {
  var connection = mysql.createConnection(connectionURL);

  connection.connect(function(err) {
    // connected! (unless `err` is set)
    if (err!==null)  {
      console.error("Error connecting to mysql" );
      console.error(err);
      return;
    }

  });

}

function handle_database(req,res) {

    pool.getConnection(function(err,connection){
        if (err) {
          connection.release();
          res.json({"code" : 100, "status" : "Error in connection database"});
          return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query("select * from user",function(err,rows){
            connection.release();
            if(!err) {
                res.json(rows);
            }
        });

        connection.on('error', function(err) {
              res.json({"code" : 100, "status" : "Error in connection database"});
              return;
        });
  });
}

var obj;
var LIMIT = 500;

function getIndexOfDimensionID (rows, dimension_id) {
  dimension_id = +dimension_id;
  var foundit = false;
  var curr ;
  var w = rows.length;
  var i = Math.floor(w/2), pi;
  while (!foundit) {
    pi =i;
    curr = rows[i];
    w = w/2;
    if (w < 0.5) {
      console.log("Couldn't find it " + i);
      return i;
    }
    if (curr.dimension_id === dimension_id) {
      foundit=true;
      console.log("Found it " + i);
      return i;
    } else if (curr.dimension_id > dimension_id) {
      //search left
      i = Math.round(i - w/2);
      if (pi === i && i>0) { i -=1 ; }
    } else {
      i = Math.round(i + w/2);
      if (pi === i && i<rows.length-1) { i +=1 ; }
    }
    console.log(pi + " " + curr.dimension_id + " " +  dimension_id );
  }
  return -1;
}

function getDimensionCounts(dimension_name, callback) {
  var result;
  console.log("getDimensionCounts " + dimension_name);
  connection.query('SELECT dimension_name, dimension_value, count, min_dimension_id from dimensionValueCounts \
      where dimension_name = ? order by dimension_value',
      [ dimension_name], function(err, rows, fields) {
        if (err) {
          console.log("ERROR: getDimensions Error querying dimension_name +  " + photo_name);
          console.error(err);
          result = {error:"MYSQL_ERROR", exception:err};
          return;
        } else if (rows.length<1) {
          console.log("ERROR: getDimensions Couldn't find dimension_name +  " + photo_name);
          console.log(err);
          result = {error:"NO_DIMENSION"};
          return;
        } else {
          result = rows;
          numberOfRows = rows.length;
          console.log("obtained dimension counts from DB. Size: " + numberOfRows);
        }

        callback(result);
    });


  return;

}


function returnNextPhotosFromDimensionID(res, dimension_id) {
  // console.log(dimension_id);
  console.log("returnPhotosFromDimensionID  "  +
     " dimension_id=" + dimension_id);

  connection.query('SELECT * from photoDimensionAllTags \
            where dimension_id > ? \
          order by dimension_id limit ' + LIMIT , [dimension_id],
    function(err, rows, fields) {
      var result = {}, dimension_name;
      var rowI;
      if (err) {
        result.exception = err;
        result.error = "MYSQL_ERROR";
        console.error("Failed");
        console.error(err);
        res.end(JSON.stringify(result));
        return;
      }
      result.photos = rows;
      dimension_name = rows[0].dimension_name; // rows[0] is undefined sometimes?
      getDimensionCounts(dimension_name, function (dimension_values) {
        result.dimension_values = dimension_values;
        res.end(JSON.stringify(result));
      });
  });
}

function returnPreviousPhotosFromDimensionID(res, dimension_id) {
  // console.log(dimension_id);
  console.log("returnPreviousPhotosFromDimensionID  "  +
     " dimension_id=" + dimension_id);

  connection.query('SELECT * FROM (SELECT * from photoDimensionAllTags \
            where dimension_id < ? \
          order by dimension_id DESC limit ' + LIMIT  + ') as t \
          ORDER BY dimension_id', [dimension_id],
    function(err, rows, fields) {
      var result = {}, dimension_name;
      var rowI;
      if (err) {
        result.exception = err;
        result.error = "MYSQL_ERROR";
        console.error("Failed");
        console.error(err);
        res.end(JSON.stringify(result));
        return;
      }
      result.photos = rows;
      dimension_name = rows[0].dimension_name;
      getDimensionCounts(dimension_name, function (dimension_values) {
        result.dimension_values = dimension_values;
        res.end(JSON.stringify(result));
      });
  });
}

function returnPhotosFromDimensionID(res, dimension_id) {
  // console.log(dimension_id);
  console.log("returnPhotosFromDimensionID  "  +
     " dimension_id=" + dimension_id);

  connection.query('(SELECT * from photoDimensionAllTags \
            where dimension_id >= ? \
          order by dimension_id ASC limit ' + LIMIT/2 + ' )\
      UNION\
      (SELECT * from photoDimensionAllTags \
            where dimension_id < ? \
          order by dimension_id DESC limit ' + LIMIT/2 + ' )\
      order by dimension_id', [dimension_id, dimension_id],
    function(err, rows, fields) {
      var result = {}, dimension_name;
      var rowI;
      if (err) {
        result.exception = err;
        result.error = "MYSQL_ERROR";
        console.error("Failed");
        console.error(err);
        res.end(JSON.stringify(result));
        return;
      }
      result.photos = rows;
      rowI = getIndexOfDimensionID(rows, dimension_id);
      console.log("getIndexOfDimensionID dimension_id = " + dimension_id + " center =" + rowI);
      result.center = rowI;
      dimension_name = rows[rowI].dimension_name;
      result.center = rowI;
      getDimensionCounts(dimension_name, function (dimension_values) {
        result.dimension_values = dimension_values;
        res.end(JSON.stringify(result));
      });
  });
}


function returnPhotosFromDimensionData(res, dimension_name, dimension_id) {
  // console.log(dimension_id);
  console.log("returnPhotosFromDimensionData  " + " dimension_name=" + dimension_name +
     " dimension_id=" + dimension_id);

  connection.query('(SELECT * from photoDimensionAllTags  \
  where dimension_name = ? and dimension_id >= ?  \
order by dimension_id ASC limit ' + LIMIT/2 + ') \
UNION  \
(SELECT * from photoDimensionAllTags  \
where dimension_name = ? and dimension_id < ? \
order by dimension_id DESC limit ' + LIMIT/2 + ') \
  ORDER by dimension_id', [dimension_name, dimension_id, dimension_name, dimension_id], function(err, rows, fields) {
      var result = {};
    if (err) {
      result.exception = err;
      result.error = "MYSQL_ERROR";
      console.error("Failed");
      console.error(err);
      res.end(JSON.stringify(result));
      return;
    }
    result.photos = rows;
    rowI = getIndexOfDimensionID(rows, dimension_id);
    console.log("getIndexOfDimensionID dimension_id = " + dimension_id + " center =" + rowI);
    result.center = rowI;
    getDimensionCounts(dimension_name, function (dimension_values) {
      result.dimension_values = dimension_values;
      res.end(JSON.stringify(result));
    });
  });
}

function returnPhotosFromDimensionValue(res, dimension_name, dimension_value) {
  // console.log(dimension_id);
  console.log("returnPhotosFromDimensionValue  " + " dimension_name=" + dimension_name +
     " dimension_value=" + dimension_value);
  connection.query("SELECT * from photoDimensionAllTags\
      where dimension_name = ? and dimension_value like ? \
    order by dimension_id \
    limit " + LIMIT, [dimension_name, dimension_value], function(err, rows, fields) {
      var result = {};
    if (err) {
      result.exception = err;
      result.error = "MYSQL_ERROR";
      console.error("Failed");
      console.error(err);
      res.end(JSON.stringify(result));
      return;
    }
    result.photos = rows;
    rowI = getIndexOfDimensionID(rows, dimension_id);
    console.log("getIndexOfDimensionID dimension_id = " + dimension_id + " center =" + rowI);
    result.center = rowI;
    getDimensionCounts(dimension_name, function (dimension_values) {
      result.dimension_values = dimension_values;
      res.end(JSON.stringify(result));
    });
  });
}


function returnPhotosFromDimensionNameAndPhotoID(res, photo_id, dimension_name) { // photo_id es unico, entonces no veo porque...
    console.log("returnPhotosFromDimensionNameAndPhotoID  " + " dimension_name=" + dimension_name +
      " photo_id=" + photo_id);

    connection.query("SELECT dimension_id from photoDimension \
    where photo_id = ? and dimension_name = ?",
    [photo_id, dimension_name], function(err, rows, fields) {
      if (err) {
        console.log("ERROR: returnPhotosFromDimensionNameAndPhotoID Error querying photo_id +  " + photo_id);
        console.error(err);
        res.end(JSON.stringify({error:"MYSQL_ERROR", exception:err}));
        return;
      } else if (rows.length<1) {
        console.log("ERROR: returnPhotosFromDimensionNameAndPhotoID Couldn't find photo with photo_id +  " + photo_id);
        console.log(err);
        res.end(JSON.stringify({error:"NO_PHOTO"}));
        return;
      } else {
        dimension_id = rows[0].dimension_id;
      }


      returnPhotosFromDimensionData(res, dimension_name, dimension_id);
  });
}

function returnPhotosFromDimensionNameValueAndPhotoID(res, photo_id, dimension_name, dimension_value) { // photo_id es unico, entonces no veo porque...
    console.log("returnPhotosFromDimensionNameValueAndPhotoID  " + " dimension_name=" + dimension_name +
          " photo_id=" + photo_id + " dimension_value=" + dimension_value);
    connection.query("SELECT dimension_id from photoDimension \
    where photo_id = ? and dimension_name = ? and dimension_value = ?",
    [photo_id, dimension_name, dimension_value], function(err, rows, fields) {
      if (err) {
        console.log("ERROR: returnPhotosFromDimensionNameValueAndPhotoID Error querying photo_id +  " + photo_id);
        console.error(err);
        res.end(JSON.stringify({error:"MYSQL_ERROR", exception:err}));
        return;
      } else if (rows.length<1) {
        console.log("ERROR: returnPhotosFromDimensionNameValueAndPhotoID Couldn't find photo with photo_id +  " + photo_id);
        console.log(err);
        res.end(JSON.stringify({error:"NO_PHOTO"}));
        return;
      } else {
        dimension_id = rows[0].dimension_id;
      }


      returnPhotosFromDimensionData(res, dimension_name, dimension_id);
  });
}




app.use(express.static('static'));

app.get('/', function (req, res) {
  // res.setHeader('Content-Type', 'application/json');
  console.log("index");
  res.sendFile(__dirname + '/static/index.html');
});



//Returns the neighborhood of the given parameters
app.get("/getPhotos", function (req, res) {
  var dimension_name = req.query.dimension;
  var dimension_value = req.query.dimension_value;
  var dimension_id = req.query.dimension_id || 0;
  console.log("getNextPhotos " +  " dimension_name:" + dimension_name +
    " dimension_value:" + dimension_value+
    " dimension_id:" + dimension_id);
  var photo_id;

  if (dimension_value!== undefined && req.query.current_photo_id!== undefined) {
    photo_id = req.query.current_photo_id;
    returnPhotosFromDimensionNameValueAndPhotoID(res, photo_id, dimension_name, dimension_value);

  } else if (req.query.current_photo_id !== undefined) {
    photo_id = req.query.current_photo_id;
    returnPhotosFromDimensionNameAndPhotoID(res, photo_id, dimension_name);

  } else if (req.query.dimension!== undefined && req.query.dimension_value!== undefined) {
    dimension_value = req.query.dimension_value;
    returnPhotosFromDimensionValue(res, dimension_name, dimension_value);

  } else {
    returnPhotosFromDimensionData(res, dimension_name, dimension_id);
  }
}); //getNextPhotos


//Get the photos before the given dimension_id
app.get("/getPreviousPhotos", function (req, res) {
  var dimension_id = req.query.dimension_id || 0;
  console.log("getPreviousPhotos "  +  " dimension_id:" + dimension_id);
  var photo_id;

  returnPreviousPhotosFromDimensionID(res, dimension_id);

}); //getNextPhotos


//Get the photos after the given dimension_id
app.get("/getNextPhotos", function (req, res) {
  var dimension_id = req.query.dimension_id || 0;
  console.log("getNextPhotos "  +  " dimension_id:" + dimension_id);
  var photo_id;

  returnNextPhotosFromDimensionID(res, dimension_id);

}); //getNextPhotos




app.get("/getRandomPhotos", function (req, res) {

    connection.query("SELECT min(dimension_id) as min, max(dimension_id) as max FROM photoDimensionAllTags",
     function(err, rows, fields) {
      var min_dimension_id, max_dimension_id, dimension_id;
      if (err) {
        console.log("ERROR: getting min and max dimension_id ");
        console.error(err);
        res.end(JSON.stringify({error:"MYSQL_ERROR", msg:"getting min and max dimension_id", exception:err}));
        return;
      }
      min_dimension_id = +rows[0].min;
      max_dimension_id = +rows[0].max;
      dimension_id = Math.floor(Math.random() * (max_dimension_id - min_dimension_id) + min_dimension_id);
      console.log("getRandomPhotos dimension id min=" + min_dimension_id + " max " + max_dimension_id + " returning photos for id = " + dimension_id);

      returnPhotosFromDimensionID(res, dimension_id);
    });//callback

}); //getRandomPhotos


  var connection = mysql.createConnection(connectionURL);

  connection.connect(function(err) {
    // connected! (unless `err` is set)
    if (err!==null)  {
      console.error("Error connecting to mysql" );
      console.error(err);
      return;
    }


    console.log("Starting web server");
    var theport = process.env.PORT || config.port;
    var server = app.listen(theport, function () {

      var host = server.address().address;
      var port = server.address().port;

      console.log('Example app listening at http://%s:%s', host, port);

    });

  });









