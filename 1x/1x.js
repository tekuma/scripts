const firebase = require("firebase");
const request  = require("request");
const jsonfile = require('jsonfile');

// Written by Stephen White
// This file is a framework for using the IX API/

// These are tekuma's specific access keys to the 1x API
const header  = {
    'X-1XCOM-API-KEY' : "5cfaf0de18758f4ce8488cf0e330da51",
    'X-1XCOM-AUTH-KEY':"5cfaf0de18758f4ce8488cf0e330da51"
};

// scrape, recursiveScrape, and buildDB are chained together to handle
// asynchronously scraping paginated data from their API and log it into a
// JSON to save to the CWD ./dbs. Call 'scrape();' to execute.
scrape = () => {
    let start = 0;
    let count = 0;
    let db    = {
        products: {},
        authors : []
    }
    console.log(">>>Begining Scrape---");
    recursiveScrape(start,count,db);
}

recursiveScrape = (pageNum, count, db)=> {
    let uri = `https://api3.1x.com/v1/prints?page=${pageNum}&results_per_page=100`;
    let params = {
        url     : uri,
        headers : header,
        method  : "POST"
    };


    callback = (err,res,rawBody)=>{
        console.log("in callback");
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            console.log('-----');
            console.log(e);
            console.log(rawBody);
        }

        if (body.status == "200") {
            console.log("200");
            // more results, recurse
            buildDB(body.photos, db);
            recursiveScrape(pageNum+1,count,db);
        } else if (body.status == "402") {
            // break out, no more pages
            console.log("DONE:");
            var file = './dbs/1x-db.json'; // where to save json
            jsonfile.writeFile(file, db, {spaces: 2}, function(err) {
              console.error(err)
            });

        } else {
            console.log(err);
            console.log(">>ERROR");
        }
    };

    console.log(">>Requesting page:", pageNum);
    request(params, callback);
}

buildDB = (page, db) => {
    for (let id in page) {
        console.log(">building an object for", id);
        let info = page[id];

        let colorObj = [];
        if (info.colors != ""){
            let cols = info.colors.split(',');
            for (var i = 0; i < cols.length; i++) {
                let col = {
                    hex:cols[i]
                };
                colorObj.push(col);
            }
        }

        let tagObj   = [];
        if (info.tags != "" && info.tags != null && info.tags != undefined) {
            let tags = info.tags.split(',');
            for (var i = 0; i < tags.length; i++) {
                let tag = {
                    id  : i+1,
                    text: tags[i]
                };
                tagObj.push(tag);
            }
        }

        let obj  = {
            album                : "n/a",
            catagory             : info.category_name,
            artist               : info.author_userid,
            colors               : colorObj,
            description          : info.desc,
            filename             : "",
            fullsize_url         : info.image_fullsize_url,
            image_fullsize_width : info.image_fullsize_width,
            image_fullsize_height: info.image_fullsize_height,
            id                   : "0",
            onex_id              : info.id,
            tags                 : tagObj,
            thumbnail            : info.image_squarethumb_url,
            title                : info.title,
            safe                 : info.safe,
            size                 : info.pixels,
            orientation          : info.orientation,
        };


        if (db['products'].hasOwnProperty(info.author_userid)) {
            db['products'][info.author_userid][id] = obj;
        } else {
            db['products'][info.author_userid] = {};
            db['products'][info.author_userid][id] = obj;
        }
    }
};


// Search is a framework for querying the 1x API in real time.
// see @ https://api3.1x.com/v1-docs/   for more about methods
search = () => {
    var file = './dbs/1x-db.json'; //load local copy of DB

    // let urlBase = `https://api3.1x.com/v1/prints?page=${222}&results_per_page=1`;
    // let urlBase = `https://api3.1x.com/v1/photoinfo?id=${id}`;147251
    // let urlBase = `https://api3.1x.com/v1/profile?id=${id}`;
    // let urlBase = `https://api3.1x.com/v1/categories`;
    // let urlBase = `https://api3.1x.com/v1/profile?id=${id}`;

    jsonfile.readFile(file, (err, db)=>{
        let arr = Object.keys(db.products);
        let count =0;

        for (let id of arr) {
            // let urlBase = `https://api3.1x.com/v1/categories`;
            request({
                url     : urlBase,
                headers : header,
                method  : "POST",
            }, (err,res,body)=>{
                count++
                let results = JSON.parse(body);
                let bio;
                try {
                    bio = results['profile'][id]['biography'];
                } catch (e) {
                    bio = "";
                }
                console.log(bio);
            });
        }
    });
};

////// ========Call Executions Here=============================

// getIDs();

// scrape();

// search();
