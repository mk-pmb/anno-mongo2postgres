// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';




const veri = {

  annoBaseUrl: 'https://anno.ub.uni-heidelberg.de/anno/',

  reviUrl(pop, key, slug) {
    pop.mustBe([['oneOf', [
      undefined,
      veri.annoBaseUrl + slug,
      veri.annoBaseUrl + 'anno/' + slug,
    ]]], key);
  },


  oldRevision(how, origRevi, reviIdx) {
    vTry(function fallibleVerifyRevision() {
      const {
        topAnno,
        mongoId,
      } = how;
      const revi = { ...origRevi };
      const popRevi = objPop.d(revi, { mustBe });
      const reviNum = reviIdx + 1;

      veri.reviUrl(popRevi, 'id', mongoId + '~' + reviNum);
      veri.reviUrl(popRevi, 'versionOf', mongoId);
      popRevi.mustBe([['oneOf', [
        undefined,
        (topAnno.doi && (topAnno.doi + '_' + reviNum)),
      ]]], 'doi');

      const allSubRevis = popRevi.mustBe('undef | ary', '_revisions');
      (allSubRevis || []).forEach(veri.oldRevision.bind(null, how));

      veri.expectHasAllTheContentsFrom(topAnno, revi);
    }, 'revi[' + reviIdx + ']')();
  },


  expectHasAllTheContentsFrom(allKnownContent, excerpt) {
    Object.entries(excerpt).forEach(function verify([key, val]) {
      if (val === undefined) { return; }
      return equal({ [key]: val }, { [key]: allKnownContent[key] });
    });
  },





};

export default veri;
