'use strict';

const { PdfReader } = require('pdfreader');
const _ = require('lodash');

const { headerPattern2017, headerPattern2016 } = require('./headerPattern');
const { extractContent2017, extractContent2016 } = require('./extractContent');
const { extractHeader2017, extractHeader2016 } = require('./extractHeader');


function extractData(pages, options) {
  const data = [];

  pages.forEach((page) => {
    if(!options.isOldFormat) {
      extractContent2017(data, page, extractHeader2017(page), options);
    } else {
      extractContent2016(data, page, extractHeader2016(page), options);
    }
  });

  console.info('There are %d data entries for Month %d, Year %d', data.length, options.month, options.year);
  return data;
}

function parseData(pages, options) {
  const normalizedPages = normalizeRows(pages);
  console.info(
    'There are %d pages after filtering out empty pages and normalization',
    normalizedPages.length
  );
  const detailPages = normalizedPages.filter((page) => {
    if(!options.isOldFormat) {
      return headerPattern2017.detail.pattern.test(page[headerPattern2017.detail.row][0].text);
    } else {
      if (_.isUndefined(page[headerPattern2016.detail.row]) && _.isUndefined(page[headerPattern2016.detail.altRow])) {
        console.warn('No detail page found for reports with old format! Month: %d, Year: %d.', options.month, options.year);
        return false;
      }

      const detailTableHeader = page[headerPattern2016.detail.row] || page[headerPattern2016.detail.altRow];
      return headerPattern2016.detail.pattern.test(
        detailTableHeader[0].text
      );
    }
  });
  console.info('There are %d details pages', detailPages.length);

  return extractData(detailPages, options);
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

module.exports = async function parse(buffer, options) {
  const pages = await readPdf(buffer);
  console.info('Read %d pages for Month %d, Year %d', pages.length, options.month, options.year);
  const parsedData = parseData(pages, options);
  return parsedData;
};