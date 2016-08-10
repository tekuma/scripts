
const shopifyAPI = require('shopify-node-api');
const firebase   = require("firebase");
const request    = require("request");
const jsonfile   = require('jsonfile');
const Clarifai   = require('clarifai');

const accessToken = "Nfmp9SKCt8FlG466GZhsqlft61geVa";
const clientID    = "M6m0sUVsWLHROSW0IjlrG2cojnJE8AaHJ1uBaJjZ";
const clientScrt  = "DPPraf1aGGWgp08VbDskYi-ezk1lWTet78_zBER1";

Clarifai.initialize({
  'clientId'    : clientID,
  'clientSecret': clientScrt
});



let imageURL = "http://imagecache6.allposters.com/LRG/7/725/YSSA000Z.jpg";

Clarifai.getInfo().then( (resp)=>{
    console.log(resp.results);
});

// Clarifai.getTagsByUrl(imageURL).then(
//   (res)=> {
//     //   console.log(res.results[0]);
//       let obj1 = res.results[0].result.tag;
//       console.log(obj1);
//     //   Clarifai.getColorsByUrl(imageURL).then(
//     //     (res)=> {
//     //         let obj2 = res.results[0]
//     //
//     //     },
//     //     (error)=>{
//       //
//     //     });
//
//   },
//   (error)=>{
//
//   });
