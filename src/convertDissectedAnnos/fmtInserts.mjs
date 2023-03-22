// -*- coding: utf-8, tab-width: 2 -*-

import nodeFs from 'fs';

import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import objPop from 'objpop';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';

import verify from '../verifyAnno/index.mjs';


const sqlFiles = new Map(/* table name -> file stream */);
sqlFiles.writeRec = function writeSql(common, rec) {
  const tbl = rec.TABLE;
  let pgStream = sqlFiles.get(tbl);
  if (!pgStream) {
    const destFilePath = 'tmp.pg.' + tbl + '.sql';
    const fileStream = nodeFs.createWriteStream(destFilePath);
    pgStream = pgDumpWriter.stmtStream.fromNativeWriteStream(fileStream);
    sqlFiles.set(tbl, pgStream);
  }
  pgDumpWriter.fmtInsert(common, rec, { STREAM: pgStream });
};


const EX = function fmtInserts(anno, auxMeta) {
  const auxPop = objPop(auxMeta, { mustBe }).mustBe;
  const reviNum = auxPop('pos int', 'reviNum').toFixed(0);
  verify.reviUrl(anno, 'id', { reviNum });
  const writeRec = sqlFiles.writeRec.bind(null, {
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

  objMapValues(anno.relations, function declare(url, rel) {
    const linkRec = { TABLE: 'anno_links', rel, url };
    writeRec(linkRec);
  });
};


Object.assign(EX, {

  getFilesMap() { return sqlFiles; },

  endAll() {
    sqlFiles.forEach(pgStream => pgStream.end());
    sqlFiles.clear();
  },

});


export default EX;
