// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import objPop from 'objpop';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';

import verify from '../verifyAnno/index.mjs';


const sqlWriter = pgDumpWriter.makeFileMappedSqlWriter({
  destFilePathTemplate: ['tmp.pg.', '.sql'],
});


const EX = function fmtInserts(anno, auxMeta) {
  const auxPop = objPop(auxMeta, { mustBe }).mustBe;
  const reviNum = auxPop('pos int', 'reviNum').toFixed(0);
  verify.reviUrl(anno, 'id', { reviNum });
  const idParts = {
    anno_id: anno.divePath.expectedContainerAnnoId,
    revision_id: reviNum,
  };

  sqlWriter.writeRec({
    TABLE: 'anno_data',
    ...idParts,
    ...anno.meta,
    details: anno.data,
  });

  objMapValues(anno.relations, function declare(url, rel) {
    sqlWriter.writeRec({ TABLE: 'anno_links', ...idParts, rel, url });
  });
};


Object.assign(EX, {
  endAll: sqlWriter.endAll,
});


export default EX;
