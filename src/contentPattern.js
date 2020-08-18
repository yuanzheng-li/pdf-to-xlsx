'use strict';

// 1st row of 1st content is at 7.42. It's an array of needed 18 items.
// 2nd row of 1st content is at 7.89. It's an array of only 1 string. There are two types of the string.
//    1. "1 Star H 2C". We need to get "1" and "H".
//    2. a string with letters and digits. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", "GS110SP" etc.
//      year: 2019; ID:73000237 has GS110SP

// 1st row of 1st content is at 9.72. 2nd row of 1st content is at 10.19
const contentPattern2017 = {
  id: /^\d+$/i,
  type: /(\d)\sStar\s([H|C])|^[a-zA-Z][a-zA-Z-\d\s]+/,
  discard: /^\([2|3]\)$/i,
};

const contentPattern2016 = {

};

module.exports = {
  contentPattern2017,
  contentPattern2016,
};