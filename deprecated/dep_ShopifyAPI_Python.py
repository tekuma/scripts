#!/usr/bin/env python3
# -*- coding: utf-8 -*-
__author__   = 'Stephen L. White'
__license__  = 'MIT'
__email__    = 'stwhite@mit.edu'
__status__   = 'Development'
'''
 Scripts by Stephen L. White, stwhite@mit.edu
 Written in Python3 ,  utf-8 encoding
 for Tekuma, Inc  2016-06 , http://tekuma.io
 NOTE: this document contains sensitive private encryption keys.
 NOTE: do not push this to a public repo, or distribute.
 > This script handles augmenting the JSON tekuma data structure, and
 handling real-time changes to Shopify.
'''
# Handle Third-Party libraries and package imports
from pyactiveresource import activeresource as ar
from requests.auth import HTTPBasicAuth
import csv, code, collections, functools, glob, httplib2, re, os, os.path
import json, requests, sys, subprocess, six, time, yaml, math
import shopify # "https://github.com/Shopify/shopify_python_api.git"

###############################################################################
####  Definitions and Methods for Tekuma                                   ####
###############################################################################

class Tekuma:
    #@input db_path    : string, the path to the db file to be loaded
    #@input save_db_as : string, name of what to save the db file as.
    #@input pause      : float , how long to sleep during each iteration of
    #       shopify API calls in seconds. (Max of 2 calls/second -> .5 )
    def __init__(self, db_path,  pause):
        self.db_path = db_path
        self.pause   = pause
        artJson      = open(db_path, "rt")
        self.db      = json.load(artJson)
        artJson.close()
        print(">>>Sucessfully loaded JSON file")

        ## Import our Tekuma Store  #NOTE: PRIVATE INFO!
        API_KEY   = "e821b80d0e3380133f3ae8416fbf4498"  #Sensitive
        PASSWORD  = "84b0c465d035a7d5cd5f2088482fe947"  #Sensitive
        SHOP_NAME = "tekuma"
        SHOP_ID   = 10586384
        shop_url  = "https://{}:{}@tekuma.myshopify.com/admin".format(API_KEY, PASSWORD)
        shopify.ShopifyResource.set_site(shop_url)
        print(">>> Sucessfully Connected to Tekuma-Shopify!")

        ## Create a list of all collection IDs each time #RFC
        all_collections_raw = "https://tekuma.myshopify.com/admin/smart_collections.json?limit=250"
        # NOTE that only a max of 250 collections can be imported per HTTP request!
        raw_response        = requests.get(all_collections_raw, auth=HTTPBasicAuth(API_KEY,PASSWORD))
        collectionJSON      = json.loads(raw_response.content.decode('utf-8'))  # JSON String response
        collectionList_raw  = collectionJSON['smart_collections']
        self.collectionIDs  = [(lambda x:x['id'])(x) for x in collectionList_raw]


    #############################################
    ####    (Local) -> (Shopify) Methods     ####
    #############################################

    #@input a dictionary of {"10x10":"55.00"} style
    def updateAllPricesBySize(self, price_dictionary, debug=False):
        counter = 0
        for collectionID in self.collectionIDs :
            collectionProducts = shopify.Product.find(collection_id=collectionID)
            for product in collectionProducts:
                variants = product.variants
                for var in variants:
                    ## Theres a problem between ASCII 'x' and utf '×'
                    # #SFB, very poor design on Shopify's part...
                    # size = var.option1.encode('utf-8').replace('×','x')
                    size = var.option1.replace('×','x')

                    if size in price_dictionary:
                        orgPrice  = var.price
                        var.price = price_dictionary[size]
                        updPrice  = var.price
                        if ( orgPrice != updPrice):
                            time.sleep(.5) #for API limit
                            if not debug:
                                var.save()
                            print(">>Price {} was updated to {} | ".format(orgPrice,updPrice),
                            "counter:"+ str(counter) )
                            counter += 1
                    else:
                        print(">****error: size:{} not found in input dict".format(size))
        print(">>> ALL PRICES UPDATED!  :) ")


    # @input generalHtml = html to add to the end of every Description
    def updateProductDescription(self, generalHtml, debug=False):
        counter = 0
        for collectionID in self.collectionIDs :
            print()
            print("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-")
            print()

            collectionProducts = shopify.Product.find(collection_id=collectionID)
            collectionTitle    = shopify.SmartCollection.find(collectionID).title
            print(">>> Processing collection: ", collectionTitle)
            #Generate custom html
            theInformation = Tekuma.generateCustomHtml(self, collectionTitle)
            if (theInformation):
                specificHtml, collectionDes, artistID = theInformation

                for product in collectionProducts:
                    print(">>Looking at:", product.title)
                    time.sleep(self.pause) # for shopify leaky bucket API
                    product.body_html = specificHtml + generalHtml

                    if not debug: #debug mode
                        success = product.save()
                    else:
                        success = True
                    if success:
                        counter += 1
                        print('>Updated Sucessfully!  #',counter)
                    else:
                        print(">There was an error with:", product.title)
            else:
                print(collectionTitle, "didn't match anything in the CSV")
        print(">>>> Finished updating all Descriptions! :)")


    #TODO
    def syncLocalToShopify(self):
        counter = 0
        for collectionID in self.collectionIDs :
            collectionProducts = shopify.Product.find(collection_id=collectionID)

            try:
                onboarder = self.db['collections'][str(collectionID)]['onboarder']
                for product in collectionProducts:
                    print("changing: ",product.title)
                    L_variants = self.db['products'][onboarder][str(product.id)]['shopify']['variants']
                    S_variants = product.variants
                    for svar in S_variants:
                        time.sleep(self.pause)
                        counter +=1
                        print (counter)
                        size = svar.option1.replace('×','x')
                        for lvar in L_variants:
                            if size == lvar['title']:
                                svar.position = lvar['position']
                                svar.save()
                product.save()
            except Exception as e:
                print("#################error with id:", collectionID)

        print(">>>>>>>>Done")


    #############################################
    ##### (Shopify/CSV) -> (Local) Methods      #####
    #############################################


    # @input csv_path, string, path to A/collections csv file
    def buildCollectionsBranch(self,csv_path):
        print("------ Building Collections Branch ------")
        counter = 0
        branch  = self.db['collections']
        theCSV  = csv.reader(open(csv_path))
        collectionDict = {}
        for row in theCSV:
            onboarderID,collectionID,title,description = row
            ## (collectionID) -> (onboarderID, title, description)
            collectionDict[collectionID] = [onboarderID,title,description]
        print("==> Successfully loaded collections CSV File")

        for collectionID in collectionDict:
            time.sleep(self.pause)
            print()
            print("-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-")
            print()

            ## NON-LOCAL CALL to SHOPIFY , dynamicly sets products
            collectionProducts = shopify.Product.find(collection_id=collectionID)
            collectionTitle    = collectionDict[collectionID][1]

            print(">>>>>Processing collection: ", collectionTitle)

            collectionObject = {
            'title'      : collectionTitle,
            'onboarder'  : collectionDict[collectionID][0],
            'artist'     : collectionDict[collectionID][0],
            'body_html'  : "<p>" + "TODO TODO" + "</p>",
            'description': collectionDict[collectionID][2],
            'products'   : [(lambda x:x.id)(x) for x in collectionProducts]

            }

            branch[collectionID] = collectionObject
            print(">Object set Successfully!   || ", counter)
            counter += 1
        print(">---------- Finished Building Collections Branch ----------<")

    # @input csv_path, string, path to A/onboarders csv file
    def buildOnboardersBranch(self,csv_path):
        branch = self.db['onboarders']
        print("----- Creating On-Boarders Branch! -----")
        onboardCSV = csv.reader(open(csv_path))
        print("===> Successfully On-boarders CSV File")
        for row in onboardCSV:
            inits,thisID,fname,lname,twitter,instagram,portfolio_url,location,bio1,bio200,bio140,pic,sig,uploads = row
            print(">>Creating entry for:",fname,lname)


            onboarderObject = {
                'f_name'       : fname,
                'l_name'       : lname,
                'display_name' : fname + ' ' + lname,
                'ecommerce'    : True,
                'firm'         : None,
                'photo'        : pic,
                'bio200'       : bio200,
                'bio140'       : bio140,
                'portfolio_url': portfolio_url,
                'location'     : location,
                'uploads'      : uploads,
                'social_media' : {
                    'twitter'     : twitter,
                    'instagram'   : instagram
                },
                'signature': sig
            }
            branch[thisID] = onboarderObject
        print("----- Finished On-Boarders Branch! -----")
        print()

    #Builds products branch
    #@return: a json object with save_db_as as the name.
    def buildProductBranch(self):
        counter = 0
        branch  = self.db['products']
        localCollections = self.db['collections']

        for collectionID in localCollections:
            ## NONLOCAL call to shopify api
            collectionProducts = shopify.Product.find(collection_id=collectionID)
            thisCollection = localCollections[collectionID]
            thisColTitle   = thisCollection['title']
            thisOnboarder  = thisCollection['onboarder']
            print("-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-")
            print()
            print(">>>>Looking at collection", thisColTitle)

            ##
            for product in collectionProducts:
                print(">> Looking at product {} || {}".format(product.title,str(counter)))
                counter += 1
                time.sleep(self.pause) # booorrrinnngggg
                thisID = product.id
                varLst = []
                for variant in product.variants:
                    variantObject = {}
                    variantObject['id']       = variant.id
                    variantObject['title']    = variant.title.replace('×','x')
                    variantObject['price']    = variant.price
                    variantObject['position'] = variant.position
                    varLst.append(variantObject)

                productObject = {
                'title'      : product.title,
                'color'      : None,
                'tags'       : product.tags.replace(',','').split(" "),
                'album'      : None,
                'print_file' : None,
                'upload'     : None,
                'shopify': {
                    'id'           : thisID,
                    'online'       : True,
                    'collection_id': collectionID,
                    'collection'   : thisColTitle,
                    'body_html'    : product.body_html,
                    'variants'     : varLst,
                    'image'        : product.image.src,
                    'tags'         : product.tags #space deliminated
                },
                'artist'     : thisOnboarder,
                'onboarder'  : thisOnboarder,
                'year'       : None,
                'upload_date': '01JUN2016'
                }
                if thisOnboarder not in branch:
                    branch[thisOnboarder] = {}
                branch[thisOnboarder][thisID] = productObject
                print(">product set in db!")

        #after loop, dump dict into JSON
        print(">>>> Finished building the products branch from shopify:)")

    #@input csv_path string  path to csv file of private
    def buildPrivateBranch(self,csv_path):
        print("------ Building _private  Branch ------")
        branch  = self.db['_private']
        theCSV  = csv.reader(open(csv_path))
        for row in theCSV:
            inits,thisID,email,phone,paypal = row
            print("building object for :",thisID)

            privateObject = {
            'email'  : email,
            'phone'  : phone,
            'paypal' : paypal
            }
            branch[thisID] = privateObject
        print(">>>Finished building private branch")

    #  build blank sales branch
    def buildSalesBranch(self):
        branch = self.db['sales']
        for onboarderID in self.db['onboarders']:
            branch[onboarderID]= {}


    #############################################
    ####  Helper, Static, and META methods.  ####
    #############################################

    #@input save_as  string  what to save JSON file as.
    def saveDbToJson(self, save_as):
        jsonFile = open(save_as, "w")
        jsonFile.write(json.dumps(self.db))
        jsonFile.close()
        print('>>>> DB Exported as JSON object: ', save_as)


    # TODO Change to search through on-boarders branch instead of csvdic
    # @input:  collectionTitle: a string of the title of the collection.
    # @return: string of the HTML, string of collection description, artistID indexer
    # def generateCustomHtml(self, collectionTitle):
    #     CT_clean   = re.sub('[\s+]', '', collectionTitle)
    #     if CT_clean in self.csvdic:
    #         #match found
    #         print('>> Match Found on', CT_clean)
    #         fname,lname,location,bio,collectionDes = self.csvdic[CT_clean]
    #         userHash   = fname+lname+location
    #         if userHash in self.userMap:
    #             artistID   = self.userMap[userHash]
    #         else:
    #             artistID = "A{}tmp".format(str(self.userCount))
    #             self.userCount += 1
    #             print("####### new ID:", artistID, ':', userHash)
    #             self.userMap[userHash] = artistID
    #
    #         customHTML = '<div><meta content=\"text/html; charset=utf-8\" http-equiv=\"content-type\" /> <p style="text-align: center; font-size: 22px;"><strong>{} {}</strong><br><span style="font-size: 18px;">{}</span> </p> <p style="text-align: justify;">{}</p></div>'.format(fname,lname,location,bio)
    #         return customHTML,collectionDes,artistID
    #     #else
    #     print("<< No match found for", CT_clean )
    #     return []

    #Changes the order inwhich the variants appear.
    def changeVariantOrder(self):
        branch = self.db['products']
        for artistID in branch:
            if artistID == 'general':
                continue
            for productID in branch[artistID]:
                variantsLst = branch[artistID][productID]['shopify']['variants']
                theVars = []
                for variant in variantsLst:
                    print('working in ', productID)
                    try:
                        dims = variant['title'].split('x')
                        totaldim = 0
                        for dim in dims:
                            totaldim += int(dim)
                        theVars.append((totaldim,variant['title']))
                    except ValueError:
                        print(productID, "fucked up")

                    if theVars:
                        sortedVars     = sorted(theVars)
                        newVariantList = []
                        for i in range(len(sortedVars)):
                            size = sortedVars[i][1]
                            for thisVariant in variantsLst:
                                if thisVariant['title'] == size:
                                    thisVariant['position'] = i+1
                                    newVariantList.append(thisVariant)
                        branch[artistID][productID]['shopify']['variants'] = newVariantList

        jsonFile = open(self.save_db_as, "w")
        jsonFile.write(json.dumps(self.db))
        jsonFile.close()

    #@return list of collection names and IDs [(name,id),(name,id)]
    def listAllCollectionsShopify(self):
        retlst = []
        for collectionID in self.collectionIDs:
            retlst.append((shopify.SmartCollection.find(collectionID).title, collectionID))
        return retlst

    ##### META Functions ######
    def buildLocalDB(self,save_as, coll_path,onboarder_path, private_path):
        buildCollectionsBranch(self,coll_path)
        buildOnboardersBranch(self,onboarder_path)
        buildProductBranch(self)
        buildPrivateBranch(self,private_path)
        buildSalesBranch(self)
        saveDbToJson(self,save_as)



### This function, when given the collections, onboarders, and private CSV file
#   from G-Drive, will create a local instace of our art database in JSON format
def buildLocalDB(path_to_db, save_as, coll_path,onboarder_path, private_path):
    instance = Tekuma(path_to_db,.4)
    instance.buildCollectionsBranch(coll_path)
    instance.buildOnboardersBranch(onboarder_path)
    instance.buildProductBranch()
    instance.buildPrivateBranch(private_path)
    instance.buildSalesBranch()
    instance.saveDbToJson(save_as)
#######################################################
## Execution Area                                  ####
#######################################################

if __name__ == '__main__':
    ## TODO Set Enviornmental Variables!
    path_to_db = "blankDB.json"
    throttle   = .4 # for throttling the API requests
    save_as    = "A.json"
    ### Instanciate Script
    tekuma     = Tekuma(path_to_db, throttle)
    print("||+++++++++++ Starting Script ++++++++++++||")


    gen_html = "***\n<div><meta content=\"text/html; charset=utf-8\" http-equiv=\"content-type\" /> <p style='text-align: justify;' >All of our prints include complimentary frames at no extra charge. If you have a specific look in mind, we can provide custom framing. We've partnered with <a title=\"Art.com\" href=\"http://www.art.com/\"> Art.com </a> to offer multiple framing styles. We also print on aluminum, canvas, and wood. Expect an additional 2-3 days for your requested project. To find out more, check out our <a title=\"Custom Framing\" href=\"https://shop.tekuma.io/pages/custom-framing\">custom framing page</a>.</p></div>"
    priceDict = {'24x36': '189.00', '24x24': '149.00', '8x10': '39.00', '18x24': '99.00',
     '16x16': '69.00', '16x20': '89.00', '14x14': '59.00', '12x12': '49.00', '12x16': '59.00',
      '36x54': '319.00', '36x48': '309.00', '12x18': '79.00', '18x18': '79.00', '10x10': '39.00'}
    ## TODO Call Methods here:

    tekuma.updateAllPricesBySize(priceDict)
    # buildLocalDB(path_to_db, save_as,'collections.csv','onboarders.csv','private.csv')

    print("||+++++++++++ Finished Script ++++++++++++||")
