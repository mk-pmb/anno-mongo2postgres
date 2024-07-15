// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';

import countIdFormats from './countIdFormats.mjs';
import deepVersionRevi from './deepVersionRevi.mjs';


const keysInheritableFromInitialVersion = [
  'body',
  'creator',
  'motivation',
  'title',
];


async function annoRevision(job, origReviAnno) {
  let reviAnno = origReviAnno;
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
  reviAnno = Object.assign(reviAnno.api.clone(), { reviNum });

  if (reviNum >= 2) {
    const dpStr = reviAnno.divePath.str;
    const m = /^(dp\-c*v\-(?:\d+\-)*)(\d+)$/.exec(dpStr);
    if (!m) { throw new Error('Cannot guess initVer for ' + dpStr); }
    mustBe.eeq(reviIdx, 'reviIdx in dpStr ' + dpStr)(+m[2]);
    const initVerData = (job.annoCache[m[1] + '0'] || false).data;
    mustBe('obj', 'initVerData')(initVerData);
    keysInheritableFromInitialVersion.forEach(function maybeInherit(k) {
      if (reviAnno.data[k] !== undefined) { return; }
      if (initVerData[k] === undefined) { return; }
      reviAnno.data[k] = initVerData[k];
      const c = 'revisionInheritedField:' + k;
      job.counters.add(c);
      // if (k === 'creator') { return; }
      // job.hint(c, undefined, []).push(reviAnno.recId);
    });
  }

  if (reviNum === container.disMeta.nv) {
    deepVersionRevi.confirm(job, reviAnno, reviIdx);
  }

  await job.optimizeReviDetails(reviAnno, job);
  mustBe('obj', 'reviAnno.data.creator')(reviAnno.data.creator);
  return job.fmtInserts(reviAnno);
}


export default annoRevision;
