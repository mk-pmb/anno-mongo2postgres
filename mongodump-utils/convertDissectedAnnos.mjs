// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

// import getOwn from 'getown';
import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';
import pgUtil from './pgUtil.mjs';
import verify from './libVerify.mjs';


const doNothing = Boolean;

let annoCache = {};

function sslifyUrl(url) { return url.replace(/^(http):/, '$1s'); }


const conv = {

  hotfixes: {},
  creatorAliases: {},

  async eachToplevelRecord(origAnno, recId, job) {
    const [topMongoId, divePath] = (recId + '>').split(/>/);
    if (job.skipMongoIds.has(topMongoId)) { return job.skipRec(); }

    const anno = { recId, data: { ...origAnno } };
    anno.pop = objPop.d(anno.data, { mustBe });
    anno.pop('_id');
    equal(anno.pop('_revisions'), undefined);
    equal(anno.pop('_replies'), undefined);
    equal(anno.pop('type'), ['Annotation']);
    anno.disMeta = anno.pop('@dissect.meta');

    if (topMongoId === annoCache.topMongoId) {
      if (annoCache[divePath]) { throw new Error('Duplicate divepath'); }
      annoCache[divePath] = anno;
    } else {
      mustBe('eeq:""', 'New top-level anno divePath')(divePath);
      annoCache = { topMongoId, topAnno: anno };
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

    const dpParsed = conv.parseDivePath(divePath);
    if (!dpParsed) { throw new Error('Unsupported divePath: ' + divePath); }
    anno.divePath = dpParsed;
    if (dpParsed.versionDepth) { return conv.annoRevision(job, anno); }
    return conv.annoContainer(job, anno);
  },


  parseDivePath(dpStr) {
    if (!dpStr) {
      return {
        str: '',
        commentDepth: 0,
        commentIndices: [],
        container: '',
        versionDepth: 0,
        versionIndices: [],
      };
    }

    const [prefix, letters, ...args] = dpStr.split(/\-/);
    equal(prefix, 'dp');
    const m = /^(c*)(v*)$/.exec(letters);
    if (!m) { return; }
    equal(letters.length, args.length);
    const cs = m[1];
    const vs = m[2];

    const commentDepth = cs.length;
    const commentIndices = args.slice(0, commentDepth).map(Number);
    equal(commentDepth, commentIndices.length);

    const container = (cs && ['dp', cs, ...commentIndices].join('-'));
    // console.error({ dp: dpStr, ci: commentIndices, ctr: container });

    const dp = {
      str: dpStr,
      typeLettes: { all: letters, cs, vs },
      commentDepth,
      commentIndices,
      container,
      versionIndices: args.slice(commentDepth).map(Number),
      versionDepth: vs.length,
    };
    equal(dp.versionDepth, dp.versionIndices.length);
    return dp;
  },


  fmtInsert(anno, auxMeta) {
    const auxPop = objPop(auxMeta, { mustBe }).mustBe;
    const reviNum = auxPop('pos int', 'reviNum').toFixed(0);
    const containerAnnoId = auxPop('nonEmpty str', 'containerAnnoId');
    verify.reviUrl(anno.pop, 'id', { containerAnnoId, reviNum });
    const writeRec = pgUtil.fmtInsert.bind(null, {
      anno_id: containerAnnoId,
      revision_id: reviNum,
      PRINT: console.log,
    });

    // anno data record
    const adRec = {
      TABLE: 'anno_data',
      ...anno.meta,
      details: {
        ...anno.data,
        title: String(anno.data.title || '').trim(),
      },
    };
    writeRec(adRec);

    // subject target record
    const stRec = {
      TABLE: 'anno_links',
      rel: 'subject',
      url: sslifyUrl(anno.subjTgt),
    };
    writeRec(stRec);
  },


  annoContainer(job, anno) {
    // "Container" is a node that is not stored as a revision.

    // Does it have revisions?
    const { nv } = anno.disMeta;
    if (nv) {
      // We hope that its annotation data is the same as its latest revision:
      job.assume('sameDataAsLatestRevision:' + anno.recId);
      // We'll verify that later when we encounter the actual latest revision.
      return;
    }

    equal(nv, 0);
    throw new Error(':TODO: Insert container as its latest revision.');
  },


  annoRevision(job, reviAnno) {
    const dp = reviAnno.divePath;
    const container = annoCache[dp.container || 'topAnno'];
    mustBe('obj', 'container (dp: "' + dp.container + '")')(container);
    equal(container === reviAnno, false);

    const mongoId = reviAnno.meta.mongo_doc_id;
    const commentNums = dp.commentIndices.map(i => i + 1);
    const containerAnnoId = [mongoId, ...commentNums].join('.');
    if (container.id) { equal(container.id, containerAnnoId); }

    // const reviIdx = dp.versionIndices.slice(-1)[0];
    const reviIdx = dp.versionIndices[0];
    mustBe('pos0 int', 'revision index')(reviIdx);

    if (dp.versionDepth > 1) {
      // Expectation: Deeply stored old revisions are exact copies of the
      // revisions stored in the container's direct property `_revision`.
      const shallowReviDp = [
        'dp',
        dp.typeLettes.cs + 'v',
        ...dp.commentIndices,
        reviIdx,
      ].join('-');
      const shallowRevi = annoCache[shallowReviDp];
      const shallowTrace = 'shallowRevi (dp: "' + shallowReviDp + '")';
      mustBe('obj', shallowTrace)(shallowRevi);

      // °°°° In an ideal world, …
      // °  equal.named.deepStrictEqual('Deep revision is redundant copy',
      // °    reviAnno.data, shallowRevi.data);
      // °  // The above expectation has been verified: The deep revision
      // °  // is a redundant copy, so can safely discard it.
      // °°°° … our data would be this clean.
      // Fortunately, for discarding the reviAnno, we can settle with a
      // lesser assumption:
      vTry(verify.expectHasAllTheContentsFrom,
        'Expect: ' + shallowTrace + ' has all data from deep revi',
      )(shallowRevi.data, reviAnno.data, job);

      return;
    }

    const reviNum = reviIdx + 1;
    if (reviNum === container.disMeta.nv) {
      // This revision is the latest one. All of its content should
      // be equal to the container's data.
      const assu = job.assume('sameDataAsLatestRevision:' + container.recId);
      vTry(verify.oldRevision, 'Latest revision (+) =/= container (-)')({
        expectedData: container.data,
        containerAnnoId,
        job,
        reviDivePath: dp,
      }, reviAnno.data, reviIdx);
      assu.confirmed = true;
    }

    return conv.fmtInsert(reviAnno, { containerAnnoId, reviNum });
  },


};

const trafoPr = trafoCli(conv);

export default trafoPr;
