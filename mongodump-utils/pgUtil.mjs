// -*- coding: utf-8, tab-width: 2 -*-

import equal from 'equal-pmb';

const doNothing = Boolean;
const namedEqual = equal.named.deepStrictEqual;


const isoTimestampRgx = new RegExp(('^'
  + '(²²-²-²)'
  + 'T'
  + '(²:²:²)'
  + '(?:\\.\\d+|)'
  + '(Z|[\+\-]²:²)'
  + '$').replace(/²/g, '\\d\\d'), '');
const safeIdRgx = /^\w+$/;


function fmtInsertStreamWriter(rec, insHead, valuesGlued) {
  const stm = rec.STREAM;
  if (!stm) { return; }
  if (stm.insertStatement) {
    namedEqual('Column names list for stm ' + String(stm.name || stm),
      stm.insertStatement, insHead);
  } else {
    stm.insertStatement = insHead;
  }
  let more = stm.maxMoreRows;
  if ((+more || 0) < 1) {
    if (more !== undefined) { stm.write(';\n\n'); }
    stm.write(insHead);
    stm.write(' VALUES\n');
    more = 800;
  } else {
    stm.write(',\n');
  }
  stm.maxMoreRows = more - 1;
  stm.write('  ');
  stm.write(valuesGlued);
}



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
      namedEqual('Object decoded from JSON', JSON.parse(j), x);
      return pgu.quoteStr(j);
    }
    throw new TypeError('Unsupported value type: ' + t);
  },

  fmtInsert: function fmt(rec, ...merge) {
    if (merge.length) { return fmt(Object.assign({}, rec, ...merge)); }
    const cols = Object.keys(rec).filter(k => /^[a-z]/.test(k));
    const colNamesGlued = cols.map(pgu.quoteId).join(', ');
    const insHead = ('INSERT INTO ' + pgu.quoteId(rec.TABLE)
      + ' (' + colNamesGlued + ')');
    const valuesQuoted = cols.map(c => pgu.quoteVal(rec[c]));
    const valuesGlued = '(' + valuesQuoted.join(', ') + ')';
    const insFull = (insHead + ' VALUES ' + valuesGlued + ';');
    (rec.PRINT || doNothing)(insFull);
    fmtInsertStreamWriter(rec, insHead, valuesGlued);
    return insFull;
  },

};





export default pgu;
