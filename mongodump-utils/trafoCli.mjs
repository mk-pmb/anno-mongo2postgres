// -*- coding: utf-8, tab-width: 2 -*-

import cliEnvCfg from 'cfg-cli-env-180111-pmb/node.js';
import CountMapPmb from 'count-map-pmb';
import deepSortObj from 'deepsortobj';
import getOwn from 'getown';
import pDelay from 'delay';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';


import readRelaxedJsonFromStdin from './readRelaxedJsonFromStdin.mjs';
import verify from './libVerify.mjs';

const doNothing = Boolean;


const jobApi = {

  assume(key, ...init) {
    const known = this.assumptions;
    const a = { ...known.get(key), ...init };
    known.set(key, a);
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
    job,
    report,
  };

  const trafoPr = pDelay(10).then(() => trafoCli.core(coreArgs));
  // ^-- The delay is a hacky way to allow simple monkey patches.
  Object.assign(trafoPr, coreArgs);
  return trafoPr;
}


trafoCli.core = async function trafoCliCore(coreArgs) {
  const {
    job,
    report,
  } = coreArgs;
  const { cliOpt } = job;

  const timeStarted = Date.now();
  await (job.cliInit || doNothing)(job);

  const data = await readRelaxedJsonFromStdin(cliOpt);
  const nSliced = data.length;
  const maxErr = Math.max((+cliOpt.maxerr || 0), 0) || 1;
  const progressInterval = (+cliOpt.prgi || 1e3);
  let remainMaxErr = maxErr;
  const { eachToplevelRecord } = job;
  await pEachSeries([].concat(data), async function topLevelRecord(rec, idx) {
    if (!remainMaxErr) { return; }
    job.topRecIdx = data.offset + idx;
    const mongoId = getOwn(rec, '_id');
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
  const unconfirmedAssumptions = verify.filterUnconfirmed(job.assumptions);

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
  console.error('Done.', {
    durationMinutes: durationMsec / 60e3,
    ...report,
  });

  await (job.cliCleanup || doNothing)(job);
};


export default trafoCli;
