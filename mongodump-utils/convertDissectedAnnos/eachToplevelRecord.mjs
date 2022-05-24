// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';

import guessSubjectTarget from '../guessSubjectTarget.mjs';
import jsonDeepCopy from '../util/jsonDeepCopy.mjs';
import pgUtil from '../pgUtil.mjs';


const doNothing = Boolean;


function cloneAnno(orig) {
  const c = jsonDeepCopy({ ...orig, api: null });
  c.api = {
    clone() { return cloneAnno(c); },
    popData: objPop.d(c.data, { mustBe }),
  };
  return c;
}


function reorganizeCommonNonStandardTopLevelProps(recId, origData) {
  const anno = cloneAnno({ recId, data: origData });
  const { popData } = anno.api;

  popData('_id');
  equal(popData('_revisions'), undefined);
  equal(popData('_replies'), undefined);
  equal(popData('type'), ['Annotation']);
  anno.disMeta = popData('@dissect.meta');
  anno.relations = {};
  anno.meta = {
    time_created: pgUtil.timestampFromIsoFmt(popData('created')),
    author_local_userid: '',
  };

  return anno;
}


const eachTLR = async function eachToplevelRecord(dissected, recId, job) {
  const [topMongoId, divePath] = (recId + '>').split(/>/);
  if (job.skipMongoIds.has(topMongoId)) { return job.skipRec(); }

  const anno = reorganizeCommonNonStandardTopLevelProps(recId, dissected);

  let { annoCache } = job;
  if (topMongoId === annoCache.topMongoId) {
    if (annoCache[divePath]) { throw new Error('Duplicate divepath'); }
    annoCache[divePath] = anno;
  } else {
    mustBe('eeq:""', 'New top-level anno divePath')(divePath);
    annoCache = { topMongoId, topAnno: anno };
    job.annoCache = annoCache; // eslint-disable-line no-param-reassign
    job.hint('latestTopAnnoRecIdx', job.topRecIdx);
  }
  anno.meta.mongo_doc_id = annoCache.topMongoId;

  await (job.hotfixes[topMongoId + '>*'] || doNothing)(anno, job);
  await (job.hotfixes[recId] || doNothing)(anno, job);

  (function determineSubjectTarget() {
    // Determine only after hotfixes have been applied.
    const subjTgt = job.modernizeUrl(guessSubjectTarget(anno.data).url);
    anno.relations.subject = subjTgt;
    equal(subjTgt, annoCache.topAnno.relations.subject);
  }());

  const dpParsed = job.parseDivePath(divePath, topMongoId);
  if (!dpParsed) { throw new Error('Unsupported divePath: ' + divePath); }
  anno.divePath = dpParsed;

  await ((dpParsed.versionDepth
    ? job.annoRevision
    : job.annoContainer
  )(job, anno));

  delete anno.api;
  Object.freeze(anno);
};


export default eachTLR;
