// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';


function parseDivePath(dpStr) {
  if (!dpStr) {
    return {
      str: '',
      commentDepth: 0,
      commentIndices: [],
      container: '',
      versionDepth: 0,
      versionIndices: [],
    };
  }

  const [prefix, letters, ...args] = dpStr.split(/\-/);
  equal(prefix, 'dp');
  const m = /^(c*)(v*)$/.exec(letters);
  if (!m) { return; }
  equal(letters.length, args.length);
  const cs = m[1];
  const vs = m[2];

  const commentDepth = cs.length;
  const commentIndices = args.slice(0, commentDepth).map(Number);
  equal(commentDepth, commentIndices.length);

  const container = (cs && ['dp', cs, ...commentIndices].join('-'));
  // console.error({ dp: dpStr, ci: commentIndices, ctr: container });

  const dp = {
    str: dpStr,
    typeLettes: { all: letters, cs, vs },
    commentDepth,
    commentIndices,
    container,
    versionIndices: args.slice(commentDepth).map(Number),
    versionDepth: vs.length,
  };
  equal(dp.versionDepth, dp.versionIndices.length);
  return dp;
}


export default parseDivePath;
