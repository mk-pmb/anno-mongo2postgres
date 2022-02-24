// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import nodeFs from 'fs';
import promiseFs from 'nofs';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import pEachSeries from 'p-each-series';
import safeSortedJsonify from 'safe-sortedjson';


import trafoCli from './trafoCli.mjs';
import guessSubjectTarget from './guessSubjectTarget.mjs';

const doNothing = Boolean;

function len(x) { return (+(x || false).length || 0); }
function listLenSymb(o, k, s) { return getOwn(s, len(o[k]), s.slice(-1)[0]); }

const combinedOutput = nodeFs.createWriteStream('tmp.dissect.all.json');


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
      divePath,
      mongoId,
    } = how;
    const rec = { ...anno };

    // Saving deeper entries will be deferred in order to ensure that
    // combinedOutput will provide the expectation data before any
    // verification candidates appear.
    const dv = save.splitHistoryPop(how, rec, '_revisions', 'v');
    const da = save.splitHistoryPop(how, rec, '_replies', 'a');
    await save.json(destBase + (divePath || '_'), {
      '_id': mongoId + '>' + divePath,
      '@dissect.meta': { nv: dv.n || 0, na: da.n || 0 },
      ...rec,
    });
    await dv();
    await da();
  },

  splitHistoryPop(how, annoRemains, key, diveSuffix) {
    const list = annoRemains[key];
    delete annoRemains[key]; // eslint-disable-line no-param-reassign
    const n = len(list);
    // let t = (list && typeof list);
    // if (t === 'object') { t = Object.prototype.toString.call(list); }
    // console.warn('splitHistoryPop', { divePath, t, n, key });
    if (!n) { return doNothing; }
    const divePath = how.divePath + diveSuffix;
    mustBe.ary(key + '@' + divePath, list);
    async function deferredSave() {
      await pEachSeries(list, async function saveSplitHistoryEntry(val, idx) {
        await save.splitHistory({ ...how, divePath: divePath + idx }, val);
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
    job.hopefullyUniqueThings.add('mongoId:' + mongoId);
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

    const vr = ((listLenSymb(anno, '_revisions', ['nv', '', 'v'])
      + listLenSymb(anno, '_replies', ['', 'r'])) || 's');
    job.counters.add(vr);
    const saveAsBaseName = [
      ...tgt.pathParts.slice(-1),
      mongoId,
      vr,
      '',
    ].join('.');
    await promiseFs.mkdirs(saveDir);
    await save.splitHistory({
      job,
      mongoId,
      destBase: saveDir + '/' + saveAsBaseName,
      divePath: '',
    }, anno);
  },

};

trafoCli(jobSpec);
