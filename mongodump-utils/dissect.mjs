// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import parseCliOpt from 'minimist';
import promiseFs from 'nofs';
import pEachSeries from 'p-each-series';
import getOwn from 'getown';
import CountMap from 'count-map';
import mustBe from 'typechecks-pmb/must-be.js';
import vTry from 'vtry';


import readRelaxedJsonFromStdin from './readRelaxedJsonFromStdin.mjs';
import guessPrimaryTarget from './guessPrimaryTarget.mjs';


function padIf(x, b, a) { return x && ((b || '') + x + (a || '')); }


async function cliMain() {
  const cliOpt = parseCliOpt(process.argv.slice(2));
  console.error('CLI options:', cliOpt);
  const data = await readRelaxedJsonFromStdin(cliOpt);
  const nSliced = data.length;
  const uniqueStuffs = new CountMap();

  async function parseOneAnno(anno, mongoId) {
    mustBe.nest('Mongo ID', mongoId);
    uniqueStuffs.add('mongoId:' + mongoId);
    const tgt = guessPrimaryTarget(anno);
    const saveDir = [
      tgt.revHost + (padIf(tgt.port, '_', '') || ''),
      ...tgt.pathParts.slice(0, -1),
    ].join('/');
    const saveName = [
      ...tgt.pathParts.slice(-1),
      mongoId,
      'json',
    ].join('.');
    // console.debug(saveDir, saveName);
    const asJson = JSON.stringify(anno, null, 2)
      .replace(/^\{\s+/, '{ ') + '\n';
    await promiseFs.mkdirs(saveDir);
    await promiseFs.writeFile(saveDir + '/' + saveName, asJson);
  }

  await pEachSeries([].concat(data), function topLevelAnno(anno, idx) {
    const mongoId = getOwn(anno, '_id');
    console.error({ idx, progress: idx / nSliced }, { mongoId });
    return vTry.pr(parseOneAnno, '@' + idx + '=' + mongoId + ': %s'
    )(anno, mongoId);
  });

  const dupes = uniqueStuffs.entries().reduce(function chk(dup, ent) {
    const [x, n] = ent;
    if (n > 1) { dup[x] = n; } // eslint-disable-line no-param-reassign
    return dup;
  }, {});
  console.error({ done: nSliced, progress: 1, dupes });
}


cliMain();
