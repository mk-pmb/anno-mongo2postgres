// -*- coding: utf-8, tab-width: 2 -*-

import objMapValues from 'lodash.mapvalues';

import ubFacts from './facts.mjs';

const { annoBaseUrl } = ubFacts;

const rewriteBaseUrlTo = (new URL((process.env.REWRITE_BASEURL
  || 'http://localhost:33321/anno/'
), annoBaseUrl)).href;


const EX = function rewriteAnnoBaseUrls(anno) {
  return objMapValues(anno, EX.maybeRewrite);
};


Object.assign(EX, {

  inplace(anno) { return Object.assign(anno, EX(anno)); },

  ignoreFields: [
    'body',
    'dc:title',
  ],

  rewriteFields: [
    'as:inReplyTo',
    'target',
  ],

  maybeRewrite(origVal, key) {
    if (EX.ignoreFields.includes(key)) { return origVal; }
    let tmp = JSON.stringify(origVal).split(annoBaseUrl);
    if (tmp.length < 2) { return origVal; }

    if (!EX.rewriteFields.includes(key)) {
      const e = ('Anno has the base URL in field ' + key + ': ' + tmp.map(
        p => p.slice(0, 1024)).join('\n!! ' + annoBaseUrl + ' !!\n'));
      throw new Error(e);
    }

    tmp = tmp.map(x => x.replace(/^(anno\/)+/, ''));
    tmp = tmp.join(rewriteBaseUrlTo);
    tmp = JSON.parse(tmp);
    return tmp;
  },


});


export default EX;
