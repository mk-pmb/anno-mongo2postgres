// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import mustBe from 'typechecks-pmb/must-be.js';

import mongoAnnoUnclutter from './m-anno/unclutter.mjs';
import verifyLatestOldRevi from './m-anno/verifyLatestOldRevi.mjs';
import checkOldRevision from './m-anno/checkOldRevision.mjs';
import previewOrDeleteErrorProp from './m-anno/previewOrDeleteErrorProp.mjs';


const flap = {

  oneTopAnno(origTopAnno) {
    flap.oneAnno(origTopAnno, []);
  },

  oneAnno(origAnno, parents) {
    const popOrigAnno = objPop(origAnno, { mustBe });
    const replies = popOrigAnno('_replies');
    mongoAnnoUnclutter.popUselessAnnoProps(popOrigAnno);
    const meta = mongoAnnoUnclutter.popMeta(popOrigAnno);
    const topDataRevi = mongoAnnoUnclutter.popRevisionKeys(popOrigAnno);
    const origOldRevis = [].concat(popOrigAnno('_revisions')).filter(Boolean);
    const oldRevis = origOldRevis.map(function chkOld(r) {
      return checkOldRevision(r, meta, origAnno);
    });

    let flat = {
      ERROR: null,
      meta,
      topDataRevi,
    };
    const latestOldRevi = oldRevis.pop();
    const nRevis = oldRevis.length;
    if (nRevis) { Object.assign(flat, { nRevis, oldRevis }); }

    try {
      popOrigAnno.expectEmpty();
      verifyLatestOldRevi(meta, topDataRevi, latestOldRevi);
    } catch (err) {
      flat.ERROR = String(err);
    }
    previewOrDeleteErrorProp({ func: 'oneAnno', hint: 'meta' }, flat);

    flat = JSON.stringify(flat, null, 2);
    flat = flat.replace(/^\{\s+/, '{ ');
    flat += ',';
    console.log(flat);

    if ((replies || false).length) {
      if (parents.length > 4) {
        console.error('Parents:', parents);
        throw new RangeError('Annotation nested too deeply!');
      }
      const subParents = [...parents, meta];
      replies.forEach(sub => flap.oneAnno(sub, subParents));
    }
  },

};



export default flap;
