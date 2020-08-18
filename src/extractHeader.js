'use strict';

const _ = require('lodash');

const { headerPattern2017, headerPattern2016 } = require('./headerPattern');

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

function extractHeader2016() {

}

module.exports = {
  extractHeader2017,
  extractHeader2016,
};