# PhotoRing

![Photoring live screenshot](/static/img/photoringLive.png)

You can see a live version of this app [here!](http://photoring.herokuapp.com)

PhotoRing is a tool that allows someone visualize and traverse a big repository of images across *all its dimensions*. It offers the user a sense of location within the dataset. A user can change dimensions, jump between sections and zoom in and out in order to see more or less photos. 


## How to run it


### Database configuration
Create an empty mySQL database with the name `photoring`.  In the scripts contained in the `/sqlscripts`directory which you need to run to deploy the project, , the database name is `photoring`. If you named your database differently, you must change the name in the scripts. 

Run the following scripts in the order below:

1. `create_tables.sql`. After running this script, insert the data into the table the script created (`photos`) using the method you prefer. 

2. `create_metadata_tables.sql`: This scripts create the necessary tables for the operation of Photoring.

Replace the configuration file `config.js` with the connection to the database you just created.

### Running the server

You must have Node.js installed on your machine. All the necessary dependencies are already located in the `node_modules` directory. Open a terminal in the directory of the proyect and run the following commands:

```
npm start
``` 
o
```
node server.js
```

The server should have started listening at http://:::8087 (localhost). If you want to change the listening port of the server, go to the `config.js` configuration file.


## How to use it



### Video on how to use Photoring 

Spanish [here](https://www.youtube.com/watch?v=PArgtZ5IpsU).

English [here](https://www.youtube.com/watch?v=PArgtZ5IpsU).


### Explanation

<img align="left;" width="400" height="400" src="/docs/msmonroe.png">

Images have metadata. For the image at the left, it looks like this:

```
<img align="left;" width="400" height="400" src="/docs/msmonroe.png"0">
```

* Title: Marilyn Monroe, actress, New York
* Identifier: 275101-28281
* Date: May 1957
* Authors: Richard Avendon
* Nationality: (American, 1923–2004)
* Camera: Canon-360ks
* Print: Gelatin silver print, printed 1989,
7 15/16 x 7 13/16" (20.2 x 19.8 cm)
* … And many more characteristics.

Photoring takes the characteristics of every photo/image in a collection and associates them with a dimension. For the image above, *Title*,  *Date*, *Authors*, *Nationality*, etc, all are going to become dimensions. You can traverse the dataset by any of these dimensions.

![Photoring screenshot with coloured boxes showing the 3 panels: Sections panel, action panels and visualization panel](/docs/photoringLiveBoxes.png)


When you open Photoring, it selects a dimension from the metadata of the photos randomly and then brings a batch of photos in the order given by that dimension.


In the picture above you can see 3 different colored boxes:

1. Box 1: Dimension sections panel: This panel shows the dimensions sections that the current dimensions has

2. Box 2: Actions panel

3. Box 3. Visualization panel











