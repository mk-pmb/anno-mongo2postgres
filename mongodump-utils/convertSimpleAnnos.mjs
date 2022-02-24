// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import objPop from 'objpop';
import equal from 'equal-pmb';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';
import pgUtil from './pgUtil.mjs';
import verify from './libVerify.mjs';



const jobSpec = {

  async eachToplevelAnno(origTopAnno, mongoId) {
    const topAnno = { ...origTopAnno };
    const popProp = objPop.d(topAnno);
    popProp('_id');

    const allTopRevis = popProp('_revisions');
    allTopRevis.forEach(verify.oldRevision.bind(null, {
      topAnno,
      mongoId,
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
