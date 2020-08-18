'use strict';

// table headers are rows with y position <= 3.3
const headerPattern2017 = {
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

const headerPattern2016 = {

};

module.exports = {
  headerPattern2017,
  headerPattern2016,
};