// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

// import promiseFs from 'nofs';
// import getOwn from 'getown';
import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';
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
  vTry(function fallibleVerifyRevision() {
    const {
      topAnno,
      mongoId,
      // allTopRevis,
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
      if (key === '_revisions') {
        return val.forEach(verifyRevision.bind(null, how));
      }
      return equal({ [key]: val }, { [key]: topAnno[key] });
    });
  }, 'revi[' + reviIdx + ']')();
}


const jobSpec = {

  async eachToplevelAnno(origTopAnno, mongoId) {
    const topAnno = { ...origTopAnno };
    const popProp = objPop.d(topAnno);
    popProp('_id');

    const allTopRevis = popProp('_revisions');
    allTopRevis.forEach(verifyRevision.bind(null, {
      topAnno,
      mongoId,
      allTopRevis,
    }));

    const tgt = guessSubjectTarget(topAnno);
    const meta = {
      mongo_doc_id: mongoId,
      anno_id: mongoId,
      subject_target: tgt.url,
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
