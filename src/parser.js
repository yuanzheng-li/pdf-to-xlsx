'use strict';

const { PdfReader } = require('pdfreader');
const _ = require('lodash');

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
};

// 1st row of 1st content is at 7.42. It's an array of needed 18 items.
// 2nd row of 1st content is at 7.89. It's an array of only 1 string. There are two types of the string.
//    1. "1 Star H 2C". We need to get "1" and "H".
//    2. a string with letters and digits. e.g. "Prov C", "Other", "Temp C", "Lic SDC", "Temp FCC Lic", "GS110SP" etc.
//      year: 2019; ID:73000237 has GS110SP

// 1st row of 1st content is at 9.72. 2nd row of 1st content is at 10.19
const contentPattern = {
  id: /^\d+$/i,
  type: /(\d)\sStar\s([H|C])|^[a-zA-Z][a-zA-Z-\d\s]+/,
  discard: /^\([2|3]\)$/i,
};

function extractData(pages) {
  const data = [];
  pages.forEach((page) => {
    const pageHeader = extractHeader(page);

    extractContent(data, page, pageHeader);
  });
  return data;
}

/**
 * before 2016, 5-STAR
 * before 2016, operation name can take up 3 lines
 * before 2016, need another way to differentiate detail page and summary page, maybe the table header?
 */
function extractContent(data, page, pageHeader) {
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
            `Outlier: length is ${prevContent.length}. ID is ${prevContent[0].text}. Year: ${pageHeader.year}`
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
        item.year = pageHeader.year;
        item.qris = qris;
        item.type = type;
      }

      data.push(item);
    }
  });
}

/**
 * before 2016, the county only takes up 1 line
 * 
 */
function extractHeader(page) {
  const pageNo = page['1.00'][1].text;

  let county = '';

  if (!_.isUndefined(page[headerPattern.county.row][1])) {
    county += page[headerPattern.county.row][1].text;
  }
  if (
    page[headerPattern.county.altRow] &&
    !_.isUndefined(page[headerPattern.county.altRow][0])
  ) {
    county +=
      county.length === 0
        ? `${page[headerPattern.county.altRow][0].text}`
        : ` ${page[headerPattern.county.altRow][0].text}`;
  }

  console.assert(county.length !== 0, `county not found on page ${pageNo}`);

  const reportDate = page[headerPattern.reportDate.row][1].text;
  const year = parseInt(reportDate.match(headerPattern.reportDate.pattern)[0]);
  console.assert(
    !_.isUndefined(year) && !_.isUndefined(reportDate),
    `report year not found on page ${pageNo}`
  );

  return {
    year,
    county,
    pageNo
  };
}

function parseData(pages) {
  const normalizedPages = normalizeRows(pages);
  console.info(
    'There are %d pages after filtering out empty pages and normalization',
    normalizedPages.length
  );
  const detailPages = normalizedPages.filter((page) => {
    return headerPattern.detail.pattern.test(page[headerPattern.detail.row][0].text);
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

module.exports = async function parse(buffer) {
  const pages = await readPdf(buffer);
  console.info('Read %d pages', pages.length);
  const parsedData = parseData(pages);
  return parsedData;
};