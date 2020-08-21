'use strict';

const _ = require('lodash');

const { headerPattern2017, headerPattern2016 } = require('./headerPattern');
const concatenateRowText = require('./utils');

/**
 * before 2016, the county only takes up 1 line
 * 
 */
function extractHeader2017(page) {
  const pageNo = page['1.00'][1].text;

  let county = '';

  if (!_.isUndefined(page[headerPattern2017.county.row][1])) {
    county += page[headerPattern2017.county.row][1].text;
  }
  if (
    page[headerPattern2017.county.altRow] &&
    !_.isUndefined(page[headerPattern2017.county.altRow][0])
  ) {
    county +=
      county.length === 0
        ? `${page[headerPattern2017.county.altRow][0].text}`
        : ` ${page[headerPattern2017.county.altRow][0].text}`;
  }

  console.assert(county.length !== 0, `county not found on page ${pageNo}`);

  // const reportDate = page[headerPattern2017.reportDate.row][1].text;
  // const year = parseInt(reportDate.match(headerPattern2017.reportDate.pattern)[0]);
  // console.assert(
  //   !_.isUndefined(year) && !_.isUndefined(reportDate),
  //   `report year not found on page ${pageNo}`
  // );

  return {
    // year,
    county,
    pageNo
  };
}

function extractHeader2016(page) {
  const pageNo = page['1.00'][1].text.trim();

  // There is only one item on county.row. The county is the 2nd item after split the text.
  // Only the 100th county need to be splited by one space character. If split by 2 spaces, it will be in the 1st item of the splited array
  // and the 2nd item is an empty string.
  const countyRow = page[headerPattern2016.county.row];
  
  const countyLine = concatenateRowText(countyRow).trim().split('  ');
  const rawCounty = countyLine[1] || countyLine[0];
  const matched = rawCounty.match(headerPattern2016.county.pattern);
  let county = matched[1]
    .split(' ')
    .map((item) => `${item[0]}${item.substring(1).toLowerCase()}`)
    .join(' ');

  console.assert(county.length !== 0, `county not found on page ${pageNo}`);

  return {
    county,
    pageNo,
  };
}

module.exports = {
  extractHeader2017,
  extractHeader2016,
};