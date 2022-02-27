// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import equal from 'equal-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';
import makeFilter from 'filter-container-entries-pmb';

const namedEqual = equal.named.deepStrictEqual;



const veri = {

  annoBaseUrl: 'https://anno.ub.uni-heidelberg.de/anno/',

  filterUnconfirmed: makeFilter({
    dive: 'confirmed',
    negate: true,
    empty: false,
    outFmt: 'dict',
  }),

  reviUrl(pop, key, slug) {
    mustBe.nest('slug', slug);
    pop.mustBe([['oneOf', [
      undefined,
      veri.annoBaseUrl + slug,
      veri.annoBaseUrl + 'anno/' + slug,
    ]]], key);
  },


  oldRevision(how, origRevi, reviIdx) {
    const {
      expectedData,
      containerAnnoId,
    } = how;
    vTry(function fallibleVerifyRevision() {
      mustBe.nest('containerAnnoId', containerAnnoId);
      const revi = { ...origRevi };
      const popRevi = objPop.d(revi, { mustBe });
      const reviNum = reviIdx + 1;

      veri.reviUrl(popRevi, 'id', containerAnnoId + '~' + reviNum);
      veri.reviUrl(popRevi, 'versionOf', containerAnnoId);

      const exDoi = expectedData.doi;
      const reviDoi = popRevi('doi');
      if (exDoi) {
        mustBe([['oneOf', [
          undefined,
          (exDoi + '~' + reviNum),
          (exDoi + '_' + reviNum),
        ]]], 'DOI-bearing annotation > revision > doi')(reviDoi);
      } else {
        mustBe('undef', 'DOI-less annotation > revision > doi')(reviDoi);
      }

      const allSubRevis = popRevi.mustBe('undef | ary', '_revisions');
      (allSubRevis || []).forEach(veri.oldRevision.bind(null, how));

      veri.expectHasAllTheContentsFrom(expectedData, revi);
    }, containerAnnoId + ' > revi[' + reviIdx + ']')();
  },


  expectHasAllTheContentsFrom(allKnownContent, excerpt) {
    mustBe('nonEmpty obj', 'allKnownContent')(allKnownContent);
    mustBe('nonEmpty obj', 'excerpt')(excerpt);
    Object.entries(excerpt).forEach(function verify([key, val]) {
      if (val === undefined) { return; }
      const want = allKnownContent[key];
      const explain = ("Excerpt property '" + key
        + "' (+) differs from expectation (-)");
      if (key === 'body') {
        return vTry(veri.expectSameBodies, explain)(val, want);
      }
      namedEqual(explain, val, want);
    });
  },


  expectSameBodies(origAc, origEx) {
    const acs = [].concat(origAc);
    const exs = [].concat(origEx);
    namedEqual('Number of body parts', acs.length, exs.length);

    function cmpPart(ac, ex) {
      const act = (ac && typeof ac);
      if (act !== 'object') { return equal(ac, ex); }
      namedEqual('type', act, (ex && typeof ex));
      namedEqual('everything except value',
        { ...ac, value: null },
        { ...ex, value: null });
      namedEqual('value', ac.value, ex.value);
    }

    acs.forEach(function cmpEach(ac, idx) {
      vTry(cmpPart, 'body[' + idx + ']')(ac, exs[idx]);
    });
  },





};

export default veri;
