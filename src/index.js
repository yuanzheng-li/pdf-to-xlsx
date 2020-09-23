'use strict';
const { createReadStream } = require('fs');

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

function getFiles({years, allMonths}) {
  const yearsLen = years.length;

  if(yearsLen < 1 || yearsLen > 2) {
    console.error('Only 1 or 2 arguments are allowed.');
    process.exit(1);
  }

  if(years.some((year) => (year < 2005 || year > 2020))) {
    console.error('Year not valid');
    process.exit(1);
  }

  let startYear = 2005;
  let endYear = 2020;
  
  if(yearsLen === 2) {
    startYear = Math.min(...years);
    endYear = Math.max(...years);
  } else if(yearsLen === 1) {
    startYear = years[0];
  }

  const files = [];

  for (let year = endYear; year >= startYear; year--) {
    if(allMonths) {
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
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
      let endMonth = 12;
      if(year === 2020) {
        endMonth = 8;
      }

      for(let month = 1; month <= endMonth; month++) {
        files.push({
          name: `./NC-pdf/statistical_detail_report_${months[month - 1]}_${year}.pdf`,
          year: year,
          month: month,
          isOldFormat: oldFormat[`${months[month - 1]}_${year}`] || false
        });
      }
    } else {
      files.push({
        name: `./NC-pdf/statistical_detail_report_september_${year}.pdf`,
        year: year,
        month: 9,
        isOldFormat: year > 2016 ? false : true,
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
  allMonths: true,
});
transform(files);

