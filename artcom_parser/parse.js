var fs     = require('fs');
var parser = require('fast-csv');

/**
 * This script uses the fast-csv lib for parsing the CSV via a file stream/buffer
 * system. As the text file is nearly 1GiB, it should be piped rather than loaded, then
 * read. For more info, see:
 * <https://www.npmjs.com/package/fast-csv>
 */

// =============== Methods =================

let counter  = 0;

readArt = (fileName, options, callback) => {
    let stream   = fs.createReadStream(fileName);
    let csvStream = parser.parse(options)
                    .on("data", callback)
                    .on("end", ()=>{
                        console.log(">>>DONE Finally");
                    })
                    .on("error", (err)=>{
                        console.log(err);
                        console.log(">Error");
                    });
    stream.pipe(csvStream);
}

readrow = (row) => {
    counter++;
    // console.log(counter);
    console.log(row);
};

// ============= Call Functions =================

//NOTE each row is read as
// [ 'SKU','ITEM_TITLE','ITEM_LONG_DESC','ARTISTNAME','ITEM_TYPE',
// 'IMAGE_URL', 'PRODUCT_URL', 'PRODUCT_TAXONOMY' ]   (len 8)

let fileName = "ART_ITEMS.txt";


let options = {
    headers   : false,
    delimiter : "\t",
    objectMode: true,
    quote     : null,
    escape    : '$'  //arbitrary. File contains " , so dont use that
};

readArt(fileName,options,readrow);
