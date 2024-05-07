// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import nodeFs from 'fs';
import promiseFs from 'nofs';
// import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import pEachSeries from 'p-each-series';
import safeSortedJsonify from 'safe-sortedjson';


import guessSubjectTarget from './guessSubjectTarget.mjs';
import makeUrlPrefixesFilter from './urlPrefixesFilter.mjs';
import rateAnnoDepthComplexity from './rateAnnoDepthComplexity.mjs';
import trafoCli from './trafoCli.mjs';

const doNothing = Boolean;
const combinedOutput = nodeFs.createWriteStream('tmp.dissect.all.json');
combinedOutput.write('[\n');

function len(x) { return (+(x || false).length || 0); }

function stringifyDivePath(dp) {
  if (dp.divePath) { return stringifyDivePath(dp.divePath); }
  return 'dp-' + [dp.types, ...dp.indices].join('-');
}


const save = {

  async json(destBase, data) {
    let text = safeSortedJsonify(data);
    text = text.replace(/(\n {2})("\w+":)( ["\d])/g, '$1$2$1 $3');
    combinedOutput.write(text + ',\n');
    if (!destBase.startsWith('void://')) {
      const destFull = destBase + '.json';
      // console.warn('saveJson', destFull);
      await promiseFs.writeFile(destFull, text + '\n');
    }
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


function splitSpace(x) { return String(x || '').split(/\s+/); }



const jobSpec = {

  rewriteRevHost: String,
  rewriteSaveDir: String,
  onlySaveDirs: makeUrlPrefixesFilter(),
  saveDumpsBasePath: 'void://',

  async cliInit(job) {
    job.onlySaveDirs.addPrefixes(splitSpace(job.cliOpt.onlySaveDirs));
    job.onlySaveDirs.addPrefixes(splitSpace(process.env.dissect_only_savedir));

    (function decideSaveDumps() {
      let sd = job.cliOpt.saveDumps;
      if (sd === undefined) { return; }
      if ((!sd) || (sd === '.') || (sd === './')) {
        sd = '';
      } else if (!sd.endsWith('/')) {
        sd += '/';
      }
      job.saveDumpsBasePath = sd; // eslint-disable-line no-param-reassign
    }());
  },


  tlrLogSkip(why, hookCtx, details) {
    const { job, mongoId, anno, origSaveDir } = hookCtx;
    let saveDir = origSaveDir;
    if (details) {
      if (details.saveDir !== undefined) {
        saveDir += ' -> ' + (String(details.saveDir) || '<empty>');
      }
    }
    const { doi } = anno;
    if (doi) {
      job.hint('skipDoiAnno:' + mongoId, { why, saveDir, doi });
      // console.warn('Skip:', mongoId, why, saveDir, { doi });
    }
  },


  async eachToplevelRecord(anno, mongoId, job) {
    mustBe.nest('Mongo ID', mongoId);
    job.hopefullyUnique.add('mongoId:' + mongoId);
    const tgt = guessSubjectTarget(anno);
    let { revHost } = tgt;
    mustBe.nest('subjectTarget reverse hostname', revHost);
    revHost = job.rewriteRevHost(revHost);
    if (!revHost) { return; }

    const origSaveDir = [
      revHost + (tgt.port ? '_' + tgt.port : ''),
      ...tgt.pathParts.slice(0, -1),
    ].join('/');
    let saveDir = origSaveDir;
    const hookCtx = { job, mongoId, anno, origSaveDir };
    saveDir = job.rewriteSaveDir(saveDir, hookCtx);
    if (!saveDir) { return job.tlrLogSkip('rewriteSaveDir', hookCtx); }
    if (!job.onlySaveDirs(saveDir, hookCtx)) {
      return job.tlrLogSkip('onlySaveDirs', hookCtx, { saveDir });
    }

    const complexity = rateAnnoDepthComplexity(anno);
    job.counters.add('tlr:' + complexity);
    // ^-- depth complexity of the TLR = Top Level Record.
    const saveAsBaseName = [
      ...tgt.pathParts.slice(-1),
      mongoId,
      complexity,
      '',
    ].join('.');

    saveDir = job.saveDumpsBasePath + saveDir;
    if (!saveDir.startsWith('void://')) {
      await promiseFs.mkdirs(saveDir);
    }

    await save.splitHistory({
      job,
      mongoId,
      destBase: saveDir + '/' + saveAsBaseName,
      divePath: { types: '', indices: [] },
    }, anno);
  },

  async cliDone() {
    console.debug('Closing combined log.');
    combinedOutput.write('null]\n');
    combinedOutput.close();
  },

};

const trafoPr = trafoCli(jobSpec);

export default trafoPr;
