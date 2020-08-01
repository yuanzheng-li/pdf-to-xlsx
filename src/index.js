'use strict';

const parse = require('./parser');

async function transform(filename) {
  const pages = await parse(filename);
}

transform('statistical_detail_report_august_2019.pdf');

