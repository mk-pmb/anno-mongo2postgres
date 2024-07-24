// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';

import fixAuthor from './fixAuthor.mjs';
import fixBodies from './fixBodies.mjs';
import fixSvgPolyline from './fixSvgPolyline.mjs';
import rewriteAnnoBaseUrls from './rewriteAnnoBaseUrls.mjs';
import rewriteReplyTo from './rewriteReplyTo.mjs';
import ubFacts from './facts.mjs';

const namedEqual = equal.named.deepStrictEqual;
const digiDoiBaseUrl = 'https://doi.org/' + ubFacts.digiDoi;


const EX = async function optimizeReviDetails(reviAnno, job) {
  await optimizeReviDetails.orig(reviAnno, job);
  const { data, divePath } = reviAnno;
  delete data.doi;
  if ((data.type || false).length === 1) { data.type = String(data.type); }
  mustBe.oneOf([undefined, 'Annotation'], 'Anno type')(data.type);
  mustBe.oneOf([undefined], 'Anno @context')(data['@context']);

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
      if (!title.startsWith('Bildzyklus ')) {
        title = 'Bildzyklus zum ›Welschen Gast‹, ' + title;
      }
      data['dc:title'] = title;
    }
  }
  fixAuthor(reviAnno, job);
  rewriteReplyTo(reviAnno, job);

  fixSvgPolyline(reviAnno, job);

  // const origData = { ...data };
  function omitKey(k) { delete data[k]; }
  EX.computableTopLevelKeys.forEach(omitKey);
  mustBe('undef', 'data.id after omitKey')(data.id);

  data.body = fixBodies(versId, data, job);

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

  mustBe('undef', 'data.id before rewrite baseURL')(data.id);
  rewriteAnnoBaseUrls.inplace(data);
};


EX.computableTopLevelKeys = [
  '_lastCommented',
  'collection',
  'id',
];


EX.standardTopLevelKeys = [
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
];


export default EX;
