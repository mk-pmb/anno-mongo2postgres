// -*- coding: utf-8, tab-width: 2 -*-

import parseCliOpt from 'minimist';
import pEachSeries from 'p-each-series';
import getOwn from 'getown';
import CountMap from 'count-map';
import vTry from 'vtry';


import readRelaxedJsonFromStdin from './readRelaxedJsonFromStdin.mjs';


async function trafoCli(origJobSpec) {
  const timeStarted = Date.now();
  const report = {
    counters: new CountMap(),
    errorsIds: [],
  };
  const job = {
    ...origJobSpec,
    timeStarted,
    hopefullyUniqueThings: new CountMap(),
    ...report,
  };
  const cliOpt = parseCliOpt(process.argv.slice(2));
  console.error('CLI options:', cliOpt);
  const data = await readRelaxedJsonFromStdin(cliOpt);
  const nSliced = data.length;

  const maxErr = Math.max((+cliOpt.maxerr || 0), 0) || 5;
  let remainMaxErr = maxErr;
  const { eachToplevelRecord } = job;
  await pEachSeries([].concat(data), async function topLevelAnno(anno, idx) {
    if (!remainMaxErr) { return; }
    const mongoId = getOwn(anno, '_id');
    const progress = idx / nSliced;
    if ((idx % 1e3) === 0) { console.error({ idx, progress }, { mongoId }); }
    const trace = '@' + idx + '=' + mongoId;
    try {
      await vTry.pr(eachToplevelRecord, [trace])(anno, mongoId, job);
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

  const dupes = job.hopefullyUniqueThings.entries().reduce((dup, ent) => {
    const [x, n] = ent;
    if (n > 1) { dup[x] = n; } // eslint-disable-line no-param-reassign
    return dup;
  }, {});
  const timeFinished = Date.now();
  const durationMsec = timeFinished - timeStarted;
  Object.assign(report, {
    nSliced,
    counters: Object.fromEntries(job.counters.entries()),
    dupes,
    remainMaxErr,
  });
  Object.assign(job, {
    timeFinished,
    durationMsec,
    ...report,
  });
  console.error('Done.', {
    durationMinutes: durationMsec / 60e3,
    ...report,
  });
}


export default trafoCli;
