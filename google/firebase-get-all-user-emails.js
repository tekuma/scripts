/* This is a script grabbing all the users' email and their legal_name
* and store them into a csv file
* The framwork will take a "snapshot" of the current state of the database.
* use snapshot.val() to make a JSON of the db.
*  By: Stephen L. White  , stwhite@mit.edu
*/

const firebase = require("firebase");
const request  = require("request");
const jsonfile = require('jsonfile');

const fs = require("fs");
const csv = require("fast-csv");

fs.mkdir('userData',function(err){
  if (err) {
    console.log("...");
    return console.error("Didn't make a new folder becuase the data folder exists!");
  }
    console.log("Directory created successfully!");
});


firebase.initializeApp({
  databaseURL   : "https://artist-tekuma-4a697.firebaseio.com",
  serviceAccount: "auth/googleServiceKey.json"
});

// take a snapshot of the current database
firebase.database().ref().once('value', (snapshot) => {
    const oldDB = snapshot.val(); //make 2 copies
    let newDB   = snapshot.val();

    let priVal = newDB._private.onboarders;
    let publicVal = newDB.public.onboarders;
    let publicValArr = [];
    for (var obj in publicVal) {
      publicValArr.push([
        obj,                            // UID
        publicVal[obj].display_name,    // Display Name
        publicVal[obj].joined,          // Time account Created
        priVal[obj].email               // Email
      ]);
    }
      console.log(publicValArr.length); // Number of Users In Total

    setTimeout(function(){
      var fileName = Date() + ".csv";
      var ws = fs.createWriteStream("userData/" + fileName);
      csv
         .write(publicValArr, {headers: false})
         .pipe(ws);
    //  console.log(scrapeData);
  },6000);


}, (error)=>{
    console.log(error);
});
