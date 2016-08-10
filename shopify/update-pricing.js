// This script update all prices in Shopify

//NOTE Set the desired prices here::
const priceMap = {
    '36×54' : '319.00', // not on printful
    '36×48' : '309.00', // not on printful
    '24×36' : '189.00', // *2:3
    '24×24' : '149.00', // not on printful
    '18×24' : '99.00',  // *3:4
    '18×18' : '79.00',
    '16×20' : '89.00',  //  *4:5
    '16×16' : '69.00',
    '14×14' : '59.00',
    '12×18' : '79.00', // 2:3
    '12×16' : '59.00', // 3:4
    '12×12' : '49.00',
    '10×10' : '39.00', // 1:1
    '8×10'  : '39.00' // 4:5
};
//NOTE this json has the utf8 '×', NOT the ascii 'x'


//import libraries
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

// ======================== Methods here ==================

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
                    fields: "id"
                };
                Shopify.get('/admin/products.json', params, (err, data, headers)=>{
                    for (let j = 0; j < data.products.length; j++) {
                        let id = data.products[j].id;
                        ids.push(id);
                    }
                    finished++;
                    if (finished === pages) { //last callback
                        resolve(ids);
                    }

                });
            }
        }); // end shopify calls
    });
}

getStandardVariants      = (productID) => {
    let queryString = `/admin/products/${productID}.json`;
    let params = {
        fields: 'variants, tags'
    };
    return new Promise((resolve, reject)=>{
        Shopify.get(queryString,params, (err, data, headers) => {
            if (data.product.tags.toLowerCase().indexOf('limited') == -1) {
                resolve(data.product.variants);
            } else {
                resolve([]);
            }
        });
    });
}

updateVariant = (id, size, oldPrice) => {
    if (size.indexOf('×') == -1) { //using 'x' instead of '×'
        if (size.indexOf('x') == -1) {
            console.log(">ERR: Variant size error", size);
        } else {
            size = size.replace('x','×');
        }
    }
    let newPrice = priceMap[size];
    if (newPrice == undefined) {
        console.log("!>", id, size);
    }

    if (oldPrice != newPrice) {
        let updatedData = {
            "variant": {
                "id"     : id,
                "price"  : newPrice,
                "option1": size
            }
        };
        let queryString = `/admin/variants/${id}.json`
        Shopify.put(queryString, updatedData, (err, data,headers)=>{
            if (err == undefined) {
                console.log("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-");
                console.log(">>Updating variant:", id);
                console.log(">>>Sucessfully From:", oldPrice, "to:", newPrice);
            } else {
                console.log("ERROR:", err);
            }
        });
    }
}


/// ================-Logic Here-========================

getAllProductIDs().then( (productIDs)=> {
    for (id of productIDs) {
        getStandardVariants(id).then( (variants)=>{
            // variants will be [] if no standard variants
            for (variant of variants) {
                let size    = variant.option1;
                let var_id  = variant.id;
                let price   = variant.price;
                updateVariant(var_id, size, price);
            }
        });
    }
});
