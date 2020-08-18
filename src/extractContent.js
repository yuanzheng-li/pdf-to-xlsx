'use strict';
const _ = require('lodash');

const { contentPattern2017, contentPattern2016 } = require('./contentPattern');
const columns = require('./worksheetColumns');

/**
 * before 2016, 5-STAR
 * before 2016, operation name can take up 3 lines
 * before 2016, need another way to differentiate detail page and summary page, maybe the table header?
 */
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

    if (contentPattern2017.type.test(curContent[0].text)) {
      const matched = curContent[0].text.match(contentPattern2017.type);
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
      if (contentPattern2017.id.test(prevContent[0].text)) {
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

function extractContent2016() {

}

module.exports = {
  extractContent2017,
  extractContent2016,
};