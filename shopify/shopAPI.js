/**  This script is a framework for working with:
-Firebase DB and Storage
-Shopify
-Printful
all in real time and through JS native APIs.

NOTE that shopify/printful organize data by
-collection
-product (@product)
-variant.
*/

const shopifyAPI = require('shopify-node-api');
const firebase   = require("firebase");
const request    = require("request");
const jsonfile   = require('jsonfile');


// Handle Shopify Private app
const Shopify = new shopifyAPI({
  shop                 : 'tekuma', // MYSHOP.myshopify.com
  shopify_api_key      : 'e821b80d0e3380133f3ae8416fbf4498', // Your API key
  access_token         : '84b0c465d035a7d5cd5f2088482fe947' // SENSITIVE NOTE
});
console.log(">Connected Shopify");

//Handle Firebase connection to DB and storage
firebase.initializeApp({
  databaseURL   : "https://artist-tekuma-4a697.firebaseio.com",
  serviceAccount: "auth/googleServiceKey.json"
});
console.log(">Connected Firebase");

// Handle using the Printful API
const printfulKey      = new Buffer("hckpqibd-v56j-9frm:87mj-q9zlfjs71z3j");
const printfulBase     = "https://api.theprintful.com/";
let printfulEncodedKey = printfulKey.toString('base64');
let printfulHeader     = {
    "Authorization" : "Basic " + printfulEncodedKey
}
//NOTE that using '@ID' allows you to use the shopify product ID
let query = "sync/products/@5048016452";
let form = {};
//NOTE thePrintful doesn't have a good native library, just use Request.
// request({
//     url     : printfulBase + query,
//     method  : "GET",
//     headers : printfulHeader,
//     body    : JSON.stringify(form)
// }, function (error, response, body){
//     console.log(">> good!");
//     console.log(body);
// });


// ======================== Scripting here ==================
