'use strict';
const { createReadStream } = require('fs');

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

function getFiles(startYear, endYear) {
  const files = [];

  if(startYear < 2005 || startYear > 2019) {
    console.error('start year not valid');
    return files;
  }

  if(endYear < 2005 || endYear > 2019) {
    console.error('end year not valid');
    return files;
  }

  if(endYear < startYear) {
    console.error('end year is earlier than start year');
    return files;
  }

  for(let i = endYear; i >= startYear; i--) {
    files.push({
      name: `./NC-pdf/statistical_detail_report_september_${i}.pdf`,
      year: i,
    });
  }

  return files;
}

function parseAndConcat(dataAll, year) {
  return async (buffer) => {
    const dataPerFile = await parse(buffer, year);
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
        onEnd: parseAndConcat(dataAll, file.year),
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

// const files = getFiles(2016, 2016);
const files = getFiles(2019, 2019);
transform(files);

