// -*- coding: utf-8, tab-width: 2 -*-

import cliEnvCfg from 'cfg-cli-env-180111-pmb/node.js';
import CountMapPmb from 'count-map-pmb';
import deepSortObj from 'deepsortobj';
import getOwn from 'getown';
import makeFilter from 'filter-container-entries-pmb';
import mustBe from 'typechecks-pmb/must-be.js';
import pDelay from 'delay';
import pEachSeries from 'p-each-series';
import readRelaxedJsonFromStdin from 'read-relaxed-json-from-stdin-pmb';
import vTry from 'vtry';


import mongoIdFakers from './mongoIdFakers.mjs';


const doNothing = Boolean;

const filterUnconfirmed = makeFilter({
  dive: 'confirmed',
  negate: true,
  empty: false,
  outFmt: 'dict',
});


const jobApi = {

  assume(key, ...upd) {
    const known = this.assumptions;
    const old = known.get(key);
    const a = old || {};
    Object.assign(a, ...upd);
    // ^- Update inplace to allow caching the assumption object
    //    reference in a local variable.
    if (!old) { known.set(key, a); }
    return a;
  },

  hint(k, v, w) {
    const o = this.hints[k];
    if (v !== undefined) {
      this.hints[k] = v;
      return v;
    }
    if ((o === undefined) && (w !== undefined)) {
      this.hints[k] = w;
      return w;
    }
    return o;
  },

  skipRec() { this.counters.add('skipped'); },

  reHook(func) {
    const { name } = func;
    func.orig = this[name]; // eslint-disable-line no-param-reassign
    this[name] = func;
  },

};



function trafoCli(origJobSpec) {
  const cliOpt = cliEnvCfg().allCliOpt;
  console.error('CLI options:', cliOpt);

  const report = {
    counters: new CountMapPmb(),
    errorsIds: [],
    hints: {},
  };
  const job = {
    skipMongoIds: new Set(),
    cliOpt,
    hopefullyUnique: new CountMapPmb(),
    assumptions: new Map(),
    ...jobApi,
    ...origJobSpec,
    ...report,
  };
  const coreArgs = {
    // We wrap them in getters in order to avoid bloating the error message
    // in case the trafoPr is rejected.
    getJob() { return job; },
    getReport() { return report; },
  };

  const trafoPr = pDelay(10).then(() => trafoCli.core(coreArgs));
  // ^-- The delay is a hacky way to allow simple monkey patches.
  Object.assign(trafoPr, coreArgs);
  return trafoPr;
}


trafoCli.core = async function trafoCliCore(coreArgs) {
  const job = coreArgs.getJob();
  const { cliOpt } = job;
  const report = coreArgs.getReport();

  const timeStarted = Date.now();
  await (job.cliInit || doNothing)(job);

  const determineMongoId = (function decide() {
    const fake = job.cliOpt.fakeMongoId;
    if (!fake) { return rec => getOwn(rec, '_id'); }
    return mustBe.enumDict(mongoIdFakers)(fake, 'CLI option "fakeMongoId"');
  }());

  const data = await readRelaxedJsonFromStdin({
    ...cliOpt,
    defaultLimit: 1e3,
    logFunc: console.error,
  });
  const nSliced = data.length;
  const maxErr = Math.max((+cliOpt.maxerr || 0), 0) || 1;
  const progressInterval = (+cliOpt.prgi || 1e3);
  let remainMaxErr = maxErr;
  const { eachToplevelRecord } = job;
  await pEachSeries([].concat(data), async function topLevelRecord(rec, idx) {
    if (!remainMaxErr) { return; }
    job.topRecIdx = data.offset + idx;
    const mongoId = determineMongoId(rec, job);
    if (!mongoId) { console.error('W: no _id in record!', { idx, rec }); }
    if (job.skipMongoIds.has(mongoId)) { return job.skipRec(); }

    const progress = idx / nSliced;
    if ((idx % progressInterval) === 0) {
      console.error({ idx, progress }, { mongoId });
    }
    const trace = '@' + idx + ':' + mongoId;
    try {
      await vTry.pr(eachToplevelRecord, [trace])(rec, mongoId, job);
      report.counters.add('success');
    } catch (err) {
      job.errorsIds.push(mongoId);
      if (!job.firstErrMsg) { job.firstErrMsg = String(err); }
      report.counters.add('error');
      remainMaxErr -= 1;
      console.error('v-- Error @', { idx, progress }, { mongoId });
      console.error(err.stack);
      console.error('^-- Error @', { idx, progress }, { mongoId });
    }
  });

  const timeFinished = Date.now();
  const durationMsec = timeFinished - timeStarted;

  await (job.cliDone || doNothing)(job);

  const dupes = job.hopefullyUnique.rangeFilter(2).toDict({ empty: false });
  const unconfirmedAssumptions = filterUnconfirmed(job.assumptions);

  Object.assign(report, {
    nSliced,
    counters: deepSortObj(Object.fromEntries(job.counters.entries())),
    unconfirmedAssumptions,
    dupes,
    remainMaxErr,
  });
  Object.assign(job, {
    timeStarted,
    timeFinished,
    durationMsec,
    ...report,
  });
  await (job.optimizeTrafoReport || doNothing)(job);
  console.error('Done.', {
    durationMinutes: durationMsec / 60e3,
    ...report,
  });

  if (job.firstErrMsg) { console.error('First error was:', job.firstErrMsg); }
  await (job.cliCleanup || doNothing)(job);
};


export default trafoCli;
