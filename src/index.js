'use strict';
const { createReadStream } = require('fs');

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

function getFiles({years = [2005, 2020], months = [1, 12]}) {
  const yearsLen = years.length;
  const monthsLen = months.length;

  if(yearsLen < 1 || yearsLen > 2) {
    console.error('Only 1 or 2 arguments are allowed for years.');
    process.exit(1);
  }

  if (monthsLen < 1 || monthsLen > 2) {
    console.error('Only 1 or 2 arguments are allowed for months.');
    process.exit(1);
  }

  if(years.some((year) => (year < 2005 || year > 2020))) {
    console.error('Year not valid');
    process.exit(1);
  }

  if(months.some((month) => month < 1 || month > 12)) {
    console.error('Month not valid');
    process.exit(1);
  }

  let startYear;
  let endYear;
  let startMonth;
  let endMonth;
  
  if(yearsLen === 2) {
    startYear = Math.min(...years);
    endYear = Math.max(...years);
  } else if(yearsLen === 1) {
    startYear = years[0];
    endYear = 2020;
  }

  if(monthsLen === 2) {
    startMonth = Math.min(...months);
    endMonth = Math.max(...months);
  } else if(monthsLen === 1) {
    startMonth = months[0];
    endMonth = 12;
  }

  const monthMapping = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const files = [];

  for (let year = endYear; year >= startYear; year--) {
    // feb 2017 and july 2017 have NaN and problem with county name. Others have problem with county name.
    const oldFormat = {
      april_2017: true,
      august_2017: true,
      december_2017: true,
      february_2017: true,
      july_2017: true,
      june_2017: true,
      march_2017: true,
      may_2017: true,
    };

    // There are only 8 months of reports for 2020 so far.
    if(year === 2020) {
      endMonth = 11;
    }

    for(let month = startMonth; month <= endMonth; month++) {
      files.push({
        name: `./NC-pdf/statistical_detail_report_${monthMapping[month - 1]}_${year}.pdf`,
        year: year,
        month: month,
        isOldFormat: oldFormat[`${monthMapping[month - 1]}_${year}`] || (year > 2016 ? false : true) || false
      });
    }
  }

  return files;
}

function parseAndConcat(dataAll, options) {
  return async (buffer) => {
    const dataPerFile = await parse(buffer, options);
    dataAll.push(...dataPerFile);
  };
}

async function transform(files) {
  const dataAll = [];

  const parsingQueue = files.reduce(async (result, file) => {
    await result;

    return new Promise((resolve, reject) => {
      const reader = createReadStream(file.name);
      const bufferer = new Bufferer({
        onEnd: parseAndConcat(dataAll, {
          year: file.year,
          month: file.month,
          isOldFormat: file.isOldFormat,
        }),
      });

      reader
        .pipe(bufferer)
        .once('finish', resolve)
        .once('error', reject);
    });
  }, true);

  try {
    await parsingQueue;
    console.log('parsing done');
    await write(dataAll);
    console.log('writing done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const files = getFiles({
  years: [2017, 2017],
  months: [2, 2],
});
transform(files);

