// -*- coding: utf-8, tab-width: 2 -*-

import arrayOfTruths from 'array-of-truths';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';

import fixAuthor from './fixAuthor.mjs';
import rewriteAnnoBaseUrls from './rewriteAnnoBaseUrls.mjs';
import rewriteReplyTo from './rewriteReplyTo.mjs';
import ubFacts from './facts.mjs';

const namedEqual = equal.named.deepStrictEqual;
const digiDoiBaseUrl = 'https://doi.org/' + ubFacts.digiDoi;


const EX = async function optimizeReviDetails(reviAnno, job) {
  await optimizeReviDetails.orig(reviAnno, job);
  const { data, divePath } = reviAnno;
  delete data.doi;
  namedEqual('versionIndices.length', divePath.versionIndices.length, 1);
  const versId = (divePath.expectedContainerAnnoId + '~'
    + (divePath.versionIndices[0] + 1));
  const hasDoi = job.knownDois[versId];
  if (hasDoi) {
    data['dc:identifier'] = digiDoiBaseUrl + hasDoi;
    // eslint-disable-next-line no-param-reassign
    delete job.knownDois[divePath.expectedContainerAnnoId];
    // eslint-disable-next-line no-param-reassign
    delete job.knownDois[versId];
  }

  if (data.creator === 'wgd@DWork') {
    if ((data.canonical || '').startsWith('urn:wgd:')) {
      delete data.canonical;
    }
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

  data.body = arrayOfTruths(data.body).map(function foundBody(body, idx) {
    const bk = Object.keys(body).sort().join(' ');
    if (bk === 'purpose') {
      if (versId === 'auycPggXTAiTI7EtCUus4w~2') { return; }
    }
    const bt = mustBe.tProp('body#' + idx, body, [['oneOf', [
      undefined,
      'TextualBody',
    ]]], 'type');
    const p = mustBe.tProp('body#' + idx, body, [['oneOf', [
      undefined,
      'classifying',
      'linking',
    ]]], 'purpose');
    if (!bt) {
      // job.assume('validBodyType:' + versId, { k: bk, purpose: p });
      job.counters.add('invalidBodyTypeForPurpose:' + p + ' keys: ' + bk);
      job.counters.add('invalidBodyType');
    }
    return body;
  });
  data.body = arrayOfTruths(data.body);
  if (!data.body.length) {
    // job.assume('hasActualBody:' + versId);
    job.counters.add('noActualBody');
  }

  objMapValues(data, function checkTopLevelKey(v, k) {
    if (EX.standardTopLevelKeys.includes(k)) { return; }
    delete data[k];

    if ((k === 'via') || (k === 'versionOf')) {
      const caid = reviAnno.divePath.expectedContainerAnnoId;
      namedEqual('attribute ' + k, v, (ubFacts.annoBaseUrl + 'anno/' + caid));
      return;
    }

    console.warn('nonStandardTopLevelKey:', k, v);
    job.counters.add('nonStandardTopLevelKey:' + k + '=' + v);
  });

  rewriteAnnoBaseUrls.inplace(data);
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
