'use strict';

const fs = require('fs');
const { PdfReader } = require('pdfreader');
const _ = require('lodash/core');

const columns = require('./worksheetColumns');

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
  // in some pages, the county occupies 2 rows. In this case, we need to get the only item on row 4.05
  county: {
    row: 3.25,
    altRow: 4.05,
    pattern: null,
  },
  // the row is array with only 1 item. We just need to get the 2nd item.
  // homeCenter: {
  //   row: 3.30,
  //   pattern: null,
  // }
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

function extractData(pages) {
  const data = [];
  pages.forEach((page) => {
    const pageNo = page['1.00'][1];

    const county =
      page[headerPattern.county.row][1] || page[headerPattern.county.altRow][0];
    console.assert(!_.isUndefined(county), `county not found on page ${pageNo}`);

    const reportDate = page[headerPattern.reportDate.row][1];
    const year = reportDate.match(headerPattern.reportDate.pattern)[0];
    console.assert(
      !_.isUndefined(year) && !_.isUndefined(reportDate),
      `report year not found on page ${pageNo}`
    );

    const keys = Object.keys(page).sort((a, b) => parseFloat(a) - parseFloat(b));
    keys.filter((key) => {
      return parseFloat(key) > 7;
    }).forEach((key) => {
      const content = page[key];
      console.assert(!_.isUndefined(content), `content not found on page ${pageNo}`);
      const item = {};
      if(contentPattern.id.test(content[0]) && content.length === 18) {
        const usefulContent = [...content.slice(0, 3), ...content.slice(4)];
        usefulContent.forEach((value, index) => {
          item[columns[index].key] = value;
        });
        
        item.county = county;
        item.year = year;

        data.push(item);
      } else if(contentPattern.type.test(content[0])) {
        const matched = content[0].match(contentPattern.type);
        let qris = '';
        let type = '';
        if(!_.isUndefined(matched[1]) && !_.isUndefined(matched[2])) {
          qris = matched[1];
          type = matched[2];
        } else {
          type = matched[0];
        }

        data[data.length - 1].qris = qris;
        data[data.length - 1].type = type;
      }
    });
  });
  return data;
}

function parseData(pages) {
  const normalizedPages = normalizeRows(pages);
  console.info(
    'There are %d pages after filtering out empty pages and normalization',
    normalizedPages.length
  );
  const detailPages = normalizedPages.filter((page) => {
    return headerPattern.detail.pattern.test(page[headerPattern.detail.row][0]);
  });
  console.info('There are %d details pages', detailPages.length);

  return extractData(detailPages);
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
  const pages = await readPdf(filename);
  console.info('Read %d pages', pages.length);
  const parsedData = parseData(pages);
  return parsedData;
};