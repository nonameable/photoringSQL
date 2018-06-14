# PhotoRing

![GitHub Logo](/static/img/photoringLive.png)

You can see a live version of this app [here!](http://photoring.herokuapp.com)

PhotoRing is a tool that allows someone visualize and traverse a big repository of images across *all its dimensions* without losing context. 


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


## Vocabulary
Let’s define some of the terms in that definition:

Image: This image has tags and natural dimensions associated with it:

### Natural dimensions: 

Author, Date taken, camera, location, picture properties such as opacity, brightness, etc. This natural dimensions usually apply to most if not all images in the dataset. By "apply" I mean an image has a value associated to that dimension.

### Tags: 

Tags are associated keywords with each image. 

### Context:

 Set of variables that completely describe the current position and interaction of the user with the dataset. The exact variables that made up context are not defined yet. 

### Visualize: 

Once the user is positioned in a certain place of the dataset (which has a context associated with it), he can see the images at multiple focus levels: 1 picture, 10, 100 pictures. This feature is similar to zoom it/out the photos library on iOS. How much can a user zoom out?

### Traverse: 

The user is able to move continuously across the dataset. Also, he can jump between “places”, keeping context between the jumps. This means, a user can go back to the previous place he was in. Can he go back further than that?








