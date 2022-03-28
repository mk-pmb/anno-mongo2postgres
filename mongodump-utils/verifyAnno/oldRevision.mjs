// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import vTry from 'vtry';

import expectHasAllTheContentsFrom from './expectHasAllTheContentsFrom.mjs';
import verifyOldReviDoi from './oldReviDoi.mjs';
import verifyReviUrl from './reviUrl.mjs';


const EX = function verifyOldRevision(how, origRevi, reviIdx) {
  const {
    expectedData,
    containerAnnoId,
    job,
  } = how;
  mustBe('obj', 'how.job')(job);
  vTry(function fallibleVerifyRevision() {
    const revi = { ...origRevi };
    const popRevi = objPop.d(revi, { mustBe });
    const reviNum = reviIdx + 1;

    verifyReviUrl(popRevi, 'id', { containerAnnoId, reviNum });
    verifyReviUrl(popRevi, 'versionOf', { containerAnnoId });
    verifyOldReviDoi(expectedData.doi, popRevi('doi'), reviNum, how);

    const allSubRevis = popRevi.mustBe('undef | ary', '_revisions');
    (allSubRevis || []).forEach(EX.bind(null, how));

    expectHasAllTheContentsFrom(expectedData, revi, job);
  }, containerAnnoId + ' > revi[' + reviIdx + ']')();
};





export default EX;
