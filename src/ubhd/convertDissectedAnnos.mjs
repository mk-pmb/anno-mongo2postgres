// -*- coding: utf-8, tab-width: 2 -*-

import objDive from 'objdive';

import cda from '../convertDissectedAnnos/index.mjs';
import idFormats from './idFormats.mjs';
import optimizeReviDetails from './optimizeReviDetails.mjs';
import sharedHotfixes from './sharedHotfixes.mjs';

import knownDois from './tmp.versIdToDoiPart.json';


const job = cda.getJob();
const {
  hotfixes,
} = job;


job.reHook(optimizeReviDetails);
sharedHotfixes.addSkips(job);
Object.assign(job.idFormatRegExps, idFormats.extraRegExps);
job.knownDois = knownDois;
delete knownDois[''];

const ignoreDoiAnnos = [
  '212d7693319d4',
  'b4ddd7677eef6',
  'BNgAWVT6Tlm034vtaHNl-Q',
  'FSnSLh8FQMGbqzdmKgb37g',
  'RAoXN3O5RSa1eIDo9np1DA',
];
ignoreDoiAnnos.forEach(function del(mongoId) {
  delete knownDois[mongoId];
  for (let revi = 1; revi < 8; revi += 1) {
    delete knownDois[mongoId + '_' + revi];
    delete knownDois[mongoId + '~' + revi];
  }
});


job.cliDone = async function cliDone() {
  Object.values(job.knownDois).sort().forEach(
    doi => job.assume('doiUsed:' + doi));
};


function reg(recIds, fix) {
  recIds.forEach(function register(recId) { hotfixes[recId] = fix; });
}

// function multiFix(fixes) { return (x => fixes.forEach(f => f(x))); }


function propSed(objPath, props, fixes) {
  if (!props.forEach) { return propSed(objPath, [props], fixes); }
  return function hotfixProp(anno) {
    const obj = objDive(anno.data, objPath);
    if (!obj) {
      console.warn('\npropSed: no object at path', objPath, '\n');
      return;
    }
    fixes.forEach(function applyFix(fix) {
      const rgx = fix[0] || fix;
      const tpl = fix[1] || '';
      props.forEach(function fixOneProp(prop) {
        const old = String(obj[prop] || '');
        const upd = old.replace(rgx, tpl);
        if (upd === old) {
          console.warn('\npropSed: ' + prop + ': no match for', rgx, '\n');
        } else {
          obj[prop] = upd;
        }
      });
    });
  };
}


reg([ // Removes space characters at the end of some HTML paragraphs.
  '09a70a00f6719>dp-v-1',
  '09a70a00f6719>dp-vv-1-0',
], propSed('.body.0', 'value', [/ (?=<\/p>)/g]));

reg([
  'Cd6tRIwaThmpMnetnDqJKQ>dp-cv-0-0',
  'Cd6tRIwaThmpMnetnDqJKQ>dp-cvv-0-0-0',
], propSed('', 'replyTo', [[/$/, '.1']]));

reg([
  'RVbNc1xlSDKx5k7HznPMMw>dp-v-4',
], propSed('', 'via', [[/~\d+$/, '']]));










/* scroll */
