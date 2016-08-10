var gcloud   = require('gcloud');
var jimp     = require('jimp');



exports.resize()

/**
 * Mapping function. Maps all decimals range
 * (.4 - 2.5) -> { 2:3, 3:4, 4:5, 1:1 and reciprocals}
 *  [[ 1:1, 2:3 (.667 , 1.5), 3:4 (.75, 1.33) and 4:5 (.8, 1.25) ]]
 * @param  {number} w         :width of the artwork
 * @param  {number} h         :height of the artwork
 * @param  {number} widthRatio: the ratio of w1 to w. Ie, if the
 * artwork has width 100, and the whiteboard has width 125, the widthRatio would
 * be 5/4.
 * @return { number[] } [w1,h1] the w,h of the whiteboard
 */
function getPaddingRatio(w,h, widthRatio) {
    var aspectRatio = w/h; // h*ratio = w
    var ratio;
    if (aspectRatio > 2.5) {
        console.log(">>Image exceeds max Aspect Ratio of 3:2");
        return([0,0]);
    } else if (aspectRatio <= 2.5 && aspectRatio >= 1.5) {
        ratio = 1.5;
    } else if (aspectRatio < 1.5 && aspectRatio >= 1.333) {
        ratio = 1.333;
    } else if (aspectRatio < 1.333 && aspectRatio >= 1.25) {
        ratio = 1.25;
    } else if (aspectRatio < 1.25 && aspectRatio >= 0.95) {
        ratio = 1;
    } else if (aspectRatio < 0.95 && aspectRatio >= 0.8) {
        ratio = 0.8;
    } else if (aspectRatio < 0.8 && aspectRatio >= 0.75) {
        ratio = 0.75
    } else if (aspectRatio < 0.75 && aspectRatio >= 0.6777) {
        ratio = 0.677;
    } else {
        console.log(">>Image doesnt meet min Aspect Ratio of 2 : 3");
        return([0,0]);
    }
    var w1 = Math.floor(w*widthRatio);
    var h1 = Math.floor(w1/ratio);

    return([w1,h1]);
}



// Begin Function
var gcs = gcloud.storage({
    keyFilename: './auth/googleServiceKey.json',
    projectId  : 'artist-tekuma-4a697'
});
console.log("connected storage");

var black       = 0x000000FF;
var white       = 0xFFFFFFFF; //R G B A
var nameToPrint = "Very Long Test Name thing";
var widthRatio  = 4/3; //NOTE
var nameHeight  = 50; //50px
var logoSize    = 75; //75px

var bucketname = "art-uploads";
var bucket     = gcs.bucket(bucketname);
var path       = `portal/cacxZwqfArVzrUXD5tn1t24OlJJ2/uploads/-KNhvO9VHdJJW5qwgGUn`;
var master     = bucket.file(path);
master.download( function (err,buffer) {
    console.log(">GCSB Connection Success");

    // jimp.read(buffer).then(function (artwork) {
    var nothing = new jimp(8000,9000,black,function(err,artwork) {
        var w     = artwork.bitmap.width;
        var h     = artwork.bitmap.height;

        var dims   = getPaddingRatio(w0,h0,widthRatio);
        var spacer = w0/21;

        if (w0 >=1800 && h0 >=1800) {
            console.log(">Image Meets Min Resolution");
            var placeholder = new jimp(dims[0], dims[1], white, function (err, whiteboard) {
                jimp.loadFont('./font/tekuma128.fnt').then(function (font) {
                    console.log(">Font Loaded");
                    jimp.read('./img/logo.png').then(function(logo0) {
                        console.log(">Logo Loaded");
                        /// Imports Finished
                        // Set Artwork Params
                        var w1   = dims[0];
                        var h1   = dims[1];
                        var wPad = Math.floor((w1-w0)/2); //
                        var hPad = Math.floor(((h1-h0)/2));

                        // Set Name Params
                        var name      = whiteboard.clone()
                                        .print(font, 0,0, nameToPrint)
                                        .autocrop()
                                        .resize(jimp.AUTO, nameHeight); // 50px height
                        var nameWidth = name.bitmap.width;
                        var nameX     = (w1/2)-(nameWidth/2); // center it dynamically
                        var nameY     = (h1-hPad) + spacer;  //

                        // Set Logo Params
                        var logo      = logo0.autocrop().resize(logoSize,logoSize);
                        var logoWidth = logo.bitmap.width;
                        var logoX     = nameWidth/2 - logoWidth/2;
                        var logoY     = nameHeight  + logoSize/2;

                        var placeholder2 = new jimp(1800,1800, function (err,fullLabel) {
                             var cropHeight = nameHeight + logoSize*2;
                             var cropWidth  = nameWidth + 5;
                             fullLabel.composite(name,0,0)
                                      .composite(logo,logoX,logoY)
                                      .crop(0,0, cropWidth, cropHeight);

                             var labelWidth  = fullLabel.bitmap.width;
                             var labelHeight = fullLabel.bitmap.height;
                             var labelX      = (w1/2) - (labelWidth/2);
                             var labelY      = (h1) - (hPad/2) - (labelHeight/2);

                             console.log(">Label Made");
                             whiteboard
                                   .composite(artwork ,wPad, hPad)
                                   .composite(fullLabel, labelX,labelY)
                                   .rgba(false)
                                   .write("./img/pf4000x3000.png", function (err) {
                                       console.log(">>Done. Error:",err);
                                   });
                        });
                    });
                });
            });
        } else {
            console.log(">Image Error. Min w or h is 1800 px",w0,h0);
        }


            // .getBuffer(jimp.MIME_PNG, function (err, pbuffer){
            //     var test = bucket.file('test2.png');
            //     var options = {
            //         metadata:{
            //             contentType: 'image/png'
            //         },
            //         predefinedAcl:"publicRead"
            //     };
            //     test.save(pbuffer,options, function (err) {
            //         if (!err) {
            //             console.log(">SUCK CESS");
            //         }
            //     })
            // });


    });
});
