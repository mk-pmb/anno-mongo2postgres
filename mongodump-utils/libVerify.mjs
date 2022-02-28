// -*- coding: utf-8, tab-width: 2 -*-

import objPop from 'objpop';
import getOwn from 'getown';
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
      job,
    } = how;
    mustBe('obj', 'how.job')(job);
    vTry(function fallibleVerifyRevision() {
      mustBe.nest('containerAnnoId', containerAnnoId);
      const revi = { ...origRevi };
      const popRevi = objPop.d(revi, { mustBe });
      const reviNum = reviIdx + 1;

      veri.reviUrl(popRevi, 'id', containerAnnoId + '~' + reviNum);
      veri.reviUrl(popRevi, 'versionOf', containerAnnoId);
      veri.oldReviDoi(expectedData.doi, popRevi('doi'), reviNum, how);

      const allSubRevis = popRevi.mustBe('undef | ary', '_revisions');
      (allSubRevis || []).forEach(veri.oldRevision.bind(null, how));

      veri.expectHasAllTheContentsFrom(expectedData, revi, job);
    }, containerAnnoId + ' > revi[' + reviIdx + ']')();
  },


  oldReviDoi(exDoi, reviDoi, reviNum, how) {
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

    const rpr = how.job.badDoiReportPrefix;
    if (rpr && reviDoi.startsWith(rpr)) {
      const caid = how.containerAnnoId;
      const reviSuf = reviDoi.slice(rpr.length + caid.length);
      const reviDp = how.reviDivePath.str;
      // console.warn({ containerAnnoId, exSuf, reviSuf, reviDp });
      const badDoiLine = ('["' + caid + '", '
        + reviDp.replace(/^dp-v-/, '    ').slice(-3)
        + ', "' + reviSuf + '"]');
      how.job.hint('badDoi', undefined, []).push(badDoiLine);
      how.job.counters.add('unacknowledgedBadDoi');
      return;
    }

    throw doiErr;
  },


  expectHasAllTheContentsFrom(allKnownContent, excerpt, job) {
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
      if (key === 'creator') {
        return vTry(veri.expectSameCreator, explain)(val, want, job);
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


  expectSameCreator(ac, ex, job) {
    const cas = job.creatorAliases;
    if (cas && ex && ex.id && ac && ac.id) {
      if (ac.id === ex.id) { return; }
      const alias = getOwn(cas, ac.id);
      if (alias && (ex.id === alias)) {
        job.counters.add('usingCreatorAlias');
        job.counters.add('usingCreatorAlias:' + alias);
        return;
      }
    }
    equal(ac, ex);
  },





};

export default veri;
