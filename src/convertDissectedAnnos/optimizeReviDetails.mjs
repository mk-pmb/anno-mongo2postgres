// -*- coding: utf-8, tab-width: 2 -*-

import fixStringsDeeplyInplace from 'fix-unicode-strings-deeply-inplace-pmb';


const EX = async function optimizeReviDetails(anno) {
  const { data } = anno;
  fixStringsDeeplyInplace(data, { eol: true, trim: true });
  data.created = anno.meta.time_created;
  const title = String(data['dc:title'] || data.title || '').trim();
  delete data.title;
  if (title) { data['dc:title'] = title; }
};


EX.diglitBaseUrl = 'https://digi.ub.uni-heidelberg.de/diglit/';
EX.annoTestBaseUrl = EX.diglitBaseUrl + 'annotationen_test/';


export default EX;
