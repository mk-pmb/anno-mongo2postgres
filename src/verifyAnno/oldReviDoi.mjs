// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';


const EX = function oldReviDoi(containerDoi, reviDoi, reviNum, how) {
  if (!containerDoi) {
    mustBe('nul | undef', 'DOI-less annotation > revision > doi')(reviDoi);
    return;
  }

  let doiErr;
  try {
    mustBe([['oneOf', [
      undefined,
      (containerDoi + '~' + reviNum),
      (containerDoi + '_' + reviNum),
    ]]], 'DOI-bearing annotation > revision > doi')(reviDoi);
    if (reviDoi === undefined) { return; }

    const reviRecId = mustBe.nest('reviRecId', how.reviRecId);
    const assuKey = 'legacyDoi:verified:' + reviRecId;
    const assuUpd = { confirmed: true, reviDoi, containerDoi };
    // console.debug('legacyDoi:verified!', reviRecId, assuUpd);
    how.job.assume(assuKey, assuUpd);
    return;
  } catch (caught) {
    doiErr = caught;
  }

  if (EX.reportBadDoi(how, reviDoi)) { return; }

  throw doiErr;
};


Object.assign(EX, {

  reportBadDoi(how, reviDoi) {
    mustBe.nest('reviDoi', reviDoi);
    const rpr = how.job.badDoiReportPrefix;
    if (!rpr) { return false; }
    if (!reviDoi.startsWith(rpr)) { return false; }
    const caid = how.reviDivePath.expectedContainerAnnoId;
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
