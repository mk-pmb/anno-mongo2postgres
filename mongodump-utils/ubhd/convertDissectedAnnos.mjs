// -*- coding: utf-8, tab-width: 2 -*-

import eq from 'equal-pmb';
import objDive from 'objdive';

import badDois from './badDois.json';
import cda from '../convertDissectedAnnos/index.mjs';
import creatorAliases from './creatorAliases.json';
import idFormats from './idFormats.mjs';
import optimizeReviDetails from './optimizeReviDetails.mjs';
import sharedHotfixes from './sharedHotfixes.mjs';
import ubFacts from './facts.mjs';


const { job } = cda;
const {
  hotfixes,
} = job;


job.reHook(optimizeReviDetails);
sharedHotfixes.addSkips(job);
Object.assign(job.idFormatRegExps, idFormats.extraRegExps);


Object.assign(job, {
  creatorAliases,
  badDoiReportPrefix: ubFacts.digiDoi,
});

function reg(recIds, fix) {
  recIds.forEach(function register(recId) { hotfixes[recId] = fix; });
}


function propSed(objPath, prop, fixes) {
  return function hotfixProp(anno) {
    const obj = objDive(anno.data, objPath);
    fixes.forEach(function applyFix(fix) {
      const rgx = fix[0] || fix;
      const tpl = fix[1] || '';
      const old = obj[prop];
      const upd = old.replace(rgx, tpl);
      if (upd === old) {
        console.warn('\npropSed: ' + prop + ': no match for', rgx, '\n');
      } else {
        obj[prop] = upd;
      }
    });
  };
}


reg([
  '09a70a00f6719>dp-v-1',
  '09a70a00f6719>dp-vv-1-0',
], propSed('.body.0', 'value', [/ (?=<\/p><p>(?:Wenn |Neben |\(3\)))/g]));

reg([
  'Cd6tRIwaThmpMnetnDqJKQ>dp-cv-0-0',
  'Cd6tRIwaThmpMnetnDqJKQ>dp-cvv-0-0-0',
], propSed('', 'replyTo', [[/$/, '.1']]));



function badDoi(mongoId, recIdSuffix, doiPrefix, badSuffix) {
  function killDoi(anno) {
    const { data } = anno;
    eq(data.doi, doiPrefix + mongoId + badSuffix);
    delete data.doi;
    job.counters.add('acknowledgedBadDoi');
  }
  hotfixes[mongoId + recIdSuffix] = killDoi;
}

badDois.filter(Boolean).forEach((item) => {
  const [mongoId, reviIdx, wrongSuffix] = item;
  badDoi(mongoId, '>dp-v-' + reviIdx, ubFacts.digiDoi, wrongSuffix);
});








/* scroll */
