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

  async eachToplevelRecord(origAnno, recId) {
    const anno = { data: { ...origAnno } };
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

    anno.tgt = guessSubjectTarget(anno.data);
    anno.meta = {
      mongo_doc_id: annoCache.topMongoId,
      subject_target: anno.tgt.url,
      time_created: pgUtil.timestampFromIsoFmt(anno.pop('created')),
      author_local_userid: '',
    };

    const dpNums = [];
    const dpLetters = divePath.replace(/\d+/g, function store(m) {
      dpNums.push(+m);
      return '';
    });
    equal(dpNums.length, dpLetters.length);
    if (!dpLetters) { return conv.topLevelAnno(anno); }
    if (dpLetters === 'v') { return conv.topLevelRevi(anno, dpNums[0]); }
    throw new Error('Unsupported divePath: ' + divePath);
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


  topLevelAnno(anno) {
    return conv.fmtInsert({ ...anno, reviNum: annoCache.topAnno.disMeta.nv });
  },


  topLevelRevi(anno, reviIdx) {
    const mongoId = annoCache.topMongoId;
    const { topAnno } = annoCache;

    // Expectation: Deeply stored old revisions are exact copies of
    // the top level revisions
    verify.oldRevision({
      topAnno: topAnno.data,
      mongoId,
    }, anno.data, reviIdx);

    const reviNum = reviIdx + 1;
    if (reviNum === topAnno.disMeta.nv) {
      // This is the revision is the latest one. All of its content should
      // be equal to the top level anno, so we don't need to store it.
      verify.expectHasAllTheContentsFrom(topAnno.data, anno.data);
      console.warn('Verified: Top anno has all data from', { mongoId, reviNum });
      return;
    }

    return conv.fmtInsert({ ...anno, reviNum });
  },


};

trafoCli(conv);
