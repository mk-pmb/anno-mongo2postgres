// -*- coding: utf-8, tab-width: 2 -*-

import sharedHotfixes from './ubhd.sharedHotfixes.mjs';
import diss from './dissect.mjs';


const { job } = diss;

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
    const sd = origSaveDir;
    if (sd.startsWith('ubhd.sempub/provitest/')) { return; }
    if (sd.startsWith('ubhd.digi/diglit/annotationen_test/')) { return; }
    return sd;
  },

});












/* scroll */
