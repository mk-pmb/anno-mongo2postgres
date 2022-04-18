// -*- coding: utf-8, tab-width: 2 -*-

import nodeFs from 'fs';

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';

import pgUtil from '../pgUtil.mjs';
import verify from '../verifyAnno/index.mjs';


function sslifyUrl(url) { return url.replace(/^(http):/, '$1s'); }


const sqlFiles = new Map();
sqlFiles.write = function writeSql(common, rec) {
  const tbl = rec.TABLE;
  let stm = sqlFiles.get(tbl);
  if (!stm) {
    stm = nodeFs.createWriteStream('tmp.pg.' + tbl + '.sql');
    sqlFiles.set(tbl, stm);
  }
  pgUtil.fmtInsert(common, rec, { STREAM: stm });
};


function fmtInserts(anno, auxMeta) {
  const auxPop = objPop(auxMeta, { mustBe }).mustBe;
  const reviNum = auxPop('pos int', 'reviNum').toFixed(0);
  const containerAnnoId = auxPop('nonEmpty str', 'containerAnnoId');
  verify.reviUrl(anno.pop, 'id', { containerAnnoId, reviNum });
  const writeRec = sqlFiles.write.bind(null, {
    anno_id: containerAnnoId,
    revision_id: reviNum,
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
