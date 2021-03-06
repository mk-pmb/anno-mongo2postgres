// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';

import expectHasAllTheContentsFrom from './expectHasAllTheContentsFrom.mjs';
import verifyOldReviDoi from './oldReviDoi.mjs';
import verifyReviUrl from './reviUrl.mjs';


const EX = function verifyOldRevision(how, origRevi, reviIdx) {
  const {
    expectedData,
    expectedMeta,
    job,
  } = how;
  mustBe('obj', 'how.job')(job);
  const caid = origRevi.divePath.expectedContainerAnnoId;
  vTry(function fallibleVerifyRevision() {
    const revi = origRevi.api.clone();
    const popRevi = revi.api.popData;
    const reviNum = reviIdx + 1;

    verifyReviUrl(revi, 'id', { reviNum });
    verifyReviUrl(revi, 'versionOf');
    verifyReviUrl(revi, 'via');
    verifyOldReviDoi(expectedMeta.doi, revi.meta.doi, reviNum, how);

    const allSubRevis = popRevi('undef | ary', '_revisions');
    (allSubRevis || []).forEach(EX.bind(null, how));

    expectHasAllTheContentsFrom(expectedData, revi.data, job);
  }, caid + ' > revi[' + reviIdx + ']')();
};





export default EX;
