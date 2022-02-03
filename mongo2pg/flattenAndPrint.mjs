// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';

import mongoAnnoUnclutter from './m-anno/unclutter.mjs';
import verifyLatestOldRevi from './m-anno/verifyLatestOldRevi.mjs';
import checkOldRevision from './m-anno/checkOldRevision.mjs';
import storeErrorReport from './m-anno/storeErrorReport.mjs';


const flap = {

  oneTopAnno(cliState, origTopAnno) {
    flap.oneAnno(cliState, origTopAnno, []);
  },

  oneAnno(cliState, origAnno, parents) {
    const popOrigAnno = objPop(origAnno, { mustBe });
    const replies = popOrigAnno('_replies');
    mongoAnnoUnclutter.popUselessAnnoProps(popOrigAnno);
    const topAnnoMeta = mongoAnnoUnclutter.popMeta(popOrigAnno);
    const topReviData = mongoAnnoUnclutter.popRevisionKeys(popOrigAnno);
    const origOldRevis = [].concat(popOrigAnno('_revisions')).filter(Boolean);
    const oldRevis = origOldRevis.map(function chkOld(r) {
      return checkOldRevision({
        cliState,
        currentAnno: origAnno,
        topAnnoMeta,
        topReviData,
        oldRevi: r,
      });
    });

    let flat = {
      origAnnoMeta: topAnnoMeta,
      topReviData,
    };
    const latestOldRevi = oldRevis.pop();
    const nRevis = oldRevis.length;
    if (nRevis) { Object.assign(flat, { nRevis, oldRevis }); }

    try {
      popOrigAnno.expectEmpty();
      verifyLatestOldRevi({
        cliState,
        topAnnoMeta,
        topReviData,
        latestOldRevi,
      });
    } catch (err) {
      storeErrorReport({
        report: flat,
        err,
        func: 'oneAnno',
        hint: 'meta',
        cliState,
      });
    }

    flat = JSON.stringify(flat, null, 2);
    flat = flat.replace(/^\{\s+/, '{ ');
    flat += ',';
    console.log(flat);

    if ((replies || false).length) {
      if (parents.length > 4) {
        console.error('Parents:', parents);
        throw new RangeError('Annotation nested too deeply!');
      }
      const subParents = [...parents, topAnnoMeta];
      replies.forEach(sub => flap.oneAnno(cliState, sub, subParents));
    }
  },

};



export default flap;
