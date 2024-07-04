// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objMapValues from 'lodash.mapvalues';
import pgDumpWriter from 'postgres-dump-writer-helpers-220524-pmb';

import verify from '../verifyAnno/index.mjs';


const sqlWriter = pgDumpWriter.makeFileMappedSqlWriter({
  destFilePathTemplate: ['tmp.pg.', '.sql'],
});


const EX = function fmtInserts(anno) {
  const { reviNum } = anno;
  mustBe('pos int', 'reviNum')(reviNum);
  verify.reviUrl(anno, 'id', { reviNum });
  const idParts = {
    base_id: anno.divePath.expectedContainerAnnoId,
    version_num: reviNum,
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
