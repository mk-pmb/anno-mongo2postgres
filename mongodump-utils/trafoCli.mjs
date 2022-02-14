// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import parseCliOpt from 'minimist';
import pEachSeries from 'p-each-series';
import getOwn from 'getown';
import CountMap from 'count-map';
import vTry from 'vtry';


import readRelaxedJsonFromStdin from './readRelaxedJsonFromStdin.mjs';


async function trafoCli(origJobSpec) {
  const timeStarted = Date.now();
  const job = {
    ...origJobSpec,
    timeStarted,
    hopefullyUniqueThings: new CountMap(),
    stats: new CountMap(),
  };
  const cliOpt = parseCliOpt(process.argv.slice(2));
  console.error('CLI options:', cliOpt);
  const data = await readRelaxedJsonFromStdin(cliOpt);
  const nSliced = data.length;

  const { eachToplevelAnno } = job;
  await pEachSeries([].concat(data), function topLevelAnno(anno, idx) {
    const mongoId = getOwn(anno, '_id');
    console.error({ idx, progress: idx / nSliced }, { mongoId });
    return vTry.pr(eachToplevelAnno, '@' + idx + '=' + mongoId + ': %s'
    )(anno, mongoId, job);
  });

  const dupes = job.hopefullyUniqueThings.entries().reduce((dup, ent) => {
    const [x, n] = ent;
    if (n > 1) { dup[x] = n; } // eslint-disable-line no-param-reassign
    return dup;
  }, {});
  const timeFinished = Date.now();
  const durationMsec = timeFinished - timeStarted;
  const stats = Object.fromEntries(job.stats.entries());
  Object.assign(job, {
    timeFinished,
    durationMsec,
    dupes,
    stats,
  });
  console.error({
    done: nSliced,
    progress: 1,
    durationMinutes: durationMsec / 60e3,
    dupes,
    stats,
  });
}


export default trafoCli;
