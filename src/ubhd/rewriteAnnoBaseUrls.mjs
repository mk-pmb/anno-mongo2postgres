// -*- coding: utf-8, tab-width: 2 -*-

import objMapValues from 'lodash.mapvalues';

import ubFacts from './facts.mjs';

const { annoBaseUrl } = ubFacts;

const rewriteBaseUrlTo = (process.env.REWRITE_BASEURL
  || 'http://localhost:33321/anno/'
  // || 'https://anno.ub.uni-heidelberg.de/'
);


const EX = function rewriteAnnoBaseUrls(anno) {
  return objMapValues(anno, EX.maybeRewrite);
};


Object.assign(EX, {

  inplace(anno) { return Object.assign(anno, EX(anno)); },

  maybeRewrite(data, key) {
    if (key === 'body') { return data; }
    if (key === 'dc:title') { return data; }
    let tmp = JSON.stringify(data).split(annoBaseUrl);
    tmp = tmp.map(x => x.replace(/^(anno\/)+/, ''));
    tmp = tmp.join(rewriteBaseUrlTo);
    tmp = JSON.parse(tmp);
    return tmp;
  },


});


export default EX;
