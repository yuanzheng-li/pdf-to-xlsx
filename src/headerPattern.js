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

// table headers are rows with y position <= 4.94
const headerPattern2016 = {
  // In details page, y = 4.38 only has one item with text equals "   ID/    OPERATION NAME             IND.  S   INF ---CHILD BY AGES-----------  --CHILDREN-- NO "
  // In summary page, y = 4.38 has two items. The 1st item with text equals "SHIFT NUMBER PCT  OF OPERATION   NUMBER   PCT     SITE       NUMBER  PCT   PERMIT         NUMBER  PCT  NUMBER   PCT  NUMBER   P"
  // We use whether line 4.38 has ID/ or not to determine whether its detail or summary page
  detail: {
    row: 4.38,
    altRow: 4.27,
    pattern: /ID\//i,
  },
  // county is all uppercase, and we want only the first of each word to be uppercase
  county: {
    row: 2.13,
    altRow: 2.08,
    pattern: /\d\s*([\w|\s]+)/i
  },
};

module.exports = {
  headerPattern2017,
  headerPattern2016,
};