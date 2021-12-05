// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';
import equal from 'equal-pmb';

import unclutter from './unclutter.mjs';
import previewOrDeleteErrorProp from './previewOrDeleteErrorProp.mjs';


const ignoreRevisionKeysEqualToAnno = [
  'canonical',
  'collection',
  'creator',
  'rights',
  'via',
];


const chkOld = function checkOldRevision(origRevi, meta, parentOrigAnno) {
  const popOrigRevi = objPop(origRevi, { mustBe });
  unclutter.popUselessRevisionProps(popOrigRevi);
  const revi = { ERROR: null, ...unclutter.popRevisionKeys(popOrigRevi) };
  ignoreRevisionKeysEqualToAnno.forEach(function ign(key) {
    const val = origRevi[key];
    if (val === undefined) { return; }
    try {
      equal(val, parentOrigAnno[key]);
      popOrigRevi(key);
    } finally {
      Boolean('no-op');
    }
  });
  try {
    popOrigRevi.expectEmpty();
  } catch (err) {
    revi.ERROR = String(err);
  }
  previewOrDeleteErrorProp({
    func: 'checkOldRevision:',
    hint: 'parent meta',
    detail: meta,
  }, revi);
  return revi;
};


export default chkOld;
