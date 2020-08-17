'use strict';
const { createReadStream } = require('fs');

const parse = require('./parser');
const write = require('./writer');
const Bufferer = require('./bufferer');

function getFilenames(startYear, endYear) {
  const filenames = [];

  if(startYear < 2005 || startYear > 2019) {
    console.error('start year not valid');
    return filenames;
  }

  if(endYear < 2005 || endYear > 2019) {
    console.error('end year not valid');
    return filenames;
  }

  if(endYear < startYear) {
    console.error('end year is earlier than start year');
    return filenames;
  }

  for(let i = endYear; i >= startYear; i--) {
    filenames.push(`./NC-pdf/statistical_detail_report_september_${i}.pdf`);
  }

  return filenames;
}

function parseAndConcat(dataAll) {
  return async (buffer) => {
    const dataPerFile = await parse(buffer);
    dataAll.push(...dataPerFile);
  };
}

async function transform(filenames) {
  const dataAll = [];

  const parsingQueue = filenames.reduce(async (result, filename) => {
    await result;

    return new Promise((resolve, reject) => {
      const reader = createReadStream(filename);
      const bufferer = new Bufferer({
        onEnd: parseAndConcat(dataAll),
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

const filenames = getFilenames(2019, 2019);
transform(filenames);

