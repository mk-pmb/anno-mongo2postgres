// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
// import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';

import fixAuthor from './fixAuthor.mjs';
import rewriteReplyTo from './rewriteReplyTo.mjs';
import ubFacts from './facts.mjs';

const namedEqual = equal.named.deepStrictEqual;
const { annoBaseUrl } = ubFacts;


const EX = async function optimizeReviDetails(reviAnno, job) {
  await optimizeReviDetails.orig(reviAnno, job);
  const { data } = reviAnno;

  if (data.creator === 'wgd@DWork') {
    let title = data['dc:title'];
    if (title) {
      if (title.startsWith('Bildzyklus ')) {
        title = 'Bildzyklus zum ›Welschen Gast‹, ' + title;
      }
      data['dc:title'] = title;
    }
  }
  await fixAuthor(reviAnno, job);
  await rewriteReplyTo(reviAnno, job);

  // const origData = { ...data };
  function omitKey(k) { delete data[k]; }
  EX.computableTopLevelKeys.forEach(omitKey);

  objMapValues(data, function checkTopLevelKey(v, k) {
    if (EX.standardTopLevelKeys.includes(k)) { return; }
    delete data[k];

    if ((k === 'via') || (k === 'versionOf')) {
      const caid = reviAnno.divePath.expectedContainerAnnoId;
      namedEqual('attribute ' + k, v, (annoBaseUrl + 'anno/' + caid));
      return;
    }

    console.warn('nonStandardTopLevelKey:', k, v);
    job.counters.add('nonStandardTopLevelKey:' + k + '=' + v);
  });
};


EX.computableTopLevelKeys = [
  '_lastCommented',
  'collection',
  'id',
];


EX.standardTopLevelKeys = [
  '@context',
  'as:inReplyTo',
  'body',
  'canonical',
  'created',
  'creator',
  'dc:identifier',
  'dc:title',
  'modified',
  'motivation',
  'rights',
  'target',
  'type',
];


export default EX;
