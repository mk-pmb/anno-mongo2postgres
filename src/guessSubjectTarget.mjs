// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be';

const safeUrlRgx = /^https?:\/{2}([a-z0-9_:\.\/\-]+)$/;

const EX = function guessSubjectTarget(anno) {
  let tgt = anno.target;
  if (Array.isArray(tgt)) {
    const n = tgt.length;
    if (n < 1) { throw new Error('Found no target'); }
    if (n > 1) { throw new Error('Found too many targets'); }
    [tgt] = tgt;
  }
  tgt = (tgt.scope
    || tgt.id
    || tgt.source
    || tgt);
  mustBe.nest('Target URL', tgt);
  const um = safeUrlRgx.exec(tgt.toLowerCase());
  if (!um) { throw new Error('Unsupported target URL format: ' + tgt); }
  const pathParts = tgt.split(/\/+/).filter(Boolean).slice(1);
  let port = 0;
  const host = pathParts.shift().replace(/:\d+$/, function hasPort(m) {
    port = +m.slice(1);
    return '';
  });
  const revHost = host.split('.').reverse().join('.');
  return {
    url: tgt,
    host,
    port,
    revHost,
    pathParts,
  };
};










export default EX;
