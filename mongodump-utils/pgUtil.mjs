// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

const isoTimestampRgx = new RegExp(('^'
  + '(²²-²-²)'
  + 'T'
  + '(²:²:²)'
  + '(?:\\.\\d+|)'
  + '(Z|[\+\-]²:²)'
  + '$').replace(/²/g, '\\d\\d'), '');
const safeIdRgx = /^\w+$/;

const pgu = {

  timestampFromIsoFmt(orig) {
    const m = isoTimestampRgx.exec(orig);
    if (!m) { throw new Error('Unsupported date format: ' + orig); }
    return (m[1] + 'T' + m[2] + m[3]);
  },

  quoteId(id) {
    const safe = (safeIdRgx.exec(id) || false)[0];
    if (id === safe) { return '"' + id + '"'; }
    throw new Error('Identifier contains suspicious characters: ' + id);
  },

  quoteStr(s) { return "'" + String(s || '').replace(/'/g, "''") + "'"; },

  quoteVal(x) {
    if (x === null) { return 'NULL'; }
    if (x === undefined) { return 'NULL'; }
    const t = typeof x;
    if (t === 'string') { return pgu.quoteStr(x); }
    if ((t === 'number') && Number.isFinite(x)) { return String(x); }
    if ((t === 'object') && x) {
      const j = JSON.stringify(x);
      equal(JSON.parse(j), x);
      return pgu.quoteStr(j);
    }
    throw new TypeError('Unsupported value type: ' + t);
  },

  fmtInsert(tbl, rec) {
    const cols = Object.keys(rec);
    const ins = ('INSERT INTO ' + pgu.quoteId(tbl)
      + ' (' + cols.map(pgu.quoteId).join(', ') + ') VALUES ('
      + cols.map(c => pgu.quoteVal(rec[c])).join(', ') + ');');
    return ins;
  },

};





export default pgu;
