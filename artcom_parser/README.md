# Art.com Parser

## Parser handles reading the 2+ million line TSV file and it to a JSON

### NOTE that the txt file is not included in the repo for security reasons.
### See the .gitignore

#### Usage
 Per the norm, do `npm install` and then `node parse.js`.


#### Feed info

 The latest feed contains 2,311,390 artworks

 the headers are:  ```[ 'SKU', 'ITEM_TITLE',  'ITEM_LONG_DESC',  'ARTISTNAME',    'ITEM_TYPE',  'IMAGE_URL',  'PRODUCT_URL', 'PRODUCT_TAXONOMY' ]```


 an example row is: ```[ '30742196502A',
  'Spurzheim Bust',
  'JOHANN KASPAR SPURZHEIM German phrenologist with his autograph',
  'H Corbould',
  'Photographic Print',
  'http://cache2.allpostersimages.com/MED/\\84\\8488\\5WQK300Z.jpg',
  'http://www.art.com/products/p30742196502-sa-i9032642/.htm?RFID=197560',
  'World Culture>European  Cultures>German Culture>>>>>>>' ] ```
