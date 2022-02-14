// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

// import promiseFs from 'nofs';
// import getOwn from 'getown';
import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';


import trafoCli from './trafoCli.mjs';
import guessPrimaryTarget from './guessPrimaryTarget.mjs';
import pgUtil from './pgUtil.mjs';

const annoBaseUrl = 'https://anno.ub.uni-heidelberg.de/anno/';


function verifyReviUrl(pop, key, slug) {
  pop.mustBe([['oneOf', [
    undefined,
    annoBaseUrl + slug,
    annoBaseUrl + 'anno/' + slug,
  ]]], key);
}


function verifyRevision(how, origRevi, reviIdx) {
  const {
    topAnno,
    mongoId,
  } = how;
  const revi = { ...origRevi };
  const popRevi = objPop.d(revi, { mustBe });
  const reviNum = reviIdx + 1;

  verifyReviUrl(popRevi, 'id', mongoId + '~' + reviNum);
  verifyReviUrl(popRevi, 'versionOf', mongoId);
  popRevi.mustBe([['oneOf', [
    undefined,
    (topAnno.doi && (topAnno.doi + '_' + reviNum)),
  ]]], 'doi');

  Object.entries(revi).forEach(function verify([key, val]) {
    if (val === undefined) { return; }
    equal({ [key]: val }, { [key]: topAnno[key] });
  });
}


const jobSpec = {

  async eachToplevelAnno(origTopAnno, mongoId) {
    const topAnno = { ...origTopAnno };
    const popProp = objPop.d(topAnno);
    popProp('_id');

    const allRevis = popProp('_revisions');
    allRevis.forEach(verifyRevision.bind(null, { topAnno, mongoId }));

    const tgt = guessPrimaryTarget(topAnno);
    const meta = {
      mongo_doc_id: mongoId,
      anno_id: mongoId,
      primary_target: tgt.url,
      time_created: pgUtil.timestampFromIsoFmt(popProp('created')),
      author_local_userid: '',
    };

    equal(popProp('_replies'), []);
    equal(popProp('type'), ['Annotation']);

    const title = String(topAnno.title || '').trim();
    const details = {
      ...topAnno,
      title,
    };

    // console.log(meta, JSON.stringify(topAnno, null, 2));
    const rec = { ...meta, details };
    const ins = pgUtil.fmtInsert('anno', rec);
    console.log(ins);
  },

};

trafoCli(jobSpec);
