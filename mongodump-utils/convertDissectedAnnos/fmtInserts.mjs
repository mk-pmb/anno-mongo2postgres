// -*- coding: utf-8, tab-width: 2 -*-

import nodeFs from 'fs';

import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import objPop from 'objpop';

import pgUtil from '../pgUtil.mjs';
import verify from '../verifyAnno/index.mjs';


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
  verify.reviUrl(anno, 'id', { reviNum });
  const writeRec = sqlFiles.write.bind(null, {
    anno_id: anno.divePath.expectedContainerAnnoId,
    revision_id: reviNum,
  });

  // anno data record
  const adRec = {
    TABLE: 'anno_data',
    ...anno.meta,
    details: anno.data,
  };
  writeRec(adRec);

  objMapValues(anno.relations, function declareLink(url, rel) {
    const linkRec = { TABLE: 'anno_links', rel, url };
    writeRec(linkRec);
  });
}


export default fmtInserts;
