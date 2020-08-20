'use strict';

const contentPattern = {
  id: /^\d+$/i,
  type: /(\d)[\s|-]star\s([H|C])|^[a-zA-Z][a-zA-Z-\d\s]+/i,
  discard: /^\([2|3]\)$/i,
};

module.exports = contentPattern;