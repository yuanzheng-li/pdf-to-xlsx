'use strict';

const contentPattern = {
  id: /^\d+$/i,
  type: /(\d)[\s|-]star\s([H|C])|^[a-zA-Z][a-zA-Z-\d\s]+/i,
  discard: /^\([2|3]\)$/i,
  noEmpCatOper: /^(\d+)\s+([a-zA-Z\/\s]+)/i,
  twoNums: /^(\d+)\s+(\d+)$/i,
  threeNums: /^(\d+)\s+(\d+)\s+(\d+)$/i,
  numNoEmpCatOper: /^(\d+)\s+(\d+[a-zA-Z\/\s]+)/i,
};

module.exports = contentPattern;