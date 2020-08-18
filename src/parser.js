'use strict';

const { PdfReader } = require('pdfreader');
const _ = require('lodash');

const { headerPattern2017, headerPattern2016 } = require('./headerPattern');
const { extractContent2017, extractContent2016 } = require('./extractContent');
const { extractHeader2017, extractHeader2016 } = require('./extractHeader');


function extractData(pages, year) {
  const data = [];

  pages.forEach((page) => {
    if(year > 2016) {
      extractContent2017(data, page, extractHeader2017(page), year);
    } else {
      extractContent2017(data, page, extractHeader2017(page), year);
    }
  });

  return data;
}

function parseData(pages, year) {
  const normalizedPages = normalizeRows(pages);
  console.info(
    'There are %d pages after filtering out empty pages and normalization',
    normalizedPages.length
  );
  const detailPages = normalizedPages.filter((page) => {
    if(year > 2016) {
      return headerPattern2017.detail.pattern.test(page[headerPattern2017.detail.row][0].text);
    } else {
      return headerPattern2017.detail.pattern.test(
        page[headerPattern2017.detail.row][0].text
      );
    }
  });
  console.info('There are %d details pages', detailPages.length);

  return extractData(detailPages, year);
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

function readPdf(buffer) {
  const pages = [];
  let rows = {}; // indexed by y-position

  return new Promise((resolve, reject) => {
    new PdfReader().parseBuffer(buffer, (err, item) => {
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
        (rows[item.y] = rows[item.y] || []).push({
          text: item.text,
          x: parseFloat(item.x).toFixed(2),
        });
      }
    });
  });
}

module.exports = async function parse(buffer, year) {
  const pages = await readPdf(buffer);
  console.info('Read %d pages', pages.length);
  const parsedData = parseData(pages, year);
  return parsedData;
};