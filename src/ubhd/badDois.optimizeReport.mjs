// -*- coding: utf-8, tab-width: 2 -*-

import fsPr from 'fs/promises';


const EX = async function badDoisOptimizeReport(report) {
  const uncAss = report.unconfirmedAssumptions;
  if (!uncAss) { return; }
  const prefixStr = 'legacyDoi:verified:';
  const prefixLen = prefixStr.length;

  let count = 0;
  // ^- We cannot use job.counters.add() because at this stage the job
  //    counters have already been summarized.

  let jsonBuf = '';
  Object.keys(uncAss).sort().forEach(function each(k) {
    if (!k.startsWith(prefixStr)) { return; }
    const v = uncAss[k];
    delete uncAss[k];
    const s = k.slice(prefixLen);
    jsonBuf += '\n' + JSON.stringify({ trace: s, ...v },
      null, 1).replace(/\n\s*/g, ' ') + ',';
    count += 1;
  });
  uncAss[prefixStr + 'n'] = count;
  if (jsonBuf) { jsonBuf += '\nnull'; }
  jsonBuf = '[' + jsonBuf + ']\n';
  await fsPr.writeFile('tmp.unverifiedDois.json', jsonBuf, 'UTF-8');
};


export default EX;
