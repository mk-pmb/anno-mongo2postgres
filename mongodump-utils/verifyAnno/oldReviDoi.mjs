// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';


const EX = function oldReviDoi(exDoi, reviDoi, reviNum, how) {
  if (!exDoi) {
    mustBe('undef', 'DOI-less annotation > revision > doi')(reviDoi);
    return;
  }

  let doiErr;
  try {
    mustBe([['oneOf', [
      undefined,
      (exDoi + '~' + reviNum),
      (exDoi + '_' + reviNum),
    ]]], 'DOI-bearing annotation > revision > doi')(reviDoi);
    return;
  } catch (caught) {
    doiErr = caught;
  }

  if (EX.reportBadDoi(how, reviDoi)) { return; }

  throw doiErr;
};


Object.assign(EX, {

  reportBadDoi(how, reviDoi) {
    const rpr = how.job.badDoiReportPrefix;
    if (!rpr) { return false; }
    if (!reviDoi.startsWith(rpr)) { return false; }
    const caid = how.containerAnnoId;
    const reviSuf = reviDoi.slice(rpr.length + caid.length);
    const reviDp = how.reviDivePath.str;
    // console.warn({ containerAnnoId, exSuf, reviSuf, reviDp });
    const badDoiLine = ('["' + caid + '", '
      + reviDp.replace(/^dp-v-/, '    ').slice(-3)
      + ', "' + reviSuf + '"]');
    how.job.hint('badDoi', undefined, []).push(badDoiLine);
    how.job.counters.add('unacknowledgedBadDoi');
    return true;
  },


});


export default EX;
