'use strict';

const fs = require('fs');
const { PdfReader } = require('pdfreader');
const _ = require('lodash/core');

// TODO: log processing data.

// table headers are rows with y position <= 3.3
const headerPattern = {
  // the row is array with 2 items. We need to extract the year from the 2nd item.
  reportDate: {
    row: 2.27,
    pattern: /\d{4}$/i,
  },
  // the row is array with only 1 item
  detail: {
    row: 2.55,
    pattern: /Detail$/i,
  },
  // the row is array with 2 items. We just need to get the 2nd item.
  county: {
    row: 3.25,
    pattern: null,
  },
  // the row is array with only 1 item. We just need to get the 2nd item.
  homeCenter: {
    row: 3.3,
    pattern: null,
  }
};

// 1st row of 1st content is at 7.42. It's an array of needed 18 items.
// 2nd row of 1st content is at 7.89. It's an array of only 1 string. There are two types of the string.
//    1. "1 Star H 2C". We need to get "1" and "H".
//    2. a string with only letters. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", etc.

// 1st row of 1st content is at 9.72. 2nd row of 1st content is at 10.19
const contentPattern = {
  id: /^\d+$/i,
  type: /(\d)\sStar\s([H|C])|[a-zA-Z\s]+/,
  discard: /^\([2|3]\)$/i,
};

function parseData(pages) {
  const normalizedPages = normalizeRows(pages);
  const detailPages = normalizedPages.filter((page) => {
    return headerPattern.detail.pattern.test(page[headerPattern.detail.row][0]);
  });
  console.log(Object.keys(detailPages[0]).sort((a, b) => parseFloat(a) - parseFloat(b)));
}

// normalize the row's y coordinators to 1
function normalizeRows(pages) {
  return pages.filter((page) => {
    return !_.isEmpty(page);
  }).map((page) => { // page is an object of rows
    const rowYPositions = Object.keys(page).map((y) => parseFloat(y));
    const firstRowY = Math.min(...rowYPositions);
    const yDiff = 1 - firstRowY;
    const normalizedRow = {};

    for(const key of rowYPositions) {
      normalizedRow[(key + yDiff).toFixed(2)] = page[key];
    }

    return normalizedRow;
  });
}

function readPdf(filename) {
  const pages = [];
  let rows = {}; // indexed by y-position

  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, pdfBuffer) => {
      if (err) {
        reject(err);
      }

      new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
        if (err) {
          reject(err);
        }

        if (!item) {
          // end of file
          pages.push(rows);
          resolve(pages);
        } else if (item.page) {
          // new page
          pages.push(rows);
          rows = {}; // clear rows for next page
        } else if (item.text) {
          // accumulate text items into rows object, per line
          (rows[item.y] = rows[item.y] || []).push(item.text);
        }
      });
    });
  });
}

module.exports = async function parse(filename) {
  const pages = await readPdf('statistical_detail_report_august_2019.pdf');
  const parsedData = parseData(pages);
  return parsedData;
};

const pages = readPdf('statistical_detail_report_august_2019.pdf').then((pages) => {
  const parsedData = parseData(pages);
});