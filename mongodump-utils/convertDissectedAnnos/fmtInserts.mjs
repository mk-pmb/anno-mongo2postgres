// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';


import pgUtil from '../pgUtil.mjs';
import verify from './libVerify.mjs';


function sslifyUrl(url) { return url.replace(/^(http):/, '$1s'); }


function fmtInserts(anno, auxMeta) {
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
    details: anno.data,
  };
  writeRec(adRec);

  // subject target record
  const stRec = {
    TABLE: 'anno_links',
    rel: 'subject',
    url: sslifyUrl(anno.subjTgt),
  };
  writeRec(stRec);
}


export default fmtInserts;
