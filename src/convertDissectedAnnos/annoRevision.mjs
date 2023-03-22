// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';

import countIdFormats from './countIdFormats.mjs';
import deepVersionRevi from './deepVersionRevi.mjs';


async function annoRevision(job, reviAnno) {
  const dp = reviAnno.divePath;
  const container = job.annoCache[dp.container || 'topAnno'];
  mustBe('obj', 'container (dp: "' + dp.container + '")')(container);
  equal(container === reviAnno, false);

  const mongoId = mustBe.nest('mongoId', reviAnno.mongoDocId);
  countIdFormats(job, mongoId);
  if (container.id) { equal(container.id, dp.expectedContainerAnnoId); }

  if (deepVersionRevi.assume(job, reviAnno)) { return; }

  const reviIdx = mustBe('pos0 int', 'revision index')(dp.versionIndices[0]);
  const reviNum = reviIdx + 1;
  if (reviNum === container.disMeta.nv) {
    deepVersionRevi.confirm(job, reviAnno, reviIdx);
  }

  const optimizedReviAnno = reviAnno.api.clone();
  await job.optimizeReviDetails(optimizedReviAnno, job);
  return job.fmtInserts(optimizedReviAnno, { reviNum });
}


export default annoRevision;
