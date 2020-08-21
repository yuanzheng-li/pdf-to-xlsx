'use strict';

function concatenateRowText(row) {
  const text = row.reduce((result, item) => {
    result.push(item.text);
    return result;
  }, []);

  return text.join('');
}

module.exports = concatenateRowText;