// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

// import promiseFs from 'nofs';
// import getOwn from 'getown';
import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
// import vTry from 'vtry';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';
import pgUtil from './pgUtil.mjs';
import verify from './libVerify.mjs';


let annoCache = {};

const conv = {

  async eachToplevelRecord(origAnno, recId, job) {
    const anno = { recId, data: { ...origAnno } };
    anno.pop = objPop.d(anno.data, { mustBe });
    anno.pop('_id');
    equal(anno.pop('_revisions'), undefined);
    equal(anno.pop('_replies'), undefined);
    equal(anno.pop('type'), ['Annotation']);
    anno.disMeta = anno.pop('@dissect.meta');

    const [topMongoId, divePath] = (recId + '>').split(/>/);
    if (topMongoId === annoCache.topMongoId) {
      if (annoCache[divePath]) { throw new Error('Duplicate divepath'); }
      annoCache[divePath] = anno;
    } else {
      mustBe('eeq:""', 'New top-level anno divePath')(divePath);
      annoCache = { topMongoId, topAnno: anno };
    }

    anno.meta = {
      mongo_doc_id: annoCache.topMongoId,
      subject_target: guessSubjectTarget(anno.data).url,
      time_created: pgUtil.timestampFromIsoFmt(anno.pop('created')),
      author_local_userid: '',
    };
    equal(anno.meta.subject_target, annoCache.topAnno.meta.subject_target);
    if (anno.doi) {
      throw new Error(anno.doi);
    }

    const dpParsed = conv.parseDivePath(divePath);
    if (!dpParsed) { throw new Error('Unsupported divePath: ' + divePath); }
    anno.divePath = dpParsed;
    if (dpParsed.versionDepth) { return conv.annoRevision(job, anno); }
    return conv.annoContainer(job, anno);
  },


  parseDivePath(dpStr) {
    const dp = { str: dpStr };
    if (!dpStr) {
      return {
        ...dp,
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
    dp.commentDepth = cs.length;
    dp.commentIndices = args.slice(0, dp.commentDepth).map(Number);
    dp.container = cs && ['dp', cs, ...dp.commentIndices].join('-');
    dp.versionIndices = args.slice(dp.commentDepth).map(Number);
    dp.versionDepth = vs.length;
    equal(dp.versionDepth, dp.versionIndices.length);
    return dp;
  },


  fmtInsert(anno) {
    const reviId = mustBe('pos int', 'reviNum')(anno.reviNum).toFixed(0);
    const { topMongoId } = annoCache;
    const title = String(anno.data.title || '').trim();
    verify.reviUrl(anno.pop, 'id', topMongoId);
    const rec = {
      ...anno.meta,
      anno_id: topMongoId + '~' + reviId,
      revision_id: reviId,
      details: {
        ...anno.data,
        title,
      },
    };
    const ins = pgUtil.fmtInsert('anno', rec);
    console.log(ins);
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
    mustBe('obj', 'container (divePath: "' + dp.container + '")')(container);
    equal(container === reviAnno, false);

    const reviIdx = dp.versionIndices.slice(-1)[0];
    mustBe('pos0 int', 'revision index')(reviIdx);

    // Expectation: Deeply stored old revisions are exact copies of the
    // revisions stored in the container's direct property `_revision`.
    verify.oldRevision({
      expectedData: container.data,
      mongoId: reviAnno.meta.mongo_doc_id,
    }, reviAnno.data, reviIdx);

    const reviNum = reviIdx + 1;
    if (reviNum === container.disMeta.nv) {
      // This is the revision is the latest one. All of its content should
      // be equal to the container's data.
      const assu = job.assume('sameDataAsLatestRevision:' + container.recId);
      verify.expectHasAllTheContentsFrom(container.data, reviAnno.data);
      assu.confirmed = true;
    }

    return conv.fmtInsert({ ...reviAnno, reviNum });
  },


};

trafoCli(conv);
