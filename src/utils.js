'use strict';

function concatenateRowText(row) {
  const rowText = row.reduce((result, item) => {
    let text = `${item.text}  `;
    const startWithDigit = /^\d/.test(text);

    if (startWithDigit) {
      text = `  ${text}`;
    }

    result.push(text);
    return result;
  }, []);

  // broken row in pdf Feb 2017
  // Case 1:
  // ID: 01000362
  // [{
  //   text: '... constructed f'
  //   x: 4.16
  // },
  // {
  //   text: 'or ...',
  //   x: 45.22
  // }]

  // Case 2:
  // ID: 01000289
  // [{
  //   text: '... Independ'
  //   x: 4.16
  // },
  // {
  //   text: 'ent ...',
  //   x: 38.33
  // }]
  const secondRow = row[1];
  if (secondRow?.x === '45.22' || secondRow?.x === '38.33') {
    rowText[0] = rowText[0].trimEnd();
  }

  return rowText.join('');
}

module.exports = concatenateRowText;