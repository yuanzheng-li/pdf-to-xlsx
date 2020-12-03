'use strict';

function concatenateRowText(row) {
  const text = row.reduce((result, item) => {
    let text = item.text;
    const endWithDigit = /\d$/.test(text);
    const startWithDigit = /^\d/.test(text);

    if(startWithDigit) {
      text = `  ${text}`;
    }

    if(endWithDigit) {
      text = `${text}  `;
    }

    result.push(text);
    return result;
  }, []);

  return text.join('');
}

module.exports = concatenateRowText;