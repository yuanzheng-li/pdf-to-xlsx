'use strict';

const Excel = require('exceljs');

const columns = require('./worksheetColumns');

async function createWorksheet(data) {
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    filename: 'NCQRS.xlsx',
    // useStyles: true,
    useSharedStrings: true,
  });

  const workSheet = workbook.addWorksheet('NCQRS');

  workSheet.columns = columns;
  // workSheet.getRow(1).font = {
  //   bold: true,
  // };

  data.forEach((element) => workSheet.addRow(element).commit());

  workSheet.commit();

  await workbook.commit();
}

module.exports = createWorksheet;