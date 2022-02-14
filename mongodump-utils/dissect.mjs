// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import promiseFs from 'nofs';
import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';


import trafoCli from './trafoCli.mjs';
import guessPrimaryTarget from './guessPrimaryTarget.mjs';

function len(x) { return (+(x || false).length || 0); }
function listLenSymb(o, k, s) { return getOwn(s, len(o[k]), s.slice(-1)[0]); }


const jobSpec = {

  async eachToplevelAnno(anno, mongoId, job) {
    mustBe.nest('Mongo ID', mongoId);
    job.hopefullyUniqueThings.add('mongoId:' + mongoId);
    const tgt = guessPrimaryTarget(anno);
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
      + listLenSymb(anno, '_replies', ['', 'r'])) || 'e');
    job.counters.add(vr);
    const saveName = [
      ...tgt.pathParts.slice(-1),
      mongoId,
      vr,
      'json',
    ].join('.');
    // console.debug(saveDir, saveName);
    const asJson = JSON.stringify(anno, null, 2)
      .replace(/^\{\s+/, '{ ') + '\n';
    await promiseFs.mkdirs(saveDir);
    await promiseFs.writeFile(saveDir + '/' + saveName, asJson);
  },

};

trafoCli(jobSpec);
