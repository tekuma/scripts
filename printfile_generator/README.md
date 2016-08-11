# Printfile Gen v1.0

#### Tekuma Printfile Generator Script

## Usage: 

This script will open a file from the "in" directory and save a printfile to "out"

To run the script, first

```Bash
$ npm install 
```
to install dependencies ( JIMP: The JavaScript Photo Editor)

<https://github.com/oliver-moran/jimp> 

Then, open the printfile.js file, scroll towards the bottom of the file, and fill in the parameters:

```Javascript
let artist_uid  = "",
let artwork_uid = "",
let artist_name = "",
```
Note that other parameters such as ratios are set within the createPrintFile method.

To execute, run 

```Bash
$ node printfile.js
```
