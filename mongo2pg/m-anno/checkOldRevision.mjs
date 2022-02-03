// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';
import equal from 'equal-pmb';

import unclutter from './unclutter.mjs';
import storeErrorReport from './storeErrorReport.mjs';


const ignoreRevisionKeysEqualToAnno = [
  'canonical',
  'collection',
  'creator',
  'rights',
  'via',
];


const chkOld = function checkOldRevision(params) {
  const {
    cliState,
    currentAnno,
    topAnnoMeta,
    topReviData,
  } = params;
  const origOldRevi = params.oldRevi;

  const popOrigRevi = objPop(origOldRevi, { mustBe });
  unclutter.popUselessRevisionProps(popOrigRevi);
  const revi = {
    ...unclutter.popRevisionKeys(popOrigRevi),
  };
  ignoreRevisionKeysEqualToAnno.forEach(function ign(key) {
    const val = origOldRevi[key];
    if (val === undefined) { return; }
    try {
      equal(val, currentAnno[key]);
      popOrigRevi(key);
    } finally {
      Boolean('no-op');
    }
  });
  try {
    popOrigRevi.expectEmpty();
  } catch (err) {
    storeErrorReport({
      report: revi,
      err,
      func: 'checkOldRevision',
      hint: 'parent meta',
      detail: topAnnoMeta,
      cliState,
    });
  }
  return revi;
};


export default chkOld;
