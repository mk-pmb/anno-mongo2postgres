// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';

const namedEqual = equal.named.deepStrictEqual;


const EX = async function optimizeReviDetails(reviAnno, job) {
  await optimizeReviDetails.orig(reviAnno, job);
  const { data } = reviAnno;

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
    job.counters.add('nonStandardTopLevelKey:' + k + '=' + v);
  });
};


EX.standardTopLevelKeys = [
  '@context',
  'body',
  'canonical',
  'created',
  'creator',
  'modified',
  'rights',
  'target',
  'title',
  'type',
  'dc:identifier',
];


export default EX;
