// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

function makeToplist(allDocs, grouper) {
  const counts = new Map();
  let max = 0;
  allDocs.forEach((docData) => {
    const gr = grouper(docData);
    const n = (+counts.get(gr) || 0) + 1;
    counts.set(gr, n);
    if (n > max) { max = n; }
  });
  const padZeroes = String(max).replace(/\S/g, '0');
  const padLen = padZeroes.length;
  function padNum(n) { return (padZeroes + n).slice(-padLen); }
  let topList = Array.from(counts.entries());
  topList = topList.map(([k, v]) => padNum(v) + '\t' + k);
  topList = topList.sort();
  topList = topList.map((orig) => {
    let ent = orig;
    ent = ent.replace(/^0+(?=\d)/, m => m.replace(/0/g, ' '));
    return ent;
  });
  console.log(topList.join('\n'));
}




export default makeToplist;
