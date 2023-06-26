// -*- coding: utf-8, tab-width: 2 -*-

import sharedHotfixes from './sharedHotfixes.mjs';
import diss from '../dissect.mjs';


const job = diss.getJob();

sharedHotfixes.addSkips(job);

Object.assign(job, {

  rewriteRevHost(origRevHost) {
    let rh = origRevHost;
    if (!/^[a-z]+\./.test(rh)) { return; }
    rh = rh.replace(/^de\.uni-heidelberg\.ub\./, 'ubhd.');
    rh = rh.replace(/^de\.uni-heidelberg\./, 'uni-hd.');
    if (rh.startsWith('ubhd.serv')) { return; }
    return rh;
  },

  rewriteSaveDir(origSaveDir) {
    const wts /* with trailing slash */ = origSaveDir + '/';
    if (wts.startsWith('ubhd.sempub/provitest/')) { return; }
    if (wts.startsWith('ubhd.digi/diglit/annotationen_test/')) { return; }
    return origSaveDir;
  },

});












/* scroll */
