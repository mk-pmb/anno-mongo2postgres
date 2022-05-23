// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
// import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';

const namedEqual = equal.named.deepStrictEqual;


const EX = async function optimizeReviDetails(reviAnno, job) {
  await optimizeReviDetails.orig(reviAnno, job);
  const { recId, data } = reviAnno;

  if (data.creator === 'wgd@DWork') {
    if (data.title && (!data.title.startsWith('Bildzyklus '))) {
      data.title = 'Bildzyklus zum ›Welschen Gast‹, ' + data.title;
    }
  }

  namedEqual('Expected no previous dc:*', data['dc:identifier'], undefined);

  objMapValues(data, function checkTopLevelKey(v, k) {
    if (EX.standardTopLevelKeys.includes(k)) { return; }
    delete data[k];
    if (k === '_lastCommented') { return; }
    if (k === 'collection') { return; }
    if (k === 'doi') {
      const okAssu = job.assume('legacyDoi:verified:' + recId);
      okAssu.ubhdOptim = v;
      const okDoi = okAssu.reviDoi;
      if (v === okDoi) {
        data['dc:identifier'] = 'urn:doi:' + v;
        job.assume('legacyDoi:converted:' + recId, { confirmed: true });
        job.counters.add('legacyDoi:converted');
        return;
      }
      console.warn('Omit unverified legacy DOI @', recId);
      job.counters.add('legacyDoi:omitUnverified');
      return;
    }
    job.counters.add('nonStandardTopLevelKey:' + k + '=' + v);
  });
};


EX.standardTopLevelKeys = [
  '@context',
  'body',
  'canonical',
  'created',
  'creator',
  'dc:identifier',
  'modified',
  'rights',
  'target',
  'title',
  'type',
];


export default EX;
