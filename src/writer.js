'use strict';

const Excel = require('exceljs');

const columns = require('./worksheetColumns');

async function createWorksheet(data) {
  const workbook = new Excel.Workbook();

  const workSheet = workbook.addWorksheet('NCQRS');

  workSheet.columns = columns;
  workSheet.getRow(1).font = {
    bold: true,
  };

  data.forEach((element) => workSheet.addRow(element));

  await workbook.xlsx.writeFile('NCQRS.xlsx');
}

module.exports = createWorksheet;