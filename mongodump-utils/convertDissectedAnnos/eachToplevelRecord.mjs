// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';


import guessSubjectTarget from '../guessSubjectTarget.mjs';
import pgUtil from '../pgUtil.mjs';


const doNothing = Boolean;


const eachTLR = async function eachToplevelRecord(origAnno, recId, job) {
  const [topMongoId, divePath] = (recId + '>').split(/>/);
  if (job.skipMongoIds.has(topMongoId)) { return job.skipRec(); }

  const anno = { recId, data: { ...origAnno } };
  anno.pop = objPop.d(anno.data, { mustBe });
  anno.pop('_id');
  equal(anno.pop('_revisions'), undefined);
  equal(anno.pop('_replies'), undefined);
  equal(anno.pop('type'), ['Annotation']);
  anno.disMeta = anno.pop('@dissect.meta');

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

  await (job.hotfixes[topMongoId + '>*'] || doNothing)(anno, job);
  await (job.hotfixes[recId] || doNothing)(anno, job);

  anno.subjTgt = guessSubjectTarget(anno.data).url;
  anno.meta = {
    mongo_doc_id: annoCache.topMongoId,
    time_created: pgUtil.timestampFromIsoFmt(anno.pop('created')),
    author_local_userid: '',
  };
  equal(anno.meta.subject_target, annoCache.topAnno.meta.subject_target);

  const dpParsed = job.parseDivePath(divePath);
  if (!dpParsed) { throw new Error('Unsupported divePath: ' + divePath); }
  anno.divePath = dpParsed;
  if (dpParsed.versionDepth) { return job.annoRevision(job, anno); }
  return job.annoContainer(job, anno);
};


export default eachTLR;
