const shopifyAPI = require('shopify-node-api');
const firebase   = require("firebase");
const request    = require("request");
const jsonfile   = require('jsonfile');

// Handle Shopify Private app
// @ https://www.npmjs.com/package/shopify-node-api
const Shopify = new shopifyAPI({
  shop                 : 'tekuma', // {}.myshopify.com
  shopify_api_key      : 'e821b80d0e3380133f3ae8416fbf4498', // Your API key
  access_token         : '84b0c465d035a7d5cd5f2088482fe947', // SENSITIVE NOTE
  verbose              : false
});
console.log(">>>>Connected Shopify");


//NOTE this json has the utf8 '×', NOT the ascii 'x' in frame size

// ============== Methods  ================ //

/**
 * Get all product IDs by recurisvely requesting IDs
 * @return {number[]} [description]
 */
getAllProductIDs = () => {
    return new Promise( (resolve, reject)=>{
        Shopify.get('/admin/products/count.json', (err,data)=>{
            const count = data.count;
            const limit = 250;
            const pages = Math.ceil(count/limit);
            let ids = [];
            let finished = 0;

            for (let i = 1; i <= pages; i++) {
                let params = {
                    limit : limit,
                    page  : i,
                    fields: "id",
                    created_at_min: "2016-08-25T16:15:47-04:00"
                    //    An option to reduce the size of product list
                };
                Shopify.get('/admin/products.json', params, (err, data, headers)=>{
                    for (let j = 0; j < data.products.length; j++) {
                        let id = data.products[j].id;
                        ids.push(id);
                    }
                    finished++;
                    if (finished === pages) { //last callback
                        console.log(ids);
                        resolve(ids);
                    }

                });
            }
        }); // end shopify calls
    });
}

getProductIDsTest = () => {
  return new Promise( (resolve, reject) => {
    let IDsTest = [6438266820];
    console.log("get IDs");
    resolve(IDsTest);
  });
}

// Add "Option" as option2
// At the same time update variants

/**
 * [addOptionToProduct description]
 * @param {[Number]} ProductID [description]
 */
addOptionToProduct = (ProductID) => {
  return new Promise( (resolve,reject) => {
    let productQuery = '/admin/products/' + ProductID + '.json';

    Shopify.get(productQuery, (err,data) => {
      let variantsArray = data.product.variants;
      let variantsArrayPrints = data.product.variants;

      // Get the array of options
      let productOptions = data.product.options;
      let productOptionsTest = data.product.options;


      // Set each product option2 as "Framed"
      // So that it doesn't create error when creating an "Frame" option later
      for ( let j = 0; j < variantsArray.length; j++ ) {
        variantsArray[j].option2 = "Framed";
      }

      // Creating new Option Object
      let frameOption = {
        "name": "Option",
        "position": 2,
        "values": [
        "Print",
        "Framed"
        ]
      };
      productOptions.push(frameOption);

      // Preparing the Product Data to be updated
      let productUpdate = {
         "product": {
          "variants": variantsArray, // Assigning the updated variants.
          "options" : productOptions, // Assigning the updated options.
        }
      }

      //  let productQuery = '/admin/products/' + ProductID + '.json';
      console.log(productOptionsTest.length);
      if (productOptionsTest.length != 3) {
        Shopify.put(productQuery,productUpdate, (err, data, headers) => {
            if (err == undefined) {
                console.log("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-");
                console.log(`>> Updated Product: ${ProductID}`);
                console.log(">>>Sucessfully added an option 'Frame'");
                resolve(data);
            } else {
                resolve([]);
                console.log(`---Error Updating ${ProductID}:`, err);
            }
        });
      }
    });
  });
}

// Logic:
// 1. copy the framed variants array
// 2. change:
//    (1)option2 = Print
//    (2)weight = 2
//    (3)price = 40% frame price

/**
 * [addVariants description]
 * @param {[type]} data [description]
 */
addVariants = (data) => {

  // Copying framed array
  let variantsArrayPrints = data.product.variants;
  let ProductID           = data.product.id;
  let variantQuery  = '/admin/products/' + ProductID + '/variants.json';

  // Making changes
  for ( let k = 0; k < variantsArrayPrints.length; k++ ) {
    variantsArrayPrints[k].option2 = "Print";
    variantsArrayPrints[k].weight = "2";
    variantsArrayPrints[k].price = Math.floor(0.4 * parseInt(variantsArrayPrints[k].price));
    delete variantsArrayPrints[k].id;

    let newVariant = {
      "variant" : variantsArrayPrints[k]
    };

    // Creating New Variants
    Shopify.post(variantQuery, newVariant, (err, data, headers) => {
        if (!err) { // 'If not error'
            console.log("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-");
            console.log(">>Creating " + k +" Variant for " + ProductID );
        } else {
            console.log("ERROR:", err);
        }
    });
  }
  console.log(">>>Sucessfully created " + variantsArrayPrints.length + " variants");

};

/**
 * Execute a single product
 * @param  {[type]} ProductID [description]
 * @return {[type]}           [description]
 */
execute = (ProductID) => {
  addOptionToProduct(ProductID).then( (data)=> {
    addVariants(data);
  });
}

/**
 * Execute only a subset of products for testing
 * @return {void}
 */
executeAllTest = () => {
  getProductIDsTest().then( (productIDs) => {
    for (id of productIDs) {
      console.log("executing all");
      execute(id);
    };
  });
}

/**
 * Get all product IDs then add variants
 * @return {[type]} [description]
 */
executeAll = () => {
  getAllProductIDs().then( (productIDs) => {
    console.log(">Begining to execute all");
    for (id of productIDs) {
      console.log(">>Editing product:",id);
      execute(id);
    };
  });
}

// =========== Execute ==============

//executeAllTest()
executeAll();
