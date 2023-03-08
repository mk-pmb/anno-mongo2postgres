// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';

import guessSubjectTarget from '../guessSubjectTarget.mjs';
import jsonDeepCopy from '../util/jsonDeepCopy.mjs';


const namedEqual = equal.named.deepStrictEqual;
const doNothing = Boolean;


function cloneAnno(orig) {
  const c = jsonDeepCopy({ ...orig, api: null });
  c.api = {
    clone() { return cloneAnno(c); },
    popData: objPop.d(c.data, { mustBe }).mustBe,
  };
  return c;
}


function reorganizeCommonNonStandardTopLevelProps(recId, origData) {
  const anno = cloneAnno({ recId, data: origData });
  const { popData } = anno.api;

  const doi = (popData('nonEmpty str | undef', 'doi') || null);
  namedEqual('Expected no previous dc:*',
    origData['dc:identifier'], undefined);

  popData('nonEmpty str', '_id');
  popData('undef', '_revisions');
  popData('undef', '_replies');
  equal(popData('ary', 'type'), ['Annotation']);
  anno.disMeta = popData('obj', '@dissect.meta');
  anno.relations = {};
  const origCreatedStr = popData('nonEmpty str', 'created');
  anno.meta = {
    time_created: pgDumpWriter.timestampFromIsoFmt(origCreatedStr),
    author_local_userid: '',
    doi,
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

  (function modernizeTargetUrls() {
    // We have to update the targets in the actual anno, rather than just
    // in anno_links, because otherwise revisions (and potentially replies)
    // will be submitted with the original target URL and thus won't be
    // found by search.
    const origTgtJson = JSON.stringify(anno.data.target);
    function foundUrl(m, pre) {
      if (m.endsWith('\\"')) {
        throw new Error('Backslashed quotes in URL not supported: ' + m);
      }
      const orig = JSON.parse(m.slice(pre.length));
      return pre + JSON.stringify(job.modernizeUrl(orig));
    }
    const upd = origTgtJson.replace(/(:)"\w+:\/{2,}[!#-~]+"/, foundUrl);
    anno.data.target = JSON.parse(upd);
  }());

  (function determineSubjectTarget() {
    // Determine only after hotfixes have been applied.
    const subjTgt = guessSubjectTarget(anno.data).url;
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
