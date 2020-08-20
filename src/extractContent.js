'use strict';
const _ = require('lodash');

const contentPattern = require('./contentPattern');
const columns = require('./worksheetColumns');

// 1st row of 1st content is at 7.42. It's an array of needed 18 items.
// 2nd row of 1st content is at 7.89. It's an array of only 1 string. There are two types of the string.
//    1. "1 Star H 2C". We need to get "1" and "H".
//    2. a string with letters and digits. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", "GS110SP" etc.
//      year: 2019; ID:73000237 has GS110SP

// 1st row of 1st content is at 9.72. 2nd row of 1st content is at 10.19
function extractContent2017(data, page, pageHeader, year) {
  const keys = Object.keys(page)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .filter((key) => parseFloat(key) > 7);

  keys.forEach((key, index) => {
    // curContent could have duplicate items
    // year: 2019; ID:73000237 has GS110SPid: 19000347
    // year: 2019; id: 3655257
    // year: 2019; id: 99000085
    const curContent = _.uniqBy(page[key], 'x');
    console.assert(
      !_.isUndefined(curContent),
      `content not found on page ${pageHeader.pageNo}`
    );
    const item = {};

    if (contentPattern.type.test(curContent[0].text)) {
      const matched = curContent[0].text.match(contentPattern.type);
      let qris = '';
      let type = '';
      if (!_.isUndefined(matched[1]) && !_.isUndefined(matched[2])) {
        qris = parseInt(matched[1]);
        type = matched[2];
      } else {
        type = matched[0];
      }

      const prevContent = page[keys[index - 1]];
      console.assert(
        !_.isUndefined(prevContent),
        `Did not find the main row with data on page ${pageHeader.pageNo} and row ${key}`
      );

      for (let i = 1; i < curContent.length; i++) {
        const prevItem = _.find(prevContent, { x: curContent[i].x });
        console.assert(
          !_.isUndefined(prevItem),
          `Did not find the multi-line data element on page ${pageHeader.pageNo} with id ${prevContent[0].text}`
        );
        const prevText = prevItem.text;
        const curText = curContent[i].text;

        prevItem.text = `${prevText} ${curText}`;
      }

      // TODO: pay attention when parsing data from other years
      if (contentPattern.id.test(prevContent[0].text)) {
        if (prevContent.length !== 18) {
          console.warn(
            `Outlier: length is ${prevContent.length}. ID is ${prevContent[0].text}. Year: ${year}`
          );
        }
        let usefulContent = [];
        if (prevContent.length === 16) {
          // length == 16 no category operation and operation site;
          usefulContent = [
            ...prevContent.slice(0, 3),
            ...prevContent.slice(4, 15),
            '',
            '',
            prevContent[15],
          ];
        } else if (prevContent.length === 17) {
          // 17 no category operation or operation site;
          // TODO: create category operation list and operation site list to handle length == 17??
          // 37.58 38.23 38.09 37.16 36.78 37.58 37.25 38.19 36.83 37.30 37.30 42.13 42.92
          // if x < 40, the item on index 15 is category operation; x > 40 operation site
          if (parseFloat(prevContent[15].x) > 40) {
            usefulContent = [
              ...prevContent.slice(0, 3),
              ...prevContent.slice(4, 15),
              '',
              ...prevContent.slice(15),
            ];
          } else {
            usefulContent = [
              ...prevContent.slice(0, 3),
              ...prevContent.slice(4, 16),
              '',
              prevContent[16],
            ];
          }
        } else if (prevContent.length === 18) {
          // 18 normal;
          usefulContent = [...prevContent.slice(0, 3), ...prevContent.slice(4)];
        } else if (prevContent.length === 19) {
          // 19 index at 1 and index at 2 should be merged as the operation name;
          usefulContent = [
            prevContent[0],
            {
              text: prevContent[1].text + prevContent[2].text,
              x: prevContent[1].x,
            },
            prevContent[3],
            ...prevContent.slice(5),
          ];
        } else if (prevContent.length === 20) {
          // 20 index at 1, 2, 3 should be merged as the operation name;
          usefulContent = [
            prevContent[0],
            {
              text:
                prevContent[1].text + prevContent[2].text + prevContent[3].text,
              x: prevContent[1].x,
            },
            prevContent[4],
            ...prevContent.slice(6),
          ];
        } else if (prevContent.length === 36) {
          // 36 only need the 0 - 17
          usefulContent = [
            ...prevContent.slice(0, 3),
            ...prevContent.slice(4, 18),
          ];
        }

        usefulContent.forEach((value, index) => {
          value = value.text;
          if (columns[index].int) {
            value = parseInt(value);
          }
          item[columns[index].key] = value;
        });

        item.county = pageHeader.county;
        item.year = year;
        item.qris = qris;
        item.type = type;
      }

      data.push(item);
    }
  });
}

/**
 * 2016 and earlier, 5-STAR
 * 2016 and earlier, operation name can take up 3 lines. It's fine to extract only 2 lines.
 */
// 1st row of 1st content is at 6.06. It's an array with 2 items.
//    1. 1st item has text with data except SCC
//    2. 2nd item has text with only SCC
// 2nd row of 1st content is at 6.63. It's an array of only 1 item.
// The text of the item has type info and possibly operation name, category operation, and operation site.
// There are 2 types of type info:
//    1. "1-STAR H". We need to get "1" and "H".
//    2. a string with letters and digits. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", "GS110SP" etc.
// Operation Name could contain special characters:
//    ,#/&'-
// Category Operation could contain special characters:
//    /

// How to handle missing operation site?
//    ID: 12000380; ID: 12000381; ID:41001816; ID: 60002276
// How to handle missing operation site and category operation?
//    ID: 53000329; ID: 60003551; ID: 60003581
// How to handle missing category operation?
//    ID: 60003701; ID: 60003337; ID: 60003389; ID: 60003718

// pay attention to ID: 02000035; ID: 02000085
// most likely need to trim() every string
function extractContent2016(data, page, pageHeader, year) {

}

module.exports = {
  extractContent2017,
  extractContent2016,
};