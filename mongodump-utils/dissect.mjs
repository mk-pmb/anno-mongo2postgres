// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import nodeFs from 'fs';
import promiseFs from 'nofs';
// import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import pEachSeries from 'p-each-series';
import safeSortedJsonify from 'safe-sortedjson';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';
import rateAnnoDepthComplexity from './rateAnnoDepthComplexity.mjs';

const doNothing = Boolean;
const combinedOutput = nodeFs.createWriteStream('tmp.dissect.all.json');

function len(x) { return (+(x || false).length || 0); }

function stringifyDivePath(dp) {
  if (dp.divePath) { return stringifyDivePath(dp.divePath); }
  return 'dp-' + [dp.types, ...dp.indices].join('-');
}


const save = {

  async json(destBase, data) {
    const text = safeSortedJsonify(data) + '\n';
    const destFull = destBase + '.json';
    // console.warn('saveJson', destFull);
    combinedOutput.write(text);
    await promiseFs.writeFile(destFull, text);
  },

  async splitHistory(how, anno) {
    const {
      destBase,
      mongoId,
    } = how;
    const rec = { ...anno };

    // Saving deeper entries will be deferred in order to ensure that
    // combinedOutput will provide the expectation data before any
    // verification candidates appear.
    const dv = save.splitHistoryPop(how, rec, '_revisions', 'v'); // version
    const dc = save.splitHistoryPop(how, rec, '_replies', 'c'); // comment
    how.job.counters.add('dp:' + how.divePath.types);
    const divePath = stringifyDivePath(how);
    await save.json(destBase + divePath, {
      '_id': mongoId + '>' + divePath,
      '@dissect.meta': { nv: dv.n || 0, nc: dc.n || 0 },
      ...rec,
    });
    await dv();
    await dc();
  },

  splitHistoryPop(how, annoRemains, key, diveTypeLetter) {
    const list = annoRemains[key];
    delete annoRemains[key]; // eslint-disable-line no-param-reassign
    const n = len(list);
    if (!n) { return doNothing; }
    mustBe.ary(key + '@' + stringifyDivePath(how), list);
    const oldDP = how.divePath;
    const subDT = oldDP.types + diveTypeLetter;
    async function deferredSave() {
      await pEachSeries(list, async function saveSplitHistoryEntry(val, idx) {
        const subDP = { types: subDT, indices: [...oldDP.indices, idx] };
        await save.splitHistory({ ...how, divePath: subDP }, val);
        how.job.counters.add(key);
      });
    }
    Object.assign(deferredSave, { n });
    return deferredSave;
  },

};




const jobSpec = {

  async eachToplevelRecord(anno, mongoId, job) {
    mustBe.nest('Mongo ID', mongoId);
    job.hopefullyUnique.add('mongoId:' + mongoId);
    const tgt = guessSubjectTarget(anno);
    let { revHost } = tgt;
    if (!/^[a-z]+\./.test(revHost)) { return; }
    revHost = revHost.replace(/^de\.uni-heidelberg\.ub\./, 'ubhd.');
    revHost = revHost.replace(/^de\.uni-heidelberg\./, 'uni-hd.');
    if (revHost.startsWith('ubhd.serv')) { return; }

    const saveDir = [
      revHost + (tgt.port ? '_' + tgt.port : ''),
      ...tgt.pathParts.slice(0, -1),
    ].join('/');
    if (saveDir.startsWith('ubhd.sempub/provitest/')) { return; }

    const complexity = rateAnnoDepthComplexity(anno);
    job.counters.add('tlr:' + complexity);
    const saveAsBaseName = [
      ...tgt.pathParts.slice(-1),
      mongoId,
      complexity,
      '',
    ].join('.');
    await promiseFs.mkdirs(saveDir);
    await save.splitHistory({
      job,
      mongoId,
      destBase: saveDir + '/' + saveAsBaseName,
      divePath: { types: '', indices: [] },
    }, anno);
  },

};

trafoCli(jobSpec);
