var jimp = require('jimp');

let testurl1 = 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%28454045%29.jpg';
let testurl2 = 'http://www.nacion.com/ocio/artes/Auto-retrato-Vincent-Van-Gogh_LNCIMA20160619_0245_1.jpg';

jimp.read(testurl1).then( (image1)=>{
    jimp.read(testurl2).then( (image2)=>{
        let hash1 = image1.hash(2);
        let hash2 = image2.hash(2);
        console.log(">Hash 1:", hash1);
        console.log(">Hash 2:", hash2);

        let dist = jimp.distance(image1,image2);
        let diff = jimp.diff(image1,image2);
        console.log(">Dist:", dist);
        console.log(">Diff:", diff.percent);
    });
});
