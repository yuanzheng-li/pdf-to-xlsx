'use strict';
const { createReadStream } = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

const EARLIEST_YEAR = 2005;
const LATEST_YEAR = 2020;
const EARLIEST_MONTH = 1;
const LATEST_MONTH = 12;

function getFiles({ startYear, endYear = LATEST_YEAR, startMonth, endMonth = LATEST_MONTH }) {
  if (startYear < EARLIEST_YEAR || startYear > LATEST_YEAR) {
    console.error('Start year not valid');
    process.exit(1);
  }

  if (endYear < EARLIEST_YEAR || endYear > LATEST_YEAR) {
    console.error('End year not valid');
    process.exit(1);
  }

  if (startMonth < EARLIEST_MONTH || startMonth > LATEST_MONTH) {
    console.error('Start month not valid');
    process.exit(1);
  }

  if (endMonth < EARLIEST_MONTH || endMonth > LATEST_MONTH) {
    console.error('End month not valid');
    process.exit(1);
  }

  if (startYear > endYear) {
    console.log(`Start year is ${startYear}. End year is ${endYear}. Start year is later than end year.`);
    process.exit(1);
  }

  if (startMonth > endMonth) {
    console.log(`Start month is ${startMonth}. End month is ${endMonth}. Start month is later than end month.`);
    process.exit(1);
  }

  const monthMapping = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
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

    for (let month = startMonth; month <= endMonth; month++) {
      files.push({
        name: `./NC-pdf/statistical_detail_report_${monthMapping[month - 1]}_${year}.pdf`,
        year: year,
        month: month,
        isOldFormat: oldFormat[`${monthMapping[month - 1]}_${year}`] || (year > 2016 ? false : true) || false,
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

      reader.pipe(bufferer).once('finish', resolve).once('error', reject);
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

const files = getFiles(argv);
transform(files);

