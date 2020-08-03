'use strict';

const parse = require('./parser');
const write = require('./writer');

async function transform(filename) {
  const data = await parse(filename);
  await write(data);
  console.log('done');
}

transform('statistical_detail_report_august_2019.pdf');

