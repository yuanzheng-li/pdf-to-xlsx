'use strict';
const { createReadStream } = require('fs');

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

function getFiles(...years) {
  const argsLen = years.length;

  if(argsLen < 1 || argsLen > 2) {
    console.error('Only 1 or 2 arguments are allowed.');
    process.exit(1);
  }

  if(years.some((year) => (year < 2005 || year > 2019))) {
    console.error('Year not valid');
    process.exit(1);
  }

  let startYear = 2005;
  let endYear = 2019;
  
  if(argsLen === 2) {
    startYear = Math.min(...years);
    endYear = Math.max(...years);
  } else if(argsLen === 1) {
    startYear = years[0];
  }

  const files = [];

  for (let i = endYear; i >= startYear; i--) {
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

const files = getFiles(2005, 2019);
transform(files);

