'use strict';
const _ = require('lodash');

const contentPattern = require('./contentPattern');
const columns = require('./worksheetColumns');
const concatenateRowText = require('./utils');

// 1st row of 1st content is at 7.42. It's an array of needed 18 items.
// 2nd row of 1st content is at 7.89. It's an array of only 1 string. There are two types of the string.
//    1. "1 Star H 2C". We need to get "1" and "H".
//    2. a string with letters and digits. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", "GS110SP" etc.
//      year: 2019; ID:73000237 has GS110SP

// 1st row of 1st content is at 9.72. 2nd row of 1st content is at 10.19
function extractContent2017(data, page, pageHeader, options) {
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

      // The following for loop is concatenating multi-line data based on their x position.
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
            `Outlier: length is ${prevContent.length}. ID is ${prevContent[0].text}. Month: ${options.month}, Year: ${options.year}`
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
        item.year = options.year;
        item.month = options.month;
        item.qris = qris;
        item.type = type;
      }

      data.push(item);
    }
  });
}

// 2014 to 2011. The main data row is an array of 3 items, we need to concatenate the text of all items and (1) split
// OR (2) make it the same as the structure of 2016.

// 2010 to 2006 same as 2016

// 2005 main data row array could be any length. 2nd row of data could be any length.
// ID: 96000237

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
// Category Operation 'Community Service Agency' and 'Community College' only have 'Community' on the 1st line of a data entry.
// College/Univers
// ity
// Parent
// Co-op/Group

// How to handle missing operation site? content length is 16. Second last string is pattern of No. Word (1 Independent). length is 17 after split 1 Independent.
//    [
      //   "12000380",
      //   "LYNN'S HOME DAYCARE",
      //   "10",
      //   "(1)",
      //   "1",
      //   "0",
      //   "0",
      //   "1",
      //   "0",
      //   "0",
      //   "2",
      //   "4",
      //   "8",
      //   "8",
      //   "1 Independent",
      //   "Y"
      // ]
//    ID: 12000380; ID: 12000381; ID:41001816; ID: 60002276
// How to handle missing operation site and category operation? content length is 16. Second last string is a number (No. emp).
      // [
      //   '53000329',
      //   'DEEP RIVER ACADEMY',
      //   '8',
      //   '(1)',
      //   '0',
      //   '1',
      //   '1',
      //   '4',
      //   '1',
      //   '0',
      //   '6',
      //   '13',
      //   '29',
      //   '29',
      //   '2',
      //   'Y'
      // ];
//    ID: 53000329; ID: 60003551; ID: 60003581
// How to handle missing category operation? content length is 17. Second last string is operation site.
//    [
    //   "60003701",
    //   "MEENA'S HOME DAYCARE",
    //   "7",
    //   "(1)",
    //   "3",
    //   "0",
    //   "1",
    //   "0",
    //   "0",
    //   "0",
    //   "0",
    //   "4",
    //   "8",
    //   "8",
    //   "1",
    //   "Family",
    //   "N"
    // ]
//    ID: 60003701; ID: 60003337; ID: 60003389; ID: 60003718
// normal content length is 17. Length is 18 after split 1 Independent.
      // [
      //   '60003620',
      //   "ANGIE'S LITTLE ANGELS",
      //   '7',
      //   '(1)',
      //   '0',
      //   '1',
      //   '2',
      //   '1',
      //   '0',
      //   '0',
      //   '0',
      //   '4',
      //   '8',
      //   '8',
      //   '2 Independent',
      //   'Family',
      //   'Y'
      // ];
function extractContent2016(data, page, pageHeader, options) {
  const keys = Object.keys(page)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .filter((key) => parseFloat(key) > 5);

  keys.forEach((key, index) => {
    console.assert(
      !_.isUndefined(page[key]),
      `content not found on page ${pageHeader.pageNo}`
    );
    const uniquedRow = _.uniqBy(page[key], 'x');
    const curRowText = concatenateRowText(uniquedRow);
    const curContent = groomingRowContent(curRowText, options);

    const item = {};

    // curRow is the 2nd row of each data entry.
    if (isCurContentSecondLine(curContent)) {
      const matched = curContent[0].match(contentPattern.type);
      let qris = '';
      let type = '';
      if (!_.isUndefined(matched[1]) && !_.isUndefined(matched[2])) {
        qris = parseInt(matched[1]);
        type = matched[2];
      } else {
        type = matched[0];
      }

      // prevRow is the 1st row of each data entry.
      const prevRow = page[keys[index - 1]];
      console.assert(
        !_.isUndefined(prevRow),
        `Did not find the main row with data for row ${keys[index - 1]} on page ${pageHeader.pageNo}`
      );
      const prevRowText = concatenateRowText(prevRow);
      const prevContent = prevRow
        ? fillMissingCol(groomingRowContent(prevRowText, options), options)
        : [];

      // TODO: concatenate multi-line Category Operation and Operation Site
      // Only concatenate Operation Name
      // If the 2nd item in curContent is not (2), it's operation name
      if(curContent[1] !== '(2)') {
        if(prevContent[1]) {
          prevContent[1] = `${prevContent[1]} ${curContent[1]}`;
        }
      }

      // TODO: pay attention when parsing data from other years
      if (contentPattern.id.test(prevContent[0])) {
        prevContent.forEach((value, index) => {
          if (columns[index].int) {
            value = parseInt(value);
          }
          item[columns[index].key] = value;
        });

        item.county = pageHeader.county;
        item.year = options.year;
        item.month = options.month;
        item.qris = qris;
        item.type = type;
      }

      data.push(item);
    }
  });
}

function groomingRowContent(text, options) {
  const content = text
    .trim()
    .split('  ') // split by 2 spaces
    .filter((item) => item.length > 0)
    .reduce((res, item) => {
      const trimmed = item.trim();
      if(contentPattern.twoNums.test(trimmed)) {
        // ID: 01000232, 01000244, 01000253, 3455052, 3459001, 60000375, 60001091, 80000196, 9055094, 99000062
        // Above data entries from 2016 are a sample of data that have 2 consecutive numbers in the same string separated by a space.
        const matched = trimmed.match(contentPattern.twoNums);
        res.push(matched[1], matched[2]);
      } else if(contentPattern.threeNums.test(trimmed)) {
        // ID: 65000903 from 2015
        const matched = trimmed.match(contentPattern.threeNums);
        res.push(matched[1], matched[2], matched[3]);
      } else if(trimmed.includes('Employer/Employ') || trimmed.includes('College/Univers')) {
        // Example of data entry: 1 Employer/Employ School.
        // The purpose of this if block: separate the above data entry to '1 Employer/Employ' and 'School'.
        // Employer/Employ Constructed for
        // Employer/Employ Health Care
        // College/Univers School
        // College/Univers Constructed for
        // College/Univers Government
        // College/Univers Converted
        // College/Univers Modular
        // College/Univers Converted House
        // These two strings (Employer/Employ and College/Univers) are 15.
        const index = trimmed.includes('Employer/Employ') ? trimmed.indexOf('Employer/Employ') : trimmed.indexOf('College/Univers');
        const noEmpCategory = trimmed.substring(0, index + 15);
        const site = trimmed.substring(index + 16);
        res.push(noEmpCategory, site);
      } else if(contentPattern.numNoEmpCatOper.test(trimmed)) {
        // ID: 01000547 from Feb 2017
        const matched = trimmed.match(contentPattern.numNoEmpCatOper);
        res.push(matched[1], matched[2]);
      } else {
        res.push(trimmed);
      }

      return res;
    }, []);

  // TODO: More robust approach: Get the index(i) of the first number after the operation name, merge all items between index 1 and index i.
  if(content.length === 17 && content[0] === '96000237' && options.year === 2005) {
    // ID: 96000237 from 2005
    return [
      content[0],
      `${content[1]} ${content[2]}`,
      ...content.slice(3),
    ];
  } else if (content.length === 18) {
    // ID: 10000099, 16000139, 26001043, etc. from 2016
    return [
      content[0],
      `${content[1]} ${content[2]}`,
      ...content.slice(3),
    ];
  } else if (content.length === 19) {
    // ID: 59000066 from 2016
    return [
      content[0],
      `${content[1]} ${content[2]} ${content[3]}`,
      ...content.slice(4),
    ];
  }

  return content;
}

function fillMissingCol(content, options) {
  if(content.length === 16) {
    const secondLast = content[content.length - 2];
    if(contentPattern.noEmpCatOper.test(secondLast)) {
      // missing operation site
      const matched = secondLast.match(contentPattern.noEmpCatOper);
      return [
        ...content.slice(0, 3),
        ...content.slice(4, content.length - 2),
        matched[1],
        matched[2],
        '',
        content[content.length - 1],
      ];
    } else {
      // missing operation site and category operation
      return [
        ...content.slice(0, 3),
        ...content.slice(4, content.length - 1),
        '',
        '',
        content[content.length - 1],
      ];
    }
  } else if(content.length === 17) {
    const thirdLast = content[content.length - 3];
    if (contentPattern.noEmpCatOper.test(thirdLast)) {
      // normal
      const matched = thirdLast.match(contentPattern.noEmpCatOper);
      return [
        ...content.slice(0, 3),
        ...content.slice(4, content.length - 3),
        matched[1],
        matched[2],
        ...content.slice(content.length - 2),
      ];
    } else {
      // missing category operation
      return [
        ...content.slice(0, 3),
        ...content.slice(4, content.length - 2),
        '',
        ...content.slice(content.length - 2),
      ];
    }
  } else {
    console.warn(
      `Outlier: length is ${content.length}. ID is ${content[0]}. Month: ${options.month}, Year: ${options.year}`
    );
    return content;
  }
}

function isCurContentSecondLine(curContent) {
  const discard = curContent.find((item) => item === '(3)');
  return contentPattern.type.test(curContent[0]) && _.isUndefined(discard);
}

module.exports = {
  extractContent2017,
  extractContent2016,
};