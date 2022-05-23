// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';


import verify from '../verifyAnno/index.mjs';


const EX = {

  assume(job, reviAnno) {
    const dp = reviAnno.divePath;
    const isDeepVersion = (dp.versionDepth > 1);
    if (!isDeepVersion) { return false; }

    // const reviIdx = dp.versionIndices.slice(-1)[0];
    const reviIdx = mustBe('pos0 int', 'revision index')(dp.versionIndices[0]);

    // Expectation: Deeply stored old revisions are exact copies of the
    // revisions stored in the container's direct property `_revision`.
    const shallowReviDp = [
      'dp',
      dp.typeLettes.cs + 'v',
      ...dp.commentIndices,
      reviIdx,
    ].join('-');
    const shallowRevi = job.annoCache[shallowReviDp];
    const shallowTrace = 'shallowRevi (dp: "' + shallowReviDp + '")';
    mustBe('obj', shallowTrace)(shallowRevi);

    // °°°° In an ideal world, …
    // °  equal.named.deepStrictEqual('Deep revision is redundant copy',
    // °    reviAnno.data, shallowRevi.data);
    // °  // The above expectation has been verified: The deep revision
    // °  // is a redundant copy, so can safely discard it.
    // °°°° … our data would be this clean.
    // Fortunately, for discarding the reviAnno, we can settle with a
    // lesser assumption:
    vTry(verify.expectHasAllTheContentsFrom,
      'Expect: ' + shallowTrace + ' has all data from deep revi',
    )(shallowRevi.data, reviAnno.data, job);
    return true;
  },


  confirm(job, reviAnno, reviIdx) {
    // This revision is the latest one. All of its content should
    // be equal to the container's data.
    const dp = reviAnno.divePath;
    const container = job.annoCache[dp.container || 'topAnno'];
    const assu = job.assume('sameDataAsLatestRevision:' + container.recId);
    vTry(verify.oldRevision, 'Latest revision (+) =/= container (-)')({
      expectedData: container.data,
      job,
      reviRecId: reviAnno.recId,
      reviDivePath: dp,
    }, reviAnno, reviIdx);
    assu.confirmed = true;
  },

};


export default EX;
