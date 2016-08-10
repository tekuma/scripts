/* This is a scripting framework for editing the firebase database.
* The framwork will take a "snapshot" of the current state of the database.
* use snapshot.val() to make a JSON of the db.
*  By: Stephen L. White  , stwhite@mit.edu
*/

const firebase = require("firebase");
const request  = require("request");
const jsonfile = require('jsonfile');

firebase.initializeApp({
  databaseURL   : "https://artist-tekuma-4a697.firebaseio.com",
  serviceAccount: "auth/googleServiceKey.json"
});

// take a snapshot of the current database
firebase.database().ref().once('value', (snapshot)=>{
    const oldDB = snapshot.val(); //make 2 copies
    let newDB   = snapshot.val();
    /// --------------------- Begin Scripting ---------------------------

    let publicNode  = oldDB["public"];
    let privateNode = oldDB["_private"];

    // copy age from public, delete from public, set in private.
    for (let uid in publicNode['onboarders']) { //for each user
        // $move DOB
        let age = oldDB['public']['onboarders'][uid]['dob'];
        delete    newDB['public']['onboarders'][uid]['dob'];
        newDB['_private']['onboarders'][uid]['dob'] = age;
        // $move over_eighteen
        let over = oldDB['public']['onboarders'][uid]['over_eighteen'];
        delete     newDB['public']['onboarders'][uid]['over_eighteen'];
        newDB['_private']['onboarders'][uid]['over_eighteen'] = over;
        // $move gender_pronoun
        let gen = oldDB['public']['onboarders'][uid]['gender_pronoun'];
        delete    newDB['public']['onboarders'][uid]['gender_pronoun'];
        newDB['_private']['onboarders'][uid]['gender_pronoun'] = gen;

        // $ change albums array to album field
        let artIDs = oldDB['public']['onboarders'][uid]['artworks'];
        if (artIDs != null) {
            for (let artID in artIDs) {
                if (newDB['public']['onboarders'][uid]['artworks'][artID]['albums']){
                delete newDB['public']['onboarders'][uid]['artworks'][artID]['albums'];
                let alb = oldDB['public']['onboarders'][uid]['artworks'][artID]['albums'][0];
                newDB['public']['onboarders'][uid]['artworks'][artID]['album'] = alb;
                //
                let col =[];
                for (let thing in oldDB['public']['onboarders'][uid]['artworks'][artID]['colors']) {
                    let hex = oldDB['public']['onboarders'][uid]['artworks'][artID]['colors'][thing]['hex'];
                    let color = {hex:hex};
                    col.push(color)
                }
                newDB['public']['onboarders'][uid]['artworks'][artID]['colors'] = col;
                }
            }
        }

        // change name
        newDB['public']['onboarders'][uid]['albums'][0]['name'] = "Miscellaneous";
        newDB['public']['onboarders'][uid]['albums'][0]['description'] = "";
        // add social media
        newDB['public']['onboarders'][uid]['social_media'] = {
            facebook: "",
            instagram: "",
            twitter: "",
            behance: "",
            pinterest: ""
        };

    }



    /// ------------------ END Scripting. ---------------------------
    var file = './dbs/database.json' // where to save json
    jsonfile.writeFile(file, newDB, {spaces: 2}, function(err) {
      console.error(err)
  });
    // after the JSON has been saved, you can import it directly from the firebase console.
    // We could set it from here, but over-writing the entire database is scary and should be
    // done manually.
}, (error)=>{
    console.log(error);
});
