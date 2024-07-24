// -*- coding: utf-8, tab-width: 2 -*-

const idFmt = {

  extraRegExps: {
    // uuid × 11156
    '16 bytes base64-url': /^[A-Za-z0-9_\-]{22}$/, // × 14211
    'hex × 10': /^[0-9a-f]{10}$/, // × 12174
    'hex × 12': /^[0-9a-f]{12}$/, // × 9
    'hex × 13': /^[0-9a-f]{13}$/, // × 291
    'hex × 36': /^[0-9a-f]{36}$/, // × 7
  },


};


export default idFmt;
